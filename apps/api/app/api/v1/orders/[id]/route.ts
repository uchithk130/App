import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";
import { customerMealImageUrl } from "@/lib/meal-image-customer";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Params) {
  try {
    const { profile } = await requireCustomer(req);
    const { id } = await ctx.params;
    const order = await prisma.order.findFirst({
      where: { id, customerId: profile.id },
      include: {
        items: {
          include: {
            meal: {
              select: {
                name: true,
                slug: true,
                images: { take: 1, orderBy: { sortOrder: "asc" } },
              },
            },
          },
        },
        payment: true,
        assignment: { include: { rider: { select: { id: true, fullName: true } } } },
        statusLogs: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!order) return errorJson("Not found", 404);

    const terminal = ["DELIVERED", "CANCELLED", "REFUNDED", "FAILED_DELIVERY"].includes(order.status);

    return json({
      ...order,
      subtotal: order.subtotal.toString(),
      deliveryFee: order.deliveryFee.toString(),
      tax: order.tax.toString(),
      discount: order.discount.toString(),
      total: order.total.toString(),
      // Strip rider details after delivery for privacy
      assignment: terminal ? null : order.assignment,
      // Strip address coordinates after delivery
      addressSnapshot: terminal
        ? { ...(order.addressSnapshot as Record<string, unknown>), lat: undefined, lng: undefined }
        : order.addressSnapshot,
      items: order.items.map((i) => ({
        ...i,
        unitPrice: i.unitPrice.toString(),
        meal: {
          ...i.meal,
          coverUrl: customerMealImageUrl(req, i.meal.images[0]?.url) ?? null,
        },
      })),
      payment: order.payment
        ? {
            ...order.payment,
            amount: order.payment.amount.toString(),
          }
        : null,
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
