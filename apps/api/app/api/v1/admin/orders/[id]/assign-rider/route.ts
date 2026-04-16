import { z } from "zod";
import { OrderStatus, RiderApprovalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import { getWhatsAppProvider } from "@/lib/integrations/whatsapp";
import { buildGoogleMapsUrl } from "@fitmeals/utils";
import { writeAudit } from "@/lib/services/audit";
import { canTransition, transitionOrderStatus } from "@/lib/services/order-transition";
import { createNotification } from "@/lib/services/notifications";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  riderProfileId: z.string().min(1),
});

export async function POST(req: Request, ctx: Params) {
  try {
    const { auth } = await requireAdmin(req);
    const { id: orderId } = await ctx.params;
    const body = bodySchema.parse(await req.json());

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { include: { user: true } },
        payment: true,
        assignment: true,
      },
    });
    if (!order) return errorJson("Order not found", 404);

    const rider = await prisma.riderProfile.findUnique({
      where: { id: body.riderProfileId },
      include: { user: true },
    });
    if (!rider) return errorJson("Rider not found", 404);
    if (rider.approvalStatus !== RiderApprovalStatus.APPROVED) {
      return errorJson("Rider is not approved for deliveries", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.riderAssignment.deleteMany({ where: { orderId } });
      await tx.riderAssignment.create({
        data: {
          orderId,
          riderId: rider.id,
          assignedByAdminId: auth.sub,
        },
      });

      // Auto-transition to ASSIGNED if valid from current status
      if (canTransition(order.status, OrderStatus.ASSIGNED)) {
        await transitionOrderStatus(tx, {
          orderId,
          to: OrderStatus.ASSIGNED,
          note: `Rider ${rider.fullName} assigned`,
          changedByRole: "ADMIN",
          changedByUserId: auth.sub,
        });
      }
    });

    const snap = order.addressSnapshot as Record<string, unknown>;
    const maps = buildGoogleMapsUrl({
      lat: snap.lat ? Number(snap.lat) : undefined,
      lng: snap.lng ? Number(snap.lng) : undefined,
      address: [snap.line1, snap.city, snap.pincode].filter(Boolean).join(", "),
    });

    const wa = getWhatsAppProvider();
    const phone = rider.user.phone;
    if (phone) {
      await wa.sendMessage(phone, "rider_assigned", {
        orderId,
        customerName: order.customer.fullName,
        customerPhone: order.customer.user.phone,
        address: [snap.line1, snap.city, snap.pincode].join(", "),
        notes: order.customer.deliveryNotes,
        mapsUrl: maps,
        paymentType: order.payment?.method ?? "UNKNOWN",
      });
    }

    await writeAudit({
      actorUserId: auth.sub,
      action: "order.assign_rider",
      entityType: "Order",
      entityId: orderId,
      after: { riderProfileId: rider.id },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    // Notify rider
    void createNotification({
      userId: rider.user.id,
      type: "order.assigned",
      title: "New delivery assigned",
      body: `Order #${orderId.slice(-6).toUpperCase()} for ${order.customer.fullName}`,
      data: { orderId },
    });

    // Notify customer
    void createNotification({
      userId: order.customer.user.id,
      type: "order.rider_assigned",
      title: "Rider on the way!",
      body: `${rider.fullName} has been assigned to your order`,
      data: { orderId, riderName: rider.fullName },
    });

    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
