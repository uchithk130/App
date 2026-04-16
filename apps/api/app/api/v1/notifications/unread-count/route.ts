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

/** GET /api/v1/notifications/unread-count  lightweight badge endpoint */
export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) return errorJson("Unauthorized", 401);

    const count = await prisma.notification.count({
      where: { userId, readAt: null },
    });

    return json({ count });
  } catch {
    return errorJson("Server error", 500);
  }
}
