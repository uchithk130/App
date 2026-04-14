import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Params) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            deliveryNotes: true,
            user: { select: { email: true, phone: true } },
          },
        },
        items: {
          include: {
            meal: { select: { name: true, slug: true } },
          },
        },
        payment: true,
        assignment: {
          include: {
            rider: {
              select: {
                id: true,
                fullName: true,
                vehicleType: true,
                vehicleNumber: true,
                user: { select: { phone: true } },
              },
            },
          },
        },
        zone: { select: { name: true } },
        statusLogs: { orderBy: { createdAt: "asc" } },
        slot: { select: { label: true } },
      },
    });

    if (!order) return errorJson("Order not found", 404);

    return json({
      id: order.id,
      status: order.status,
      type: order.type,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      subtotal: order.subtotal.toString(),
      deliveryFee: order.deliveryFee.toString(),
      tax: order.tax.toString(),
      discount: order.discount.toString(),
      total: order.total.toString(),
      addressSnapshot: order.addressSnapshot,
      zoneName: order.zone.name,
      slotLabel: order.slot?.label ?? null,
      customer: {
        id: order.customer.id,
        fullName: order.customer.fullName,
        email: order.customer.user.email,
        phone: order.customer.user.phone,
        deliveryNotes: order.customer.deliveryNotes,
      },
      items: order.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        unitPrice: i.unitPrice.toString(),
        mealName: i.meal.name,
        mealSlug: i.meal.slug,
      })),
      payment: order.payment
        ? {
            method: order.payment.method,
            status: order.payment.status,
            amount: order.payment.amount.toString(),
            paidAt: order.payment.createdAt.toISOString(),
          }
        : null,
      rider: order.assignment
        ? {
            id: order.assignment.rider.id,
            fullName: order.assignment.rider.fullName,
            vehicleType: order.assignment.rider.vehicleType,
            vehicleNumber: order.assignment.rider.vehicleNumber,
            phone: order.assignment.rider.user.phone,
            assignedAt: order.assignment.assignedAt.toISOString(),
          }
        : null,
      statusLogs: order.statusLogs.map((l) => ({
        status: l.status,
        note: l.note,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
