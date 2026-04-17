import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { verifyAccessToken } from "@/lib/auth/tokens";

export const dynamic = "force-dynamic";

async function getUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const p = await verifyAccessToken(auth.slice(7));
  return p?.sub ?? null;
}

/** GET /api/v1/notifications  list notifications for current user */
export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) return errorJson("Unauthorized", 401);

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit")) || 30, 100);
    const unreadOnly = url.searchParams.get("unread") === "1";

    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId,
          ...(unreadOnly ? { readAt: null } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          data: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    return json({
      items: items.map((n) => ({
        ...n,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch {
    return errorJson("Server error", 500);
  }
}
