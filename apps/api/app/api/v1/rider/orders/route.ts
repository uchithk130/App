import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireRider, AuthError } from "@/lib/auth/rider";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { profile } = await requireRider(req);
    const url = new URL(req.url);
    const rawStatus = url.searchParams.get("status");
    const status =
      rawStatus && (Object.values(OrderStatus) as string[]).includes(rawStatus)
        ? (rawStatus as OrderStatus)
        : undefined;

    const orders = await prisma.order.findMany({
      where: {
        assignment: { riderId: profile.id, unassignedAt: null },
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        addressSnapshot: true,
        slot: { select: { label: true } },
        payment: { select: { method: true } },
        customer: { select: { fullName: true, user: { select: { phone: true } } } },
      },
    });

    return json({
      items: orders.map((o) => ({
        ...o,
        total: o.total.toString(),
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
