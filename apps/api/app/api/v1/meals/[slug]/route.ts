import { MealListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { customerMealImageUrl } from "@/lib/meal-image-customer";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: Request, ctx: Params) {
  const { slug } = await ctx.params;
  const meal = await prisma.meal.findFirst({
    where: {
      slug,
      deletedAt: null,
      isActive: true,
      listingStatus: MealListingStatus.ACTIVE,
    },
    include: {
      category: true,
      nutrition: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!meal) return errorJson("Not found", 404);

  const [reviewAgg, ratingDist] = await Promise.all([
    prisma.review.aggregate({
      where: { mealId: meal.id, isVisible: true },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { mealId: meal.id, isVisible: true },
      _count: { _all: true },
    }),
  ]);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratingDist) {
    distribution[r.rating] = r._count._all;
  }

  return json({
    id: meal.id,
    name: meal.name,
    slug: meal.slug,
    description: meal.description,
    mealType: meal.mealType,
    basePrice: meal.basePrice.toString(),
    compareAtPrice: meal.compareAtPrice?.toString() ?? null,
    richInProtein: meal.richInProtein,
    richInFiber: meal.richInFiber,
    richInLowCarb: meal.richInLowCarb,
    category: meal.category,
    nutrition: meal.nutrition
      ? {
          calories: meal.nutrition.calories,
          proteinG: meal.nutrition.proteinG.toString(),
          carbG: meal.nutrition.carbG.toString(),
          fatG: meal.nutrition.fatG.toString(),
          fiberG: meal.nutrition.fiberG.toString(),
        }
      : null,
    images: meal.images.map((im) => ({
      ...im,
      url: customerMealImageUrl(req, im.url) ?? "",
    })),
    ratingAvg:
      reviewAgg._avg.rating != null ? Number(reviewAgg._avg.rating.toFixed(2)) : null,
    ratingCount: reviewAgg._count._all,
    ratingDistribution: distribution,
  });
}
