import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { verifyAccessToken, hashRefreshToken } from "@/lib/auth/tokens";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { getRefreshCookie } from "@/lib/auth/cookies";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  logoutOtherSessions: z.boolean().optional(),
});

/** PATCH /api/v1/auth/password - change password */
export async function PATCH(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return errorJson("Unauthorized", 401);
    const payload = await verifyAccessToken(auth.slice(7));
    if (!payload) return errorJson("Unauthorized", 401);

    const body = bodySchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return errorJson("User not found", 404);

    const ok = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!ok) return errorJson("Current password is incorrect", 403);

    const newHash = await hashPassword(body.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Optionally revoke other sessions
    if (body.logoutOtherSessions) {
      const raw = await getRefreshCookie();
      const currentTokenHash = raw ? hashRefreshToken(raw) : null;
      const now = new Date();

      if (currentTokenHash) {
        await prisma.session.updateMany({
          where: {
            userId: user.id,
            revokedAt: null,
            tokenHash: { not: currentTokenHash },
          },
          data: { revokedAt: now, revokeReason: "password_changed" },
        });
      }
    }

    return json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
