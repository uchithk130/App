import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { verifyAccessToken } from "@/lib/auth/tokens";
import { hashRefreshToken } from "@/lib/auth/tokens";
import { getRefreshCookie } from "@/lib/auth/cookies";

export const dynamic = "force-dynamic";

async function getCurrentUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const payload = await verifyAccessToken(auth.slice(7));
  return payload?.sub ?? null;
}

async function getCurrentSessionId(): Promise<string | null> {
  const raw = await getRefreshCookie();
  if (!raw) return null;
  const tokenHash = hashRefreshToken(raw);
  const session = await prisma.session.findFirst({
    where: { tokenHash, revokedAt: null },
    select: { id: true },
  });
  return session?.id ?? null;
}

/** DELETE /api/v1/auth/sessions/[id] - revoke a specific session */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return errorJson("Unauthorized", 401);
    const { id } = await params;

    const session = await prisma.session.findFirst({
      where: { id, userId, revokedAt: null },
    });
    if (!session) return errorJson("Session not found", 404);

    await prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), revokeReason: "user_revoked" },
    });

    return json({ ok: true });
  } catch {
    return errorJson("Server error", 500);
  }
}
