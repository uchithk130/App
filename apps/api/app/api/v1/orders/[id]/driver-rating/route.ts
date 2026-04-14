import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

/** POST /orders/:id/driver-rating */
export async function POST(req: Request, ctx: Params) {
  try {
    const { profile } = await requireCustomer(req);
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());

    const order = await prisma.order.findFirst({
      where: { id, customerId: profile.id, status: "DELIVERED" },
      include: { assignment: true },
    });
    if (!order) return errorJson("Order not found or not delivered", 404);
    if (!order.assignment) return errorJson("No rider assigned to this order", 400);

    const existing = await prisma.driverRating.findUnique({ where: { orderId: id } });
    if (existing) return errorJson("Already rated", 409);

    const rating = await prisma.driverRating.create({
      data: {
        orderId: id,
        customerId: profile.id,
        riderId: order.assignment.riderId,
        rating: body.rating,
        comment: body.comment ?? null,
      },
    });

    await prisma.postDeliveryFlowState.upsert({
      where: { orderId: id },
      create: { orderId: id, customerId: profile.id, driverRated: true },
      update: { driverRated: true },
    });

    return json({ id: rating.id, rating: rating.rating });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
