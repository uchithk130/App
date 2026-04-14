import { z } from "zod";
import { MealListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  mealId: z.string().min(1),
  quantity: z.number().int().min(1).max(50).default(1),
});

export async function POST(req: Request) {
  try {
    const { profile } = await requireCustomer(req);
    const body = bodySchema.parse(await req.json());
    const meal = await prisma.meal.findFirst({
      where: {
        id: body.mealId,
        deletedAt: null,
        isActive: true,
        listingStatus: MealListingStatus.ACTIVE,
      },
    });
    if (!meal) return errorJson("Meal not available", 400);

    const cart = await prisma.cart.upsert({
      where: { customerId: profile.id },
      update: {},
      create: { customerId: profile.id },
    });

    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, mealId: meal.id },
    });
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + body.quantity, unitPrice: meal.basePrice },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, mealId: meal.id, quantity: body.quantity, unitPrice: meal.basePrice },
      });
    }
    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
