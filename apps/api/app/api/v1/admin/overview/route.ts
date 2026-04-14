import { OrderStatus, SubscriptionStatus, WithdrawalStatus, CustomMealRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    const dayStarts = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const [
      totalUsers,
      totalCustomers,
      totalRiders,
      activeSubscriptions,
      expiringSubscriptions,
      todayOrders,
      pendingOrders,
      deliveredOrders,
      failedDeliveries,
      cancelledOrders,
      pendingCustom,
      pendingWithdrawals,
      revenueToday,
      revenueMonth,
      popularMeals,
      totalMenus,
      outForDelivery,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.customerProfile.count(),
      prisma.riderProfile.count(),
      prisma.customerSubscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      prisma.customerSubscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: { lte: new Date(Date.now() + 3 * 86400000) },
        },
      }),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.count({
        where: {
          status: {
            in: [
              OrderStatus.PENDING_PAYMENT,
              OrderStatus.PAID,
              OrderStatus.CONFIRMED,
              OrderStatus.PREPARING,
              OrderStatus.READY_FOR_PICKUP,
              OrderStatus.OUT_FOR_DELIVERY,
            ],
          },
        },
      }),
      prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      prisma.order.count({ where: { status: OrderStatus.FAILED_DELIVERY } }),
      prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      prisma.customMealRequest.count({
        where: { status: { in: [CustomMealRequestStatus.SUBMITTED, CustomMealRequestStatus.IN_REVIEW] } },
      }),
      prisma.withdrawalRequest.count({ where: { status: WithdrawalStatus.PENDING } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: todayStart }, status: { not: OrderStatus.CANCELLED } },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: monthStart }, status: { not: OrderStatus.CANCELLED } },
        _sum: { total: true },
      }),
      prisma.orderItem.groupBy({
        by: ["mealId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.meal.count({ where: { deletedAt: null } }),
      prisma.order.count({ where: { status: OrderStatus.OUT_FOR_DELIVERY } }),
    ]);

    const ordersLast7Days = await Promise.all(
      dayStarts.map(async (d) => {
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        const orders = await prisma.order.count({
          where: { createdAt: { gte: d, lt: next } },
        });
        return { date: d.toISOString().slice(0, 10), orders };
      })
    );

    const monthRanges = Array.from({ length: 12 }, (_, i) => {
      const start = new Date(todayStart.getFullYear(), todayStart.getMonth() - (11 - i), 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      return {
        start,
        end,
        label: start.toLocaleString("en", { month: "short" }),
      };
    });
    const revenueByMonth = await Promise.all(
      monthRanges.map(async ({ start, end, label }) => {
        const agg = await prisma.order.aggregate({
          where: {
            createdAt: { gte: start, lt: end },
            status: { not: OrderStatus.CANCELLED },
          },
          _sum: { total: true },
        });
        return { month: label, revenue: Number(agg._sum.total ?? 0) };
      })
    );

    const completionDen = deliveredOrders + failedDeliveries + cancelledOrders;
    const completionRate = completionDen > 0 ? Math.round((deliveredOrders / completionDen) * 100) : 100;

    const popularIds = popularMeals.map((m) => m.mealId);
    const mealNames =
      popularIds.length > 0
        ? await prisma.meal.findMany({
            where: { id: { in: popularIds } },
            select: { id: true, name: true },
          })
        : [];
    const nameById = new Map(mealNames.map((m) => [m.id, m.name]));

    return json({
      totalUsers,
      totalCustomers,
      totalRiders,
      activeSubscriptions,
      expiringSubscriptions,
      todayOrders,
      pendingOrders,
      deliveredOrders,
      failedDeliveries,
      cancelledOrders,
      outForDelivery,
      totalMenus,
      completionRate,
      ordersLast7Days,
      revenueByMonth,
      pendingCustomMealRequests: pendingCustom,
      pendingRiderWithdrawals: pendingWithdrawals,
      revenueToday: revenueToday._sum.total?.toString() ?? "0",
      revenueThisMonth: revenueMonth._sum.total?.toString() ?? "0",
      popularMeals: popularMeals.map((m) => ({
        mealId: m.mealId,
        name: nameById.get(m.mealId) ?? m.mealId,
        quantity: m._sum.quantity ?? 0,
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
