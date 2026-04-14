import { z } from "zod";
import { OrderStatus, OrderType, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";
import { createRazorpayOrder } from "@/lib/integrations/razorpay";
import { transitionOrderStatus } from "@/lib/services/order-transition";
import {
  computeCouponDiscount,
  couponErrorMessage,
  normalizeCouponCode,
  type CouponApplyErrorCode,
} from "@/lib/coupon-apply";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  addressId: z.string().min(1),
  slotId: z.string().optional(),
  couponCode: z.string().optional(),
  payWith: z.enum(["RAZORPAY", "COD"]),
});

async function getSettingBool(key: string, defaultValue: boolean) {
  const row = await prisma.adminSetting.findUnique({ where: { key } });
  if (row?.value === undefined || row.value === null) return defaultValue;
  return Boolean(row.value);
}

export async function POST(req: Request) {
  try {
    const { profile } = await requireCustomer(req);
    const body = bodySchema.parse(await req.json());

    const codEnabled = await getSettingBool("cod.enabled", false);
    if (body.payWith === "COD" && !codEnabled) return errorJson("COD disabled", 400);

    const result = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { customerId: profile.id },
        include: { items: { include: { meal: { include: { nutrition: true } } } } },
      });
      if (!cart?.items.length) throw new Error("EMPTY_CART");

      const address = await tx.address.findFirst({
        where: { id: body.addressId, customerId: profile.id },
        include: { zone: true },
      });
      if (!address?.zoneId || !address.zone?.isActive) throw new Error("ADDRESS_ZONE");

      const pinOk = await tx.zonePincode.findFirst({
        where: { zoneId: address.zoneId, pincode: address.pincode },
      });
      if (!pinOk) throw new Error("PINCODE");

      let slot = null as null | { id: string; capacity: number; booked: number; zoneId: string | null };
      if (body.slotId) {
        const s = await tx.deliverySlot.findFirst({
          where: { id: body.slotId, isActive: true },
        });
        if (!s) throw new Error("SLOT");
        if (s.zoneId && s.zoneId !== address.zoneId) throw new Error("SLOT_ZONE");
        if (s.booked >= s.capacity) throw new Error("SLOT_FULL");
        await tx.deliverySlot.update({
          where: { id: s.id },
          data: { booked: { increment: 1 } },
        });
        slot = s;
      }

      let subtotal = new Prisma.Decimal(0);
      for (const line of cart.items) {
        subtotal = subtotal.add(line.unitPrice.mul(line.quantity));
      }

      let discount = new Prisma.Decimal(0);
      let shippingDiscount = new Prisma.Decimal(0);
      let appliedCouponId: string | null = null;
      if (body.couponCode) {
        const normalized = normalizeCouponCode(body.couponCode);
        const coupon = await tx.coupon.findFirst({
          where: {
            code: normalized,
            deletedAt: null,
          },
          include: { targetedCustomers: true, targetedMeals: true },
        });
        const lines = cart.items.map((ci) => ({
          mealId: ci.mealId,
          quantity: ci.quantity,
          unitPrice: ci.unitPrice,
        }));
        const customerOrderCount = await tx.order.count({ where: { customerId: profile.id } });
        const customerUsageCount = coupon ? await tx.couponUsage.count({ where: { couponId: coupon.id, customerId: profile.id } }) : 0;
        const applied = computeCouponDiscount(coupon, profile.id, lines, new Date(), {
          customerProfileId: profile.id,
          customerOrderCount,
          customerUsageCount,
          deliveryFee: address.zone.baseDeliveryFee,
        });
        if (!applied.ok) {
          throw new Error(applied.code);
        }
        discount = applied.discount;
        shippingDiscount = applied.shippingDiscount;
        appliedCouponId = coupon!.id;
        await tx.coupon.update({
          where: { id: coupon!.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      const rawDeliveryFee = address.zone.baseDeliveryFee;
      const deliveryFee = rawDeliveryFee.sub(shippingDiscount).lt(0) ? new Prisma.Decimal(0) : rawDeliveryFee.sub(shippingDiscount);
      const afterDiscount = subtotal.sub(discount);
      if (afterDiscount.lt(address.zone.minOrderAmount)) throw new Error("MIN_ORDER");

      const taxRate = address.zone.taxRatePercent ?? new Prisma.Decimal(0);
      const taxable = afterDiscount.add(deliveryFee);
      const tax = taxable.mul(taxRate).div(100);
      const total = afterDiscount.add(deliveryFee).add(tax);

      const order = await tx.order.create({
        data: {
          customerId: profile.id,
          type: OrderType.ONE_TIME,
          status: OrderStatus.PENDING_PAYMENT,
          zoneId: address.zoneId,
          addressSnapshot: {
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            lat: address.lat?.toString(),
            lng: address.lng?.toString(),
            label: address.label,
          },
          slotId: slot?.id,
          subtotal,
          deliveryFee,
          tax,
          discount,
          total,
          items: {
            create: cart.items.map((ci) => ({
              mealId: ci.mealId,
              quantity: ci.quantity,
              unitPrice: ci.unitPrice,
              nutritionSnapshot: ci.meal.nutrition
                ? {
                    calories: ci.meal.nutrition.calories,
                    proteinG: ci.meal.nutrition.proteinG.toString(),
                    carbG: ci.meal.nutrition.carbG.toString(),
                    fatG: ci.meal.nutrition.fatG.toString(),
                    fiberG: ci.meal.nutrition.fiberG.toString(),
                  }
                : undefined,
            })),
          },
          payment: {
            create: {
              status: PaymentStatus.PENDING,
              method: body.payWith,
              amount: total,
            },
          },
          statusLogs: { create: { status: OrderStatus.PENDING_PAYMENT } },
        },
        include: { payment: true },
      });

      if (appliedCouponId) {
        await tx.couponUsage.create({
          data: { couponId: appliedCouponId, orderId: order.id, customerId: profile.id },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      if (body.payWith === "COD") {
        await tx.payment.update({
          where: { orderId: order.id },
          data: { status: PaymentStatus.CAPTURED },
        });
        await transitionOrderStatus(tx, { orderId: order.id, to: OrderStatus.PAID });
        await transitionOrderStatus(tx, { orderId: order.id, to: OrderStatus.CONFIRMED });
      }

      return order;
    });

    if (body.payWith === "RAZORPAY") {
      const amountPaise = Math.round(Number(result.total) * 100);
      const rz = await createRazorpayOrder(amountPaise, result.id);
      if (rz) {
        await prisma.payment.update({
          where: { orderId: result.id },
          data: { providerOrderId: rz.id, rawPayload: rz as object },
        });
        return json({
          orderId: result.id,
          razorpayOrderId: rz.id,
          amountPaise,
          keyId: process.env.RAZORPAY_KEY_ID ?? null,
        });
      }
      return json({
        orderId: result.id,
        razorpayOrderId: null,
        amountPaise,
        mock: true,
        message: "Razorpay not configured — use verify with mock signature in dev",
      });
    }

    return json({ orderId: result.id, status: "CONFIRMED" });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    const code = e instanceof Error ? e.message : "UNKNOWN";
    const map: Record<string, string> = {
      EMPTY_CART: "Cart is empty",
      ADDRESS_ZONE: "Invalid delivery address",
      PINCODE: "Pincode not serviceable",
      SLOT: "Invalid slot",
      SLOT_ZONE: "Slot not available for this address",
      SLOT_FULL: "Delivery slot is full",
      MIN_ORDER: "Below minimum order for your zone",
    };
    const couponCodes: CouponApplyErrorCode[] = [
      "COUPON_NOT_FOUND",
      "COUPON_INACTIVE",
      "COUPON_EXPIRED",
      "COUPON_NOT_STARTED",
      "COUPON_EXHAUSTED",
      "COUPON_USER_LIMIT",
      "COUPON_FIRST_ORDER",
      "COUPON_MIN_ORDER",
      "COUPON_CUSTOMER",
      "COUPON_MEALS",
      "COUPON_NO_DISCOUNT",
    ];
    if (couponCodes.includes(code as CouponApplyErrorCode)) {
      return errorJson(couponErrorMessage(code as CouponApplyErrorCode), 400, code);
    }
    if (map[code]) return errorJson(map[code], 400, code);
    return errorJson("Server error", 500);
  }
}
