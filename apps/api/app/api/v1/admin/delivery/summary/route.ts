import { OrderStatus, RiderApprovalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const ASSIGNABLE: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
];

const ACTIVE_DELIVERY: OrderStatus[] = [
  OrderStatus.ASSIGNED,
  OrderStatus.OUT_FOR_DELIVERY,
];

const TERMINAL: OrderStatus[] = [
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
  OrderStatus.FAILED_DELIVERY,
];

export async function GET(req: Request) {
  try {
    await requireAdmin(req);

    const [
      unassignedCount,
      readyCount,
      assignedCount,
      onTheWayCount,
      deliveredTodayCount,
      totalApproved,
      busyRiderRows,
    ] = await Promise.all([
      prisma.order.count({
        where: { status: { in: ASSIGNABLE }, assignment: null },
      }),
      prisma.order.count({
        where: { status: OrderStatus.READY_FOR_PICKUP },
      }),
      prisma.order.count({
        where: { status: OrderStatus.ASSIGNED },
      }),
      prisma.order.count({
        where: { status: OrderStatus.OUT_FOR_DELIVERY },
      }),
      prisma.order.count({
        where: {
          status: OrderStatus.DELIVERED,
          updatedAt: { gte: todayStart() },
        },
      }),
      prisma.riderProfile.count({
        where: { approvalStatus: RiderApprovalStatus.APPROVED },
      }),
      prisma.riderAssignment.findMany({
        where: {
          unassignedAt: null,
          order: { status: { notIn: TERMINAL } },
        },
        select: { riderId: true },
        distinct: ["riderId"],
      }),
    ]);

    const busyCount = busyRiderRows.length;
    const freeCount = Math.max(0, totalApproved - busyCount);

    return json({
      unassignedOrders: unassignedCount,
      readyForPickup: readyCount,
      assignedOrders: assignedCount,
      onTheWay: onTheWayCount,
      deliveredToday: deliveredTodayCount,
      ridersAvailable: freeCount,
      ridersBusy: busyCount,
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
