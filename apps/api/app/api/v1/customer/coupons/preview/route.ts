import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";
import { computeCouponDiscount, normalizeCouponCode } from "@/lib/coupon-apply";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  code: z.string().min(1),
});

/** Validate a coupon code against the current cart (no side effects). */
export async function POST(req: Request) {
  try {
    const { profile } = await requireCustomer(req);
    const body = bodySchema.parse(await req.json());
    const normalized = normalizeCouponCode(body.code);

    const cart = await prisma.cart.findUnique({
      where: { customerId: profile.id },
      include: { items: true },
    });
    const lines =
      cart?.items.map((ci) => ({
        mealId: ci.mealId,
        quantity: ci.quantity,
        unitPrice: ci.unitPrice,
      })) ?? [];

    const coupon = await prisma.coupon.findFirst({
      where: { code: normalized, deletedAt: null },
      include: { targetedCustomers: true, targetedMeals: true },
    });

    const customerOrderCount = await prisma.order.count({ where: { customerId: profile.id } });
    const customerUsageCount = coupon ? await prisma.couponUsage.count({ where: { couponId: coupon.id, customerId: profile.id } }) : 0;

    const r = computeCouponDiscount(coupon, profile.id, lines, new Date(), {
      customerProfileId: profile.id,
      customerOrderCount,
      customerUsageCount,
    });
    if (!r.ok) {
      return json({
        valid: false,
        message: r.message,
        discount: null,
        discountBase: null,
      });
    }

    return json({
      valid: true,
      message: null as string | null,
      discount: r.discount.toString(),
      discountBase: r.discountBase.toString(),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
