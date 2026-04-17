import { z } from "zod";
import { MealListingStatus, MealType, PromoTagType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import { cursorQuerySchema, decodeCursor, encodeCursor } from "@/lib/pagination";
import { isActiveForListingStatus } from "@/lib/services/meal-listing";
import { resolveStoredImageUrl } from "@/lib/meal-image-url";
import { generatePromoLabel } from "@/lib/services/promo-label";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  categoryId: z.string().min(1),
  mealType: z.nativeEnum(MealType),
  description: z.string().optional(),
  basePrice: z.string().or(z.number()),
  compareAtPrice: z.union([z.string(), z.number()]).nullable().optional(),
  isActive: z.boolean().optional(),
  listingStatus: z.nativeEnum(MealListingStatus).optional(),
  primaryImageUrl: z.string().optional(),
  nutrition: z.object({
    calories: z.number().int(),
    proteinG: z.string().or(z.number()),
    carbG: z.string().or(z.number()),
    fatG: z.string().or(z.number()),
    fiberG: z.string().or(z.number()),
  }),
  richInProtein: z.boolean().optional(),
  richInFiber: z.boolean().optional(),
  richInLowCarb: z.boolean().optional(),
  isSpecialOffer: z.boolean().optional(),
  specialOfferPriority: z.number().int().optional(),
  promoTagType: z.nativeEnum(PromoTagType).nullable().optional(),
  promoTagConfig: z.record(z.unknown()).nullable().optional(),
  promoTagText: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const url = new URL(req.url);
    const q = cursorQuerySchema.parse(Object.fromEntries(url.searchParams));
    const cursorId = q.cursor ? decodeCursor(q.cursor) : null;
    if (q.cursor && !cursorId) return errorJson("Invalid cursor", 400);

    const rows = await prisma.meal.findMany({
      where: { deletedAt: null },
      take: q.limit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(cursorId ? { skip: 1, cursor: { id: cursorId } } : {}),
      include: {
        category: true,
        nutrition: true,
        images: { orderBy: { sortOrder: "asc" }, take: 3, select: { id: true, url: true, sortOrder: true } },
      },
    });

    let nextCursor: string | null = null;
    const page = rows;
    if (page.length > q.limit) {
      const last = page[q.limit - 1]!;
      nextCursor = encodeCursor(last.id);
      page.pop();
    }

    return json({
      items: page.map((m) => ({
        ...m,
        basePrice: m.basePrice.toString(),
        compareAtPrice: m.compareAtPrice?.toString() ?? null,
        coverUrl: resolveStoredImageUrl(m.images[0]?.url ?? null),
        promoLabel: generatePromoLabel(m.promoTagType, m.promoTagConfig as Record<string, unknown> | null, m.promoTagText),
        nutrition: m.nutrition
          ? {
              ...m.nutrition,
              proteinG: m.nutrition.proteinG.toString(),
              carbG: m.nutrition.carbG.toString(),
              fatG: m.nutrition.fatG.toString(),
              fiberG: m.nutrition.fiberG.toString(),
            }
          : null,
      })),
      nextCursor,
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const body = createSchema.parse(await req.json());
    const listing =
      body.listingStatus ??
      (body.isActive === false ? MealListingStatus.INACTIVE : MealListingStatus.ACTIVE);
    const isActive = isActiveForListingStatus(listing);

    const meal = await prisma.$transaction(async (tx) => {
      const m = await tx.meal.create({
        data: {
          name: body.name,
          slug: body.slug,
          categoryId: body.categoryId,
          mealType: body.mealType,
          description: body.description,
          basePrice: String(body.basePrice),
          compareAtPrice: body.compareAtPrice != null ? String(body.compareAtPrice) : null,
          isActive,
          listingStatus: listing,
          richInProtein: body.richInProtein ?? false,
          richInFiber: body.richInFiber ?? false,
          richInLowCarb: body.richInLowCarb ?? false,
          isSpecialOffer: body.isSpecialOffer ?? false,
          specialOfferPriority: body.specialOfferPriority ?? 0,
          promoTagType: body.promoTagType ?? null,
          promoTagConfig: body.promoTagConfig ?? undefined,
          promoTagText: body.promoTagText ?? null,
          nutrition: {
            create: {
              calories: body.nutrition.calories,
              proteinG: String(body.nutrition.proteinG),
              carbG: String(body.nutrition.carbG),
              fatG: String(body.nutrition.fatG),
              fiberG: String(body.nutrition.fiberG),
            },
          },
        },
      });
      const img = body.primaryImageUrl?.trim();
      if (img) {
        await tx.mealImage.create({
          data: { mealId: m.id, url: img, sortOrder: 0 },
        });
      }
      return m;
    });
    return json({ id: meal.id });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
