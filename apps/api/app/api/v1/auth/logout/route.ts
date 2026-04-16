import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { hashRefreshToken } from "@/lib/auth/tokens";
import { clearRefreshCookie, getRefreshCookie } from "@/lib/auth/cookies";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const raw = await getRefreshCookie();
    if (raw) {
      const tokenHash = hashRefreshToken(raw);
      await prisma.session.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: "user_logout" },
      });
    }
    await clearRefreshCookie();
    return json({ ok: true });
  } catch {
    return errorJson("Server error", 500);
  }
}
