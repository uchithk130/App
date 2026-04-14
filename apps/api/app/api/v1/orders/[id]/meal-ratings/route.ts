import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const itemSchema = z.object({
  mealId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(50),
});

/** POST /orders/:id/meal-ratings -- submit meal-level reviews */
export async function POST(req: Request, ctx: Params) {
  try {
    const { profile } = await requireCustomer(req);
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());

    const order = await prisma.order.findFirst({
      where: { id, customerId: profile.id, status: "DELIVERED" },
      include: { items: { select: { mealId: true } } },
    });
    if (!order) return errorJson("Order not found or not delivered", 404);

    const orderMealIds = new Set(order.items.map((i) => i.mealId));
    for (const item of body.items) {
      if (!orderMealIds.has(item.mealId)) {
        return errorJson(`Meal ${item.mealId} is not part of this order`, 400);
      }
    }

    const created: string[] = [];
    for (const item of body.items) {
      const existing = await prisma.review.findUnique({
        where: { orderId_mealId: { orderId: id, mealId: item.mealId } },
      });
      if (existing) continue;

      const review = await prisma.review.create({
        data: {
          orderId: id,
          customerId: profile.id,
          mealId: item.mealId,
          rating: item.rating,
          comment: item.comment ?? null,
          isVisible: true,
        },
      });
      created.push(review.id);
    }

    await prisma.postDeliveryFlowState.upsert({
      where: { orderId: id },
      create: { orderId: id, customerId: profile.id, mealsRated: true },
      update: { mealsRated: true },
    });

    return json({ created: created.length });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
