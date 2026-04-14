import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

/** In-progress delivery statuses: assigned to a rider but not terminal. */
const ACTIVE_DELIVERY_STATUSES: OrderStatus[] = [
  OrderStatus.ASSIGNED,
  OrderStatus.OUT_FOR_DELIVERY,
];

export async function GET(req: Request) {
  try {
    await requireAdmin(req);

    const orders = await prisma.order.findMany({
      where: {
        status: { in: ACTIVE_DELIVERY_STATUSES },
        assignment: { isNot: null },
      },
      take: 100,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        addressSnapshot: true,
        customer: { select: { fullName: true } },
        assignment: {
          select: {
            riderId: true,
            assignedAt: true,
            rider: {
              select: {
                fullName: true,
                vehicleType: true,
                vehicleNumber: true,
                lastKnownLat: true,
                lastKnownLng: true,
                locationUpdatedAt: true,
                user: { select: { phone: true } },
              },
            },
          },
        },
        statusLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true, createdAt: true },
        },
      },
    });

    const items = orders.map((o) => {
      const snap = o.addressSnapshot as Record<string, unknown>;
      const destLat = snap.lat ? Number(snap.lat) : null;
      const destLng = snap.lng ? Number(snap.lng) : null;

      return {
        id: o.id,
        status: o.status,
        total: o.total.toString(),
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        customerName: o.customer.fullName,
        address: snap,
        destination: destLat && destLng ? { lat: destLat, lng: destLng } : null,
        rider: o.assignment
          ? {
              id: o.assignment.riderId,
              name: o.assignment.rider.fullName,
              vehicleType: o.assignment.rider.vehicleType,
              vehicleNumber: o.assignment.rider.vehicleNumber,
              phone: o.assignment.rider.user.phone,
              assignedAt: o.assignment.assignedAt.toISOString(),
              location:
                o.assignment.rider.lastKnownLat && o.assignment.rider.lastKnownLng
                  ? {
                      lat: Number(o.assignment.rider.lastKnownLat),
                      lng: Number(o.assignment.rider.lastKnownLng),
                      updatedAt: o.assignment.rider.locationUpdatedAt?.toISOString() ?? null,
                    }
                  : null,
            }
          : null,
        lastStatusAt: o.statusLogs[0]?.createdAt.toISOString() ?? o.updatedAt.toISOString(),
      };
    });

    return json({ items });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
