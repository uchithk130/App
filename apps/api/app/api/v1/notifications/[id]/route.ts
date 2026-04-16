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

/** PATCH /api/v1/notifications/[id]  mark single notification as read */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId(req);
    if (!userId) return errorJson("Unauthorized", 401);
    const { id } = await params;

    await prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });

    return json({ ok: true });
  } catch {
    return errorJson("Server error", 500);
  }
}
