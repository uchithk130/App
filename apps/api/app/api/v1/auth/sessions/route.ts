import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { hashRefreshToken } from "@/lib/auth/tokens";
import { getRefreshCookie } from "@/lib/auth/cookies";
import { verifyAccessToken } from "@/lib/auth/tokens";

export const dynamic = "force-dynamic";

function parseUA(ua: string | null) {
  if (!ua) return { browser: "Unknown", os: "Unknown", device: "Unknown" };
  let browser = "Unknown";
  let os = "Unknown";
  let device = "Desktop";

  if (/Android/i.test(ua)) { os = "Android"; device = "Mobile"; }
  else if (/iPhone|iPad/i.test(ua)) { os = "iOS"; device = /iPad/i.test(ua) ? "Tablet" : "Mobile"; }
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";

  return { browser, os, device };
}

async function getCurrentUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const payload = await verifyAccessToken(auth.slice(7));
  return payload?.sub ?? null;
}

async function getCurrentSessionId(req: Request): Promise<string | null> {
  let raw = await getRefreshCookie();
  if (!raw) {
    try {
      const body = await req.clone().json();
      if (body?.refreshToken) raw = body.refreshToken;
    } catch {}
  }
  if (!raw) return null;
  const tokenHash = hashRefreshToken(raw);
  const session = await prisma.session.findFirst({
    where: { tokenHash, revokedAt: null },
    select: { id: true },
  });
  return session?.id ?? null;
}

/** GET /api/v1/auth/sessions - list active sessions for the authenticated user */
export async function GET(req: Request) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return errorJson("Unauthorized", 401);

    const currentSessionId = await getCurrentSessionId(req);

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastSeenAt: "desc" },
      select: {
        id: true,
        userAgent: true,
        ip: true,
        createdAt: true,
        lastSeenAt: true,
        expiresAt: true,
      },
    });

    return json({
      items: sessions.map((s) => {
        const parsed = parseUA(s.userAgent);
        return {
          id: s.id,
          browser: parsed.browser,
          os: parsed.os,
          device: parsed.device,
          ip: s.ip,
          createdAt: s.createdAt.toISOString(),
          lastSeenAt: s.lastSeenAt.toISOString(),
          isCurrent: s.id === currentSessionId,
        };
      }),
    });
  } catch {
    return errorJson("Server error", 500);
  }
}
