import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

/** Orders eligible for rider assignment (not yet assigned, not terminal). */
const ASSIGNABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
];

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const url = new URL(req.url);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));

    const orders = await prisma.order.findMany({
      where: { status: { in: ASSIGNABLE_STATUSES } },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        total: true,
        addressSnapshot: true,
        customer: { select: { fullName: true } },
        assignment: {
          select: {
            riderId: true,
            rider: { select: { fullName: true } },
          },
        },
        zone: { select: { name: true } },
      },
    });

    const items = orders.map((o) => ({
      id: o.id,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      total: o.total.toString(),
      customerName: o.customer.fullName,
      currentRiderName: o.assignment?.rider.fullName ?? null,
      currentRiderId: o.assignment?.riderId ?? null,
      zoneName: o.zone.name,
      address: o.addressSnapshot as Record<string, unknown>,
    }));

    return json({ items });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
