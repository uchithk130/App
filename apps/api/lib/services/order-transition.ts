import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../prisma";

/** Full state machine -- every legal forward transition. */
const forward: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: [OrderStatus.PENDING_PAYMENT],
  PENDING_PAYMENT: [OrderStatus.PAID, OrderStatus.CANCELLED],
  PAID: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
  READY_FOR_PICKUP: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  ASSIGNED: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.FAILED_DELIVERY, OrderStatus.CANCELLED],
  DELIVERED: [OrderStatus.REFUNDED],
  FAILED_DELIVERY: [OrderStatus.CANCELLED, OrderStatus.REFUNDED],
  CANCELLED: [OrderStatus.REFUNDED],
  REFUNDED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return forward[from]?.includes(to) ?? false;
}

/* ?? Role-scoped helpers ?? */

/** Statuses an admin may push an order into. */
const ADMIN_ALLOWED_TARGETS: Set<OrderStatus> = new Set([
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  // ASSIGNED is set automatically when a rider is assigned -- not manually.
  OrderStatus.CANCELLED,
]);

/** Statuses only a rider may set. */
const RIDER_ALLOWED_TARGETS: Set<OrderStatus> = new Set([
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.FAILED_DELIVERY,
]);

/** Return only the next statuses an admin may choose from the current status. */
export function adminNextStatuses(current: OrderStatus): OrderStatus[] {
  return (forward[current] ?? []).filter((s) => ADMIN_ALLOWED_TARGETS.has(s));
}

/** Return only the next statuses a rider may choose from the current status. */
export function riderNextStatuses(current: OrderStatus): OrderStatus[] {
  return (forward[current] ?? []).filter((s) => RIDER_ALLOWED_TARGETS.has(s));
}

/** Verify an admin is allowed to set `to` from `from`. */
export function canAdminTransition(from: OrderStatus, to: OrderStatus) {
  return ADMIN_ALLOWED_TARGETS.has(to) && canTransition(from, to);
}

/** Verify a rider is allowed to set `to` from `from`. */
export function canRiderTransition(from: OrderStatus, to: OrderStatus) {
  return RIDER_ALLOWED_TARGETS.has(to) && canTransition(from, to);
}

/* ?? Core transition writer ?? */

export async function transitionOrderStatus(
  tx: Prisma.TransactionClient,
  input: {
    orderId: string;
    to: OrderStatus;
    note?: string;
    meta?: object;
    changedByRole?: string;
    changedByUserId?: string;
  }
) {
  const order = await tx.order.findUnique({ where: { id: input.orderId } });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (!canTransition(order.status, input.to)) throw new Error("INVALID_TRANSITION");
  await tx.order.update({
    where: { id: input.orderId },
    data: { status: input.to },
  });
  await tx.deliveryStatusLog.create({
    data: {
      orderId: input.orderId,
      status: input.to,
      note: input.note,
      meta: {
        ...(input.meta as object | undefined),
        fromStatus: order.status,
        changedByRole: input.changedByRole,
        changedByUserId: input.changedByUserId,
      } as object,
    },
  });
}
