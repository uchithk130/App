import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import { cursorQuerySchema, decodeCursor, encodeCursor } from "@/lib/pagination";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const url = new URL(req.url);
    const q = cursorQuerySchema.parse(Object.fromEntries(url.searchParams));
    const cursorId = q.cursor ? decodeCursor(q.cursor) : null;
    if (q.cursor && !cursorId) return errorJson("Invalid cursor", 400);

    const statusRaw = url.searchParams.get("status");
    const statuses = statusRaw
      ? (statusRaw.split(",").filter((s) => (Object.values(OrderStatus) as string[]).includes(s)) as OrderStatus[])
      : undefined;

    const rows = await prisma.order.findMany({
      where: statuses?.length ? { status: { in: statuses } } : undefined,
      take: q.limit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(cursorId ? { skip: 1, cursor: { id: cursorId } } : {}),
      select: {
        id: true,
        status: true,
        total: true,
        addressSnapshot: true,
        customer: { select: { fullName: true } },
        assignment: { select: { riderId: true } },
        createdAt: true,
      },
    });

    let nextCursor: string | null = null;
    const page = rows;
    if (page.length > q.limit) {
      const last = page[q.limit - 1]!;
      nextCursor = encodeCursor(last.id);
      page.pop();
    }

    return json({
      items: page.map((o) => ({
        ...o,
        total: o.total.toString(),
      })),
      nextCursor,
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
