import { Prisma } from "@prisma/client";

export type CouponForApply = {
  id: string;
  percentOff: Prisma.Decimal | null;
  amountOff: Prisma.Decimal | null;
  freeShipping: boolean;
  maxDiscount: Prisma.Decimal | null;
  minOrderAmount: Prisma.Decimal | null;
  maxUses: number | null;
  perUserLimit: number | null;
  usedCount: number;
  validFrom: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  firstOrderOnly: boolean;
  deletedAt: Date | null;
  appliesToAllCustomers: boolean;
  appliesToAllMeals: boolean;
  targetedCustomers: { customerId: string }[];
  targetedMeals: { mealId: string }[];
};

export type CartLineForCoupon = { mealId: string; quantity: number; unitPrice: Prisma.Decimal };

export type CouponApplyContext = {
  customerProfileId: string;
  customerOrderCount?: number;
  customerUsageCount?: number;
  deliveryFee?: Prisma.Decimal;
};

export type CouponApplyErrorCode =
  | "COUPON_NOT_FOUND"
  | "COUPON_INACTIVE"
  | "COUPON_EXPIRED"
  | "COUPON_NOT_STARTED"
  | "COUPON_EXHAUSTED"
  | "COUPON_USER_LIMIT"
  | "COUPON_FIRST_ORDER"
  | "COUPON_MIN_ORDER"
  | "COUPON_CUSTOMER"
  | "COUPON_MEALS"
  | "COUPON_NO_DISCOUNT";

const MESSAGES: Record<CouponApplyErrorCode, string> = {
  COUPON_NOT_FOUND: "Invalid or unknown coupon code.",
  COUPON_INACTIVE: "This coupon is not active.",
  COUPON_EXPIRED: "This coupon has expired.",
  COUPON_NOT_STARTED: "This coupon is not yet valid.",
  COUPON_EXHAUSTED: "This coupon has reached its usage limit.",
  COUPON_USER_LIMIT: "You have already used this coupon the maximum number of times.",
  COUPON_FIRST_ORDER: "This coupon is only valid for first orders.",
  COUPON_MIN_ORDER: "Your order does not meet the minimum amount for this coupon.",
  COUPON_CUSTOMER: "This coupon is not available for your account.",
  COUPON_MEALS: "Your cart has no items this coupon applies to.",
  COUPON_NO_DISCOUNT: "This coupon does not apply to your order.",
};

export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase();
}

function eligibleCustomer(coupon: CouponForApply, customerProfileId: string): boolean {
  if (coupon.appliesToAllCustomers) return true;
  return coupon.targetedCustomers.some((t) => t.customerId === customerProfileId);
}

function discountBaseForCart(coupon: CouponForApply, cartLines: CartLineForCoupon[]): Prisma.Decimal {
  if (coupon.appliesToAllMeals) {
    return cartLines.reduce(
      (acc, line) => acc.add(line.unitPrice.mul(line.quantity)),
      new Prisma.Decimal(0)
    );
  }
  const mealSet = new Set(coupon.targetedMeals.map((m) => m.mealId));
  return cartLines.reduce((acc, line) => {
    if (!mealSet.has(line.mealId)) return acc;
    return acc.add(line.unitPrice.mul(line.quantity));
  }, new Prisma.Decimal(0));
}

export function computeCouponDiscount(
  coupon: CouponForApply | null,
  customerProfileId: string,
  cartLines: CartLineForCoupon[],
  now = new Date(),
  context?: Partial<CouponApplyContext>
):
  | { ok: true; discount: Prisma.Decimal; discountBase: Prisma.Decimal; shippingDiscount: Prisma.Decimal }
  | { ok: false; code: CouponApplyErrorCode; message: string } {
  if (!coupon) {
    return { ok: false, code: "COUPON_NOT_FOUND", message: MESSAGES.COUPON_NOT_FOUND };
  }
  if (coupon.deletedAt || !coupon.isActive) {
    return { ok: false, code: "COUPON_INACTIVE", message: MESSAGES.COUPON_INACTIVE };
  }
  if (coupon.validFrom && coupon.validFrom > now) {
    return { ok: false, code: "COUPON_NOT_STARTED", message: MESSAGES.COUPON_NOT_STARTED };
  }
  if (coupon.expiresAt && coupon.expiresAt <= now) {
    return { ok: false, code: "COUPON_EXPIRED", message: MESSAGES.COUPON_EXPIRED };
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, code: "COUPON_EXHAUSTED", message: MESSAGES.COUPON_EXHAUSTED };
  }
  if (coupon.perUserLimit != null && context?.customerUsageCount != null && context.customerUsageCount >= coupon.perUserLimit) {
    return { ok: false, code: "COUPON_USER_LIMIT", message: MESSAGES.COUPON_USER_LIMIT };
  }
  if (coupon.firstOrderOnly && context?.customerOrderCount != null && context.customerOrderCount > 0) {
    return { ok: false, code: "COUPON_FIRST_ORDER", message: MESSAGES.COUPON_FIRST_ORDER };
  }
  if (!eligibleCustomer(coupon, customerProfileId)) {
    return { ok: false, code: "COUPON_CUSTOMER", message: MESSAGES.COUPON_CUSTOMER };
  }

  const base = discountBaseForCart(coupon, cartLines);

  if (coupon.minOrderAmount && base.lt(coupon.minOrderAmount)) {
    return { ok: false, code: "COUPON_MIN_ORDER", message: MESSAGES.COUPON_MIN_ORDER };
  }

  if (!coupon.appliesToAllMeals && base.lte(0)) {
    return { ok: false, code: "COUPON_MEALS", message: MESSAGES.COUPON_MEALS };
  }

  let discount = new Prisma.Decimal(0);
  let shippingDiscount = new Prisma.Decimal(0);

  if (coupon.freeShipping && context?.deliveryFee) {
    shippingDiscount = context.deliveryFee;
  }

  if (coupon.percentOff) {
    discount = base.mul(coupon.percentOff).div(100);
  } else if (coupon.amountOff) {
    discount = coupon.amountOff.gt(base) ? base : coupon.amountOff;
  }

  if (coupon.maxDiscount && discount.gt(coupon.maxDiscount)) {
    discount = coupon.maxDiscount;
  }

  if (discount.lte(0) && shippingDiscount.lte(0)) {
    if (base.lte(0)) {
      return { ok: false, code: "COUPON_NO_DISCOUNT", message: MESSAGES.COUPON_NO_DISCOUNT };
    }
    if (!coupon.percentOff && !coupon.amountOff && !coupon.freeShipping) {
      return { ok: false, code: "COUPON_NO_DISCOUNT", message: MESSAGES.COUPON_NO_DISCOUNT };
    }
  }

  return { ok: true, discount, discountBase: base, shippingDiscount };
}

export function couponErrorMessage(code: CouponApplyErrorCode): string {
  return MESSAGES[code] ?? "Invalid coupon.";
}
