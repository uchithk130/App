import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import { normalizeCouponCode } from "@/lib/coupon-apply";

export const dynamic = "force-dynamic";

const patchSchema = z
.object({
  code: z.string().min(1).max(64).optional(),
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
  appliesToAllCustomers: z.boolean().optional(),
  customerIds: z.array(z.string().min(1)).optional(),
  appliesToAllMeals: z.boolean().optional(),
  mealIds: z.array(z.string().min(1)).optional(),
  termsAndConditions: z.string().max(2000).optional().nullable(),
  displayBadge: z.string().max(100).optional().nullable(),
  sortOrder: z.number().int().optional(),
})
  .superRefine((d, ctx) => {
    if (d.percentOff !== undefined || d.amountOff !== undefined) {
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
    }
    if (d.appliesToAllCustomers === false && d.customerIds !== undefined && d.customerIds.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select at least one customer or choose all customers." });
    }
    if (d.appliesToAllMeals === false && d.mealIds !== undefined && d.mealIds.length === 0) {
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

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());

    const existing = await prisma.coupon.findFirst({
      where: { id, deletedAt: null },
      include: { targetedCustomers: true, targetedMeals: true },
    });
    if (!existing) return errorJson("Coupon not found", 404);

    const nextCode = body.code !== undefined ? normalizeCouponCode(body.code) : undefined;
    if (nextCode && nextCode !== existing.code) {
      const dup = await prisma.coupon.findFirst({
        where: { code: nextCode, deletedAt: null, NOT: { id } },
      });
      if (dup) return errorJson("A coupon with this code already exists", 409, "DUPLICATE");
    }

    let discountUpdate: { percentOff: Prisma.Decimal | null; amountOff: Prisma.Decimal | null } | undefined;
    if (body.percentOff !== undefined || body.amountOff !== undefined) {
      const p =
        body.percentOff !== undefined && body.percentOff !== null && String(body.percentOff).trim() !== ""
          ? new Prisma.Decimal(String(body.percentOff))
          : null;
      const a =
        body.amountOff !== undefined && body.amountOff !== null && String(body.amountOff).trim() !== ""
          ? new Prisma.Decimal(String(body.amountOff))
          : null;
      const hasP = p && p.gt(0);
      const hasA = a && a.gt(0);
      discountUpdate = {
        percentOff: hasP ? p! : null,
        amountOff: hasA && !hasP ? a! : null,
      };
    }

    const finalAllCust =
      body.appliesToAllCustomers !== undefined ? body.appliesToAllCustomers : existing.appliesToAllCustomers;
    const finalCustIds =
      body.customerIds !== undefined
        ? body.customerIds
        : existing.targetedCustomers.map((t) => t.customerId);
    const finalAllMeals =
      body.appliesToAllMeals !== undefined ? body.appliesToAllMeals : existing.appliesToAllMeals;
    const finalMealIds =
      body.mealIds !== undefined ? body.mealIds : existing.targetedMeals.map((t) => t.mealId);

    const dirtyCust = body.customerIds !== undefined || body.appliesToAllCustomers !== undefined;
    const dirtyMeals = body.mealIds !== undefined || body.appliesToAllMeals !== undefined;
    if (dirtyCust && !finalAllCust && finalCustIds.length === 0) {
      return errorJson("Select at least one customer or choose all customers.", 400);
    }
    if (dirtyMeals && !finalAllMeals && finalMealIds.length === 0) {
      return errorJson("Select at least one meal or choose all meals.", 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (dirtyCust) {
        await tx.couponCustomer.deleteMany({ where: { couponId: id } });
        if (!finalAllCust && finalCustIds.length) {
          await tx.couponCustomer.createMany({
            data: finalCustIds.map((customerId) => ({ couponId: id, customerId })),
            skipDuplicates: true,
          });
        }
      }

      if (dirtyMeals) {
        await tx.couponMeal.deleteMany({ where: { couponId: id } });
        if (!finalAllMeals && finalMealIds.length) {
          await tx.couponMeal.createMany({
            data: finalMealIds.map((mealId) => ({ couponId: id, mealId })),
            skipDuplicates: true,
          });
        }
      }

      return tx.coupon.update({
        where: { id },
        data: {
          ...(nextCode !== undefined ? { code: nextCode } : {}),
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(discountUpdate ? discountUpdate : {}),
          ...(body.freeShipping !== undefined ? { freeShipping: body.freeShipping } : {}),
          ...(body.maxDiscount !== undefined ? { maxDiscount: body.maxDiscount != null && String(body.maxDiscount).trim() ? new Prisma.Decimal(String(body.maxDiscount)) : null } : {}),
          ...(body.minOrderAmount !== undefined ? { minOrderAmount: body.minOrderAmount != null && String(body.minOrderAmount).trim() ? new Prisma.Decimal(String(body.minOrderAmount)) : null } : {}),
          ...(body.maxUses !== undefined ? { maxUses: body.maxUses } : {}),
          ...(body.perUserLimit !== undefined ? { perUserLimit: body.perUserLimit } : {}),
          ...(body.validFrom !== undefined
            ? { validFrom: body.validFrom ? new Date(body.validFrom) : null }
            : {}),
          ...(body.expiresAt !== undefined
            ? { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null }
            : {}),
          ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
          ...(body.firstOrderOnly !== undefined ? { firstOrderOnly: body.firstOrderOnly } : {}),
          ...(body.appliesToAllCustomers !== undefined ? { appliesToAllCustomers: body.appliesToAllCustomers } : {}),
          ...(body.appliesToAllMeals !== undefined ? { appliesToAllMeals: body.appliesToAllMeals } : {}),
          ...(body.termsAndConditions !== undefined ? { termsAndConditions: body.termsAndConditions } : {}),
          ...(body.displayBadge !== undefined ? { displayBadge: body.displayBadge } : {}),
          ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        },
        include: { targetedCustomers: true, targetedMeals: true },
      });
    });

    return json(serializeCoupon(updated));
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
