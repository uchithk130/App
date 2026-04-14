import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";
import { computeCouponDiscount } from "@/lib/coupon-apply";

export const dynamic = "force-dynamic";

function discountLabel(
  percentOff: { toString(): string } | null,
  amountOff: { toString(): string } | null,
  freeShipping: boolean
): string {
  if (freeShipping && !percentOff && !amountOff) return "Free shipping";
  const parts: string[] = [];
  if (percentOff) parts.push(`${percentOff.toString()}% off`);
  if (amountOff) parts.push(`₹${amountOff.toString()} off`);
  if (freeShipping) parts.push("+ free shipping");
  return parts.join(" ") || "Discount";
}

/** Coupons the signed-in customer can use with their current cart (active, in date, eligible). */
export async function GET(req: Request) {
  try {
    const { profile } = await requireCustomer(req);
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

    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: { targetedCustomers: true, targetedMeals: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 100,
    });

    const customerOrderCount = await prisma.order.count({ where: { customerId: profile.id } });

    const items: {
      id: string;
      code: string;
      title: string | null;
      description: string | null;
      discountLabel: string;
      freeShipping: boolean;
      percentOff: string | null;
      amountOff: string | null;
      maxDiscount: string | null;
      minOrderAmount: string | null;
      validFrom: string | null;
      expiresAt: string | null;
      firstOrderOnly: boolean;
      termsAndConditions: string | null;
      displayBadge: string | null;
      applicable: boolean;
      inapplicableReason: string | null;
    }[] = [];

    for (const c of coupons) {
      if (c.maxUses != null && c.usedCount >= c.maxUses) continue;
      const customerUsageCount = await prisma.couponUsage.count({
        where: { couponId: c.id, customerId: profile.id },
      });
      const r = computeCouponDiscount(c, profile.id, lines, now, {
        customerProfileId: profile.id,
        customerOrderCount,
        customerUsageCount,
      });
      items.push({
        id: c.id,
        code: c.code,
        title: c.title,
        description: c.description,
        discountLabel: discountLabel(c.percentOff, c.amountOff, c.freeShipping),
        freeShipping: c.freeShipping,
        percentOff: c.percentOff?.toString() ?? null,
        amountOff: c.amountOff?.toString() ?? null,
        maxDiscount: c.maxDiscount?.toString() ?? null,
        minOrderAmount: c.minOrderAmount?.toString() ?? null,
        validFrom: c.validFrom?.toISOString() ?? null,
        expiresAt: c.expiresAt?.toISOString() ?? null,
        firstOrderOnly: c.firstOrderOnly,
        termsAndConditions: c.termsAndConditions,
        displayBadge: c.displayBadge,
        applicable: r.ok,
        inapplicableReason: r.ok ? null : r.message,
      });
    }

    return json({ items });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
