import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { verifyAccessToken } from "@/lib/auth/tokens";

export const dynamic = "force-dynamic";

/** POST /api/v1/notifications/read-all  mark all as read for current user */
export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return errorJson("Unauthorized", 401);
    const p = await verifyAccessToken(auth.slice(7));
    if (!p) return errorJson("Unauthorized", 401);

    await prisma.notification.updateMany({
      where: { userId: p.sub, readAt: null },
      data: { readAt: new Date() },
    });

    return json({ ok: true });
  } catch {
    return errorJson("Server error", 500);
  }
}
