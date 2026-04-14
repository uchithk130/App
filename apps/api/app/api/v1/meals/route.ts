import { MealListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { cursorQuerySchema, decodeCursor, encodeCursor } from "@/lib/pagination";
import { customerMealImageUrl } from "@/lib/meal-image-customer";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = cursorQuerySchema.parse(Object.fromEntries(url.searchParams));
    const categorySlug = url.searchParams.get("categorySlug") ?? undefined;
    const offersOnly = url.searchParams.get("offersOnly") === "1";
    const search = url.searchParams.get("q")?.trim();
    const minProtein = url.searchParams.get("minProtein");
    const cursorId = q.cursor ? decodeCursor(q.cursor) : null;
    if (q.cursor && !cursorId) return errorJson("Invalid cursor", 400);

    const minP = minProtein ? Number.parseFloat(minProtein) : null;
    const nutritionFilter =
      minP != null && !Number.isNaN(minP) ? { proteinG: { gte: minP } } : undefined;

    const items = await prisma.meal.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        listingStatus: MealListingStatus.ACTIVE,
        category: categorySlug ? { slug: categorySlug, deletedAt: null } : undefined,
        nutrition: nutritionFilter,
        compareAtPrice: offersOnly ? { not: null } : undefined,
        ...(search
          ? { name: { contains: search, mode: "insensitive" as const } }
          : {}),
      },
      take: q.limit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(cursorId ? { skip: 1, cursor: { id: cursorId } } : {}),
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        mealType: true,
        basePrice: true,
        compareAtPrice: true,
        richInProtein: true,
        richInFiber: true,
        richInLowCarb: true,
        category: { select: { name: true, slug: true } },
        nutrition: {
          select: { calories: true, proteinG: true, carbG: true, fatG: true, fiberG: true },
        },
        images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
      },
    });

    let nextCursor: string | null = null;
    const page = items;
    if (page.length > q.limit) {
      const last = page[q.limit - 1]!;
      nextCursor = encodeCursor(last.id);
      page.pop();
    }

    const ids = page.map((m) => m.id);
    const reviewStats =
      ids.length === 0
        ? []
        : await prisma.review.groupBy({
            by: ["mealId"],
            where: { mealId: { in: ids }, isVisible: true },
            _avg: { rating: true },
            _count: { _all: true },
          });
    const ratingByMeal = new Map(
      reviewStats.map((s) => [s.mealId, { avg: s._avg.rating, count: s._count._all }])
    );

    return json({
      items: page.map((m) => {
        const rawUrl = m.images[0]?.url ?? null;
        const coverUrl = customerMealImageUrl(req, rawUrl);
        const r = ratingByMeal.get(m.id);
        return {
          id: m.id,
          name: m.name,
          slug: m.slug,
          description: m.description,
          mealType: m.mealType,
          basePrice: m.basePrice.toString(),
          compareAtPrice: m.compareAtPrice?.toString() ?? null,
          richInProtein: m.richInProtein,
          richInFiber: m.richInFiber,
          richInLowCarb: m.richInLowCarb,
          category: m.category,
          nutrition: m.nutrition
            ? {
                calories: m.nutrition.calories,
                proteinG: m.nutrition.proteinG.toString(),
                carbG: m.nutrition.carbG.toString(),
                fatG: m.nutrition.fatG.toString(),
                fiberG: m.nutrition.fiberG.toString(),
              }
            : null,
          coverUrl,
          ratingAvg: r?.avg != null ? Number(r.avg.toFixed(2)) : null,
          ratingCount: r?.count ?? 0,
        };
      }),
      nextCursor,
    });
  } catch (e) {
    return errorJson("Server error", 500);
  }
}
