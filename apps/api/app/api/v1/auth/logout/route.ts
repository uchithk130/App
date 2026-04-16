import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { hashRefreshToken } from "@/lib/auth/tokens";
import { clearRefreshCookie, getRefreshCookie } from "@/lib/auth/cookies";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { app?: string } | null;
    const app = body?.app;
    const raw = await getRefreshCookie(app);
    if (raw) {
      const tokenHash = hashRefreshToken(raw);
      await prisma.session.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: "user_logout" },
      });
    }
    await clearRefreshCookie(app);
    return json({ ok: true });
  } catch {
    return errorJson("Server error", 500);
  }
}
