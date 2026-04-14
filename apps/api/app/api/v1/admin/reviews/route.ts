import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const url = new URL(req.url);
    const tab = url.searchParams.get("tab") ?? "all";
    const where =
      tab === "published" ? { isVisible: true } : tab === "hidden" ? { isVisible: false } : {};

    const [items, agg, newest] = await Promise.all([
      prisma.review.findMany({
        where,
        take: 40,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { fullName: true } },
          meal: { select: { name: true } },
        },
      }),
      prisma.review.aggregate({
        where: { isVisible: true },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.review.findFirst({
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { fullName: true } },
          meal: { select: { name: true } },
        },
      }),
    ]);

    return json({
      items: items.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        isVisible: r.isVisible,
        createdAt: r.createdAt,
        customerName: r.customer.fullName,
        mealName: r.meal.name,
      })),
      summary: {
        averagePublished: agg._avg.rating ?? 0,
        publishedCount: agg._count._all,
      },
      newest: newest
        ? {
            id: newest.id,
            rating: newest.rating,
            comment: newest.comment,
            createdAt: newest.createdAt,
            customerName: newest.customer.fullName,
            mealName: newest.meal.name,
          }
        : null,
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
