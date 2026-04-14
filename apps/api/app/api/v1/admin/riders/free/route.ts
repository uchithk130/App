import { OrderStatus, RiderApprovalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const TERMINAL: OrderStatus[] = [
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
  OrderStatus.FAILED_DELIVERY,
];

/** Approved riders with no active assignment on a non-terminal order. */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const busy = await prisma.riderAssignment.findMany({
      where: {
        unassignedAt: null,
        order: { status: { notIn: TERMINAL } },
      },
      select: { riderId: true },
    });
    const busyIds = new Set(busy.map((b) => b.riderId));

    const riders = await prisma.riderProfile.findMany({
      where: {
        approvalStatus: RiderApprovalStatus.APPROVED,
        ...(busyIds.size > 0 ? { id: { notIn: [...busyIds] } } : {}),
      },
      orderBy: { fullName: "asc" },
      take: 200,
      select: {
        id: true,
        fullName: true,
        availability: true,
        vehicleType: true,
        vehicleNumber: true,
      },
    });

    return json({ items: riders });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
