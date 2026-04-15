import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { hashRefreshToken, signAccessToken } from "@/lib/auth/tokens";
import { getRefreshCookie } from "@/lib/auth/cookies";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    let raw = await getRefreshCookie();
    if (!raw) {
      const body = (await req.json().catch(() => null)) as { refreshToken?: string } | null;
      if (body?.refreshToken) raw = body.refreshToken;
    }
    if (!raw) return errorJson("No session", 401);
    const tokenHash = hashRefreshToken(raw);
    const session = await prisma.session.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
      include: { user: { include: { roles: { include: { role: true } } } } },
    });
    if (!session?.user || session.user.deletedAt) return errorJson("Invalid session", 401);
    const roles = session.user.roles.map((r) => r.role.code);
    const scope = session.user.appScope;
    const accessToken = await signAccessToken({ sub: session.user.id, roles, scope });
    return json({ accessToken, expiresIn: 900 });
  } catch {
    return errorJson("Server error", 500);
  }
}
