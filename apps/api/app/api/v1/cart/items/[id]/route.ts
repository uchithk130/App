import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Params) {
  try {
    const { profile } = await requireCustomer(req);
    const { id } = await ctx.params;
    const body = z.object({ quantity: z.number().int().min(1).max(50) }).parse(await req.json());
    const cart = await prisma.cart.findUnique({ where: { customerId: profile.id } });
    if (!cart) return errorJson("Cart empty", 400);
    const item = await prisma.cartItem.findFirst({
      where: { id, cartId: cart.id },
      include: { meal: true },
    });
    if (!item) return errorJson("Not found", 404);
    await prisma.cartItem.update({
      where: { id },
      data: { quantity: body.quantity, unitPrice: item.meal.basePrice },
    });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}

export async function DELETE(req: Request, ctx: Params) {
  try {
    const { profile } = await requireCustomer(req);
    const { id } = await ctx.params;
    const cart = await prisma.cart.findUnique({ where: { customerId: profile.id } });
    if (!cart) return errorJson("Cart empty", 400);
    const item = await prisma.cartItem.findFirst({ where: { id, cartId: cart.id } });
    if (!item) return errorJson("Not found", 404);
    await prisma.cartItem.delete({ where: { id } });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
