import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { verifyAccessToken, hashRefreshToken } from "@/lib/auth/tokens";
import { getRefreshCookie } from "@/lib/auth/cookies";

export const dynamic = "force-dynamic";

/** DELETE /api/v1/auth/sessions/others - revoke all sessions except current */
export async function DELETE(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return errorJson("Unauthorized", 401);
    const payload = await verifyAccessToken(auth.slice(7));
    if (!payload) return errorJson("Unauthorized", 401);

    // Find current session to keep it alive
    const raw = await getRefreshCookie();
    let currentTokenHash: string | null = null;
    if (raw) currentTokenHash = hashRefreshToken(raw);

    const now = new Date();

    if (currentTokenHash) {
      await prisma.session.updateMany({
        where: {
          userId: payload.sub,
          revokedAt: null,
          tokenHash: { not: currentTokenHash },
        },
        data: { revokedAt: now, revokeReason: "logout_all_others" },
      });
    } else {
      await prisma.session.updateMany({
        where: { userId: payload.sub, revokedAt: null },
        data: { revokedAt: now, revokeReason: "logout_all_others" },
      });
    }

    return json({ ok: true });
  } catch {
    return errorJson("Server error", 500);
  }
}
