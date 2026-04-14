import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";
import { cursorQuerySchema, decodeCursor, encodeCursor } from "@/lib/pagination";
import { customerMealImageUrl } from "@/lib/meal-image-customer";

export const dynamic = "force-dynamic";

/** Status groups visible to customer */
const ACTIVE_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "ASSIGNED",
  "OUT_FOR_DELIVERY",
] as const;
const COMPLETED_STATUSES = ["DELIVERED"] as const;
const CANCELLED_STATUSES = ["CANCELLED", "REFUNDED", "FAILED_DELIVERY"] as const;

function statusesForGroup(group: string | undefined): string[] | undefined {
  if (group === "active") return [...ACTIVE_STATUSES];
  if (group === "completed") return [...COMPLETED_STATUSES];
  if (group === "cancelled") return [...CANCELLED_STATUSES];
  return undefined;
}

export async function GET(req: Request) {
  try {
    const { profile } = await requireCustomer(req);
    const url = new URL(req.url);
    const q = cursorQuerySchema.parse(Object.fromEntries(url.searchParams));
    const cursorId = q.cursor ? decodeCursor(q.cursor) : null;
    if (q.cursor && !cursorId) return errorJson("Invalid cursor", 400);

    const statusGroup = url.searchParams.get("status") ?? undefined;
    const search = url.searchParams.get("search")?.trim() ?? undefined;
    const ratingFilter = url.searchParams.get("rating");

    // Build where
    const where: Prisma.OrderWhereInput = { customerId: profile.id };
    const statusList = statusesForGroup(statusGroup);
    if (statusList) where.status = { in: statusList as OrderStatus[] };

    if (search && search.length >= 2) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { items: { some: { meal: { name: { contains: search, mode: "insensitive" } } } } },
      ];
    }

    const rows = await prisma.order.findMany({
      where,
      take: q.limit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(cursorId ? { skip: 1, cursor: { id: cursorId } } : {}),
      select: {
        id: true,
        status: true,
        type: true,
        subtotal: true,
        deliveryFee: true,
        tax: true,
        discount: true,
        total: true,
        createdAt: true,
        items: {
          take: 4,
          select: {
            id: true,
            mealId: true,
            quantity: true,
            meal: {
              select: {
                name: true,
                images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
              },
            },
          },
        },
        orderRating: { select: { rating: true } },
        reviews: { select: { rating: true } },
        couponUsages: {
          take: 1,
          select: { coupon: { select: { id: true, code: true, title: true } } },
        },
      },
    });

    let nextCursor: string | null = null;
    if (rows.length > q.limit) {
      nextCursor = encodeCursor(rows[q.limit - 1]!.id);
      rows.pop();
    }

    // Optional rating filter (post-query since rating is aggregated)
    let filtered = rows;
    if (ratingFilter && ["1", "2", "3", "4", "5"].includes(ratingFilter)) {
      const r = Number(ratingFilter);
      filtered = rows.filter((o) => {
        if (o.orderRating?.rating === r) return true;
        const mealAvg =
          o.reviews.length > 0
            ? Math.round(o.reviews.reduce((s, rv) => s + rv.rating, 0) / o.reviews.length)
            : null;
        return mealAvg === r;
      });
    }

    return json({
      items: filtered.map((o) => {
        const mealAvg =
          o.reviews.length > 0
            ? Number((o.reviews.reduce((s, rv) => s + rv.rating, 0) / o.reviews.length).toFixed(1))
            : null;
        const coupon = o.couponUsages[0]?.coupon ?? null;
        return {
          id: o.id,
          status: o.status,
          type: o.type,
          createdAt: o.createdAt.toISOString(),
          subtotal: o.subtotal.toString(),
          deliveryFee: o.deliveryFee.toString(),
          tax: o.tax.toString(),
          discount: o.discount.toString(),
          total: o.total.toString(),
          itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
          previewItems: o.items.map((i) => ({
            id: i.id,
            mealId: i.mealId,
            mealName: i.meal.name,
            thumbnailUrl: customerMealImageUrl(req, i.meal.images[0]?.url) ?? null,
          })),
          rating: {
            orderRating: o.orderRating?.rating ?? null,
            mealAverage: mealAvg,
            display: o.orderRating?.rating ?? mealAvg,
          },
          coupon: coupon ? { id: coupon.id, code: coupon.code, title: coupon.title } : null,
        };
      }),
      nextCursor,
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
