import { MealListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/http";
import { customerMealImageUrl } from "@/lib/meal-image-customer";
import { generatePromoLabel } from "@/lib/services/promo-label";

export const dynamic = "force-dynamic";

/** Public home payload: promos, categories strip, offer meals. */
export async function GET(req: Request) {
  const [promos, categories, offerMeals] = await Promise.all([
    prisma.homePromoBanner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 8,
    }),
    prisma.mealCategory.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 11,
      select: { id: true, name: true, slug: true, sortOrder: true, iconUrl: true },
    }),
    prisma.meal.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        listingStatus: MealListingStatus.ACTIVE,
        isSpecialOffer: true,
      },
      orderBy: [{ specialOfferPriority: "desc" }, { createdAt: "desc" }],
      take: 12,
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        compareAtPrice: true,
        promoTagType: true,
        promoTagConfig: true,
        promoTagText: true,
        images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
      },
    }),
  ]);

  const mealIds = offerMeals.map((m) => m.id);
  const reviewStats =
    mealIds.length === 0
      ? []
      : await prisma.review.groupBy({
          by: ["mealId"],
          where: { mealId: { in: mealIds }, isVisible: true },
          _avg: { rating: true },
          _count: { _all: true },
        });
  const ratingByMeal = new Map(reviewStats.map((s) => [s.mealId, { avg: s._avg.rating, count: s._count._all }]));

  const offers = offerMeals.map((m) => {
    const rawUrl = m.images[0]?.url ?? null;
    const coverUrl = customerMealImageUrl(req, rawUrl);
    const r = ratingByMeal.get(m.id);
    return {
      id: m.id,
      name: m.name,
      slug: m.slug,
      basePrice: m.basePrice.toString(),
      compareAtPrice: m.compareAtPrice?.toString() ?? null,
      coverUrl,
      ratingAvg: r?.avg != null ? Number(r.avg.toFixed(2)) : null,
      ratingCount: r?.count ?? 0,
      promoLabel: generatePromoLabel(m.promoTagType, m.promoTagConfig as Record<string, unknown> | null, m.promoTagText),
    };
  });

  return json({
    promos: promos.map((p) => ({
      id: p.id,
      badge: p.badge,
      headline: p.headline,
      subline: p.subline,
      imageUrl: p.imageUrl,
      mealSlug: p.mealSlug,
      gradientFrom: p.gradientFrom,
      gradientTo: p.gradientTo,
      sortOrder: p.sortOrder,
    })),
    categories,
    offers,
  });
}
