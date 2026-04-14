import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import { normalizeCouponCode } from "@/lib/coupon-apply";

export const dynamic = "force-dynamic";

const listQuery = z.object({
  limit: z.coerce.number().min(1).max(200).default(80),
});

const createSchema = z
.object({
  code: z.string().min(1).max(64),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  percentOff: z.union([z.string(), z.number()]).optional().nullable(),
  amountOff: z.union([z.string(), z.number()]).optional().nullable(),
  freeShipping: z.boolean().optional(),
  maxDiscount: z.union([z.string(), z.number()]).optional().nullable(),
  minOrderAmount: z.union([z.string(), z.number()]).optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  perUserLimit: z.number().int().positive().optional().nullable(),
  validFrom: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
  firstOrderOnly: z.boolean().optional(),
  appliesToAllCustomers: z.boolean(),
  customerIds: z.array(z.string().min(1)).default([]),
  appliesToAllMeals: z.boolean(),
  mealIds: z.array(z.string().min(1)).default([]),
  termsAndConditions: z.string().max(2000).optional().nullable(),
  displayBadge: z.string().max(100).optional().nullable(),
  sortOrder: z.number().int().optional(),
})
  .superRefine((d, ctx) => {
    const p =
      d.percentOff !== undefined && d.percentOff !== null && String(d.percentOff).trim() !== ""
        ? new Prisma.Decimal(String(d.percentOff))
        : null;
    const a =
      d.amountOff !== undefined && d.amountOff !== null && String(d.amountOff).trim() !== ""
        ? new Prisma.Decimal(String(d.amountOff))
        : null;
    const hasP = p && p.gt(0);
    const hasA = a && a.gt(0);
    if (!hasP && !hasA) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Set exactly one of percentOff or amountOff (positive)." });
    }
    if (hasP && hasA) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Use either percentOff or amountOff, not both." });
    }
    if (hasP && p!.gt(100)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "percentOff cannot exceed 100." });
    }
    if (!d.appliesToAllCustomers && d.customerIds.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select at least one customer or choose all customers." });
    }
    if (!d.appliesToAllMeals && d.mealIds.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select at least one meal or choose all meals." });
    }
  });

function serializeCoupon(
  c: Prisma.CouponGetPayload<{
    include: { targetedCustomers: true; targetedMeals: true };
  }>
) {
  return {
    id: c.id,
    code: c.code,
    title: c.title,
    description: c.description,
    percentOff: c.percentOff?.toString() ?? null,
    amountOff: c.amountOff?.toString() ?? null,
    freeShipping: c.freeShipping,
    maxDiscount: c.maxDiscount?.toString() ?? null,
    minOrderAmount: c.minOrderAmount?.toString() ?? null,
    maxUses: c.maxUses,
    perUserLimit: c.perUserLimit,
    usedCount: c.usedCount,
    validFrom: c.validFrom?.toISOString() ?? null,
    expiresAt: c.expiresAt?.toISOString() ?? null,
    isActive: c.isActive,
    firstOrderOnly: c.firstOrderOnly,
    appliesToAllCustomers: c.appliesToAllCustomers,
    appliesToAllMeals: c.appliesToAllMeals,
    customerIds: c.targetedCustomers.map((t) => t.customerId),
    mealIds: c.targetedMeals.map((t) => t.mealId),
    termsAndConditions: c.termsAndConditions,
    displayBadge: c.displayBadge,
    sortOrder: c.sortOrder,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const url = new URL(req.url);
    const q = listQuery.parse(Object.fromEntries(url.searchParams));
    const rows = await prisma.coupon.findMany({
      where: { deletedAt: null },
      take: q.limit,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      include: { targetedCustomers: true, targetedMeals: true },
    });
    return json({ items: rows.map(serializeCoupon) });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid query", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const raw = createSchema.parse(await req.json());
    const code = normalizeCouponCode(raw.code);
    const p =
      raw.percentOff !== undefined && raw.percentOff !== null && String(raw.percentOff).trim() !== ""
        ? new Prisma.Decimal(String(raw.percentOff))
        : null;
    const a =
      raw.amountOff !== undefined && raw.amountOff !== null && String(raw.amountOff).trim() !== ""
        ? new Prisma.Decimal(String(raw.amountOff))
        : null;
    const hasP = p && p.gt(0);
    const hasA = a && a.gt(0);
    const percentOff = hasP ? p! : null;
    const amountOff = hasA && !hasP ? a! : null;

    const dup = await prisma.coupon.findFirst({ where: { code, deletedAt: null } });
    if (dup) return errorJson("A coupon with this code already exists", 409, "DUPLICATE");

    const expiresAt = raw.expiresAt ? new Date(raw.expiresAt) : null;

    const created = await prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.create({
        data: {
          code,
          title: raw.title ?? null,
          description: raw.description ?? null,
          percentOff,
          amountOff,
          freeShipping: raw.freeShipping ?? false,
          maxDiscount: raw.maxDiscount != null && String(raw.maxDiscount).trim() ? new Prisma.Decimal(String(raw.maxDiscount)) : null,
          minOrderAmount: raw.minOrderAmount != null && String(raw.minOrderAmount).trim() ? new Prisma.Decimal(String(raw.minOrderAmount)) : null,
          maxUses: raw.maxUses ?? null,
          perUserLimit: raw.perUserLimit ?? null,
          validFrom: raw.validFrom ? new Date(raw.validFrom) : null,
          expiresAt,
          isActive: raw.isActive ?? true,
          firstOrderOnly: raw.firstOrderOnly ?? false,
          appliesToAllCustomers: raw.appliesToAllCustomers,
          appliesToAllMeals: raw.appliesToAllMeals,
          termsAndConditions: raw.termsAndConditions ?? null,
          displayBadge: raw.displayBadge ?? null,
          sortOrder: raw.sortOrder ?? 0,
        },
      });
      if (!raw.appliesToAllCustomers && raw.customerIds.length) {
        await tx.couponCustomer.createMany({
          data: raw.customerIds.map((customerId) => ({ couponId: coupon.id, customerId })),
          skipDuplicates: true,
        });
      }
      if (!raw.appliesToAllMeals && raw.mealIds.length) {
        await tx.couponMeal.createMany({
          data: raw.mealIds.map((mealId) => ({ couponId: coupon.id, mealId })),
          skipDuplicates: true,
        });
      }
      return tx.coupon.findUniqueOrThrow({
        where: { id: coupon.id },
        include: { targetedCustomers: true, targetedMeals: true },
      });
    });

    return json(serializeCoupon(created));
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
