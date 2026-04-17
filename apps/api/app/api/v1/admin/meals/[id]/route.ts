import { z } from "zod";
import { Prisma, MealListingStatus, MealType, PromoTagType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import { writeAudit } from "@/lib/services/audit";
import { isActiveForListingStatus } from "@/lib/services/meal-listing";
import { resolveStoredImageUrl } from "@/lib/meal-image-url";
import { generatePromoLabel } from "@/lib/services/promo-label";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Params) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    const meal = await prisma.meal.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        nutrition: true,
        images: { orderBy: { sortOrder: "asc" }, select: { url: true, sortOrder: true } },
      },
    });
    if (!meal) return errorJson("Not found", 404);

    return json({
      id: meal.id,
      name: meal.name,
      slug: meal.slug,
      categoryId: meal.categoryId,
      category: meal.category,
      mealType: meal.mealType,
      description: meal.description,
      basePrice: meal.basePrice.toString(),
      compareAtPrice: meal.compareAtPrice?.toString() ?? null,
      listingStatus: meal.listingStatus,
      isActive: meal.isActive,
      coverUrl: resolveStoredImageUrl(meal.images[0]?.url ?? null),
      richInProtein: meal.richInProtein,
      richInFiber: meal.richInFiber,
      richInLowCarb: meal.richInLowCarb,
      isSpecialOffer: meal.isSpecialOffer,
      specialOfferPriority: meal.specialOfferPriority,
      promoTagType: meal.promoTagType,
      promoTagConfig: meal.promoTagConfig,
      promoTagText: meal.promoTagText,
      promoLabel: generatePromoLabel(meal.promoTagType, meal.promoTagConfig as Record<string, unknown> | null, meal.promoTagText),
      nutrition: meal.nutrition
        ? {
            calories: meal.nutrition.calories,
            proteinG: meal.nutrition.proteinG.toString(),
            carbG: meal.nutrition.carbG.toString(),
            fatG: meal.nutrition.fatG.toString(),
            fiberG: meal.nutrition.fiberG.toString(),
          }
        : null,
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  mealType: z.nativeEnum(MealType).optional(),
  description: z.string().nullable().optional(),
  basePrice: z.union([z.string(), z.number()]).optional(),
  compareAtPrice: z.union([z.string(), z.number()]).nullable().optional(),
  isActive: z.boolean().optional(),
  listingStatus: z.nativeEnum(MealListingStatus).optional(),
  primaryImageUrl: z.string().nullable().optional(),
  nutrition: z
    .object({
      calories: z.number().int().optional(),
      proteinG: z.union([z.string(), z.number()]).optional(),
      carbG: z.union([z.string(), z.number()]).optional(),
      fatG: z.union([z.string(), z.number()]).optional(),
      fiberG: z.union([z.string(), z.number()]).optional(),
    })
    .optional(),
  richInProtein: z.boolean().optional(),
  richInFiber: z.boolean().optional(),
  richInLowCarb: z.boolean().optional(),
  isSpecialOffer: z.boolean().optional(),
  specialOfferPriority: z.number().int().optional(),
  promoTagType: z.nativeEnum(PromoTagType).nullable().optional(),
  promoTagConfig: z.record(z.unknown()).nullable().optional(),
  promoTagText: z.string().nullable().optional(),
});

export async function PATCH(req: Request, ctx: Params) {
  try {
    const { auth } = await requireAdmin(req);
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());
    const before = await prisma.meal.findUnique({ where: { id } });
    if (!before) return errorJson("Not found", 404);

    let listingStatus = body.listingStatus;
    if (listingStatus === undefined && body.isActive !== undefined) {
      listingStatus = body.isActive ? MealListingStatus.ACTIVE : MealListingStatus.INACTIVE;
    }

    await prisma.$transaction(async (tx) => {
      const data: Prisma.MealUpdateInput = {
        name: body.name,
        slug: body.slug,
        ...(body.categoryId !== undefined ? { category: { connect: { id: body.categoryId } } } : {}),
        mealType: body.mealType,
        description: body.description === null ? null : body.description,
        basePrice: body.basePrice === undefined ? undefined : String(body.basePrice),
        ...(body.compareAtPrice !== undefined
          ? { compareAtPrice: body.compareAtPrice != null ? String(body.compareAtPrice) : null }
          : {}),
        ...(body.richInProtein !== undefined ? { richInProtein: body.richInProtein } : {}),
        ...(body.richInFiber !== undefined ? { richInFiber: body.richInFiber } : {}),
        ...(body.richInLowCarb !== undefined ? { richInLowCarb: body.richInLowCarb } : {}),
        ...(body.isSpecialOffer !== undefined ? { isSpecialOffer: body.isSpecialOffer } : {}),
        ...(body.specialOfferPriority !== undefined ? { specialOfferPriority: body.specialOfferPriority } : {}),
        ...(body.promoTagType !== undefined ? { promoTagType: body.promoTagType } : {}),
        ...(body.promoTagConfig !== undefined ? { promoTagConfig: body.promoTagConfig != null ? (body.promoTagConfig as Prisma.InputJsonValue) : Prisma.JsonNull } : {}),
        ...(body.promoTagText !== undefined ? { promoTagText: body.promoTagText } : {}),
      };
      if (listingStatus !== undefined) {
        data.listingStatus = listingStatus;
        data.isActive = isActiveForListingStatus(listingStatus);
      }

      await tx.meal.update({
        where: { id },
        data,
      });

      if (body.primaryImageUrl !== undefined) {
        await tx.mealImage.deleteMany({ where: { mealId: id } });
        const url = body.primaryImageUrl?.trim();
        if (url) {
          await tx.mealImage.create({ data: { mealId: id, url, sortOrder: 0 } });
        }
      }
      if (body.nutrition) {
        await tx.mealNutrition.upsert({
          where: { mealId: id },
          create: {
            mealId: id,
            calories: body.nutrition.calories ?? 0,
            proteinG: String(body.nutrition.proteinG ?? 0),
            carbG: String(body.nutrition.carbG ?? 0),
            fatG: String(body.nutrition.fatG ?? 0),
            fiberG: String(body.nutrition.fiberG ?? 0),
          },
          update: {
            calories: body.nutrition.calories,
            proteinG: body.nutrition.proteinG === undefined ? undefined : String(body.nutrition.proteinG),
            carbG: body.nutrition.carbG === undefined ? undefined : String(body.nutrition.carbG),
            fatG: body.nutrition.fatG === undefined ? undefined : String(body.nutrition.fatG),
            fiberG: body.nutrition.fiberG === undefined ? undefined : String(body.nutrition.fiberG),
          },
        });
      }
    });

    await writeAudit({
      actorUserId: auth.sub,
      action: "meal.update",
      entityType: "Meal",
      entityId: id,
      before,
      after: body,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
