import { MealListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: Request, ctx: Params) {
  const { slug } = await ctx.params;
  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const take = Math.min(Number(url.searchParams.get("limit") ?? "20"), 50);
  const skip = Math.max(Number(url.searchParams.get("offset") ?? "0"), 0);

  const meal = await prisma.meal.findFirst({
    where: {
      slug,
      deletedAt: null,
      isActive: true,
      listingStatus: MealListingStatus.ACTIVE,
    },
    select: { id: true, name: true },
  });
  if (!meal) return errorJson("Not found", 404);

  const ratingWhere: Record<string, unknown> = { mealId: meal.id, isVisible: true };
  if (filter === "positive") ratingWhere.rating = { gte: 4 };
  else if (filter === "negative") ratingWhere.rating = { lte: 2 };
  else if (["5", "4", "3", "2", "1"].includes(filter))
    ratingWhere.rating = Number(filter);

  const [reviews, total, agg, dist] = await Promise.all([
    prisma.review.findMany({
      where: ratingWhere,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        customer: { select: { fullName: true } },
      },
    }),
    prisma.review.count({ where: ratingWhere }),
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
  for (const r of dist) {
    distribution[r.rating] = r._count._all;
  }

  return json({
    mealId: meal.id,
    mealName: meal.name,
    averageRating: agg._avg.rating != null ? Number(agg._avg.rating.toFixed(2)) : null,
    totalCount: agg._count._all,
    distribution,
    filteredTotal: total,
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      reviewerName: r.customer.fullName,
    })),
  });
}
