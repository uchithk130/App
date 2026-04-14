import { z } from "zod";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { hashPassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

function hashToken(t: string) {
  return createHash("sha256").update(t).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const tokenHash = hashToken(body.token);
    const row = await prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!row) return errorJson("Invalid or expired token", 400);
    const passwordHash = await hashPassword(body.password);
    await prisma.$transaction([
      prisma.user.update({ where: { id: row.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
      prisma.session.deleteMany({ where: { userId: row.userId } }),
    ]);
    return json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
