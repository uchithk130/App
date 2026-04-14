import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import {
  canAdminTransition,
  adminNextStatuses,
  transitionOrderStatus,
} from "@/lib/services/order-transition";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().max(500).optional(),
});

/** GET /admin/orders/:id/status -- valid next statuses for admin */
export async function GET(req: Request, ctx: Params) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!order) return errorJson("Not found", 404);

    const next = adminNextStatuses(order.status);
    return json({ currentStatus: order.status, allowedStatuses: next });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}

/** PATCH /admin/orders/:id/status -- admin updates order status */
export async function PATCH(req: Request, ctx: Params) {
  try {
    const { auth } = await requireAdmin(req);
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!order) return errorJson("Not found", 404);

    if (!canAdminTransition(order.status, body.status)) {
      return errorJson(
        `Admin cannot transition from ${order.status} to ${body.status}`,
        400,
        "INVALID_TRANSITION"
      );
    }

    await prisma.$transaction(async (tx) => {
      await transitionOrderStatus(tx, {
        orderId: id,
        to: body.status,
        note: body.note,
        changedByRole: "ADMIN",
        changedByUserId: auth.sub,
      });
    });

    return json({ ok: true, status: body.status });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
