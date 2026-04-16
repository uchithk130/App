import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireRider, AuthError } from "@/lib/auth/rider";
import { canTransition } from "@/lib/services/order-transition";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const RIDER_ACTIONS = [
  OrderStatus.PICKED_UP,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.FAILED_DELIVERY,
] as const;

export async function GET(req: Request, ctx: Params) {
  try {
    const { profile } = await requireRider(req);
    const { id: orderId } = await ctx.params;

    const order = await prisma.order.findFirst({
      where: { id: orderId, assignment: { riderId: profile.id, unassignedAt: null } },
      select: {
        id: true,
        status: true,
        total: true,
        addressSnapshot: true,
        customer: { select: { fullName: true, user: { select: { phone: true } } } },
        payment: { select: { method: true } },
      },
    });
    if (!order) return errorJson("Not found", 404);

    const allowedNext = RIDER_ACTIONS.filter((s) => canTransition(order.status, s));

    return json({
      ...order,
      total: order.total.toString(),
      allowedNext,
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
