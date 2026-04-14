import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET  /orders/:id/post-delivery -- get or init post-delivery flow state */
export async function GET(req: Request, ctx: Params) {
  try {
    const { profile } = await requireCustomer(req);
    const { id } = await ctx.params;
    const order = await prisma.order.findFirst({
      where: { id, customerId: profile.id },
      select: { id: true, status: true, assignment: { select: { riderId: true, rider: { select: { fullName: true } } } } },
    });
    if (!order) return errorJson("Not found", 404);
    if (order.status !== "DELIVERED") return errorJson("Order not yet delivered", 400);

    const flow = await prisma.postDeliveryFlowState.upsert({
      where: { orderId: id },
      create: { orderId: id, customerId: profile.id },
      update: {},
    });

    return json({
      orderId: id,
      successModalSeen: flow.successModalSeen,
      orderRated: flow.orderRated,
      driverRated: flow.driverRated,
      tipHandled: flow.tipHandled,
      mealsRated: flow.mealsRated,
      completedAt: flow.completedAt?.toISOString() ?? null,
      hasRider: !!order.assignment,
      riderName: order.assignment?.rider.fullName ?? null,
      riderId: order.assignment?.riderId ?? null,
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}

/** PATCH /orders/:id/post-delivery -- update flow state step */
export async function PATCH(req: Request, ctx: Params) {
  try {
    const { profile } = await requireCustomer(req);
    const { id } = await ctx.params;
    const body = (await req.json()) as Record<string, boolean>;

    const order = await prisma.order.findFirst({
      where: { id, customerId: profile.id, status: "DELIVERED" },
      select: { id: true },
    });
    if (!order) return errorJson("Not found or not delivered", 404);

    const allowed = ["successModalSeen", "orderRated", "driverRated", "tipHandled", "mealsRated"] as const;
    const data: Record<string, boolean> = {};
    for (const k of allowed) {
      if (body[k] === true) data[k] = true;
    }

    const flow = await prisma.postDeliveryFlowState.upsert({
      where: { orderId: id },
      create: { orderId: id, customerId: profile.id, ...data },
      update: data,
    });

    const allDone = flow.successModalSeen && flow.orderRated && flow.driverRated && flow.tipHandled && flow.mealsRated;
    if (allDone && !flow.completedAt) {
      await prisma.postDeliveryFlowState.update({ where: { orderId: id }, data: { completedAt: new Date() } });
    }

    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
