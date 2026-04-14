import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
});

function hashToken(t: string) {
  return createHash("sha256").update(t).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const email = body.email.toLowerCase();
    const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (user) {
      const raw = randomBytes(32).toString("hex");
      const tokenHash = hashToken(raw);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });
      // In production, email link with `raw` token. Never return token in API response.
      if (process.env.NODE_ENV === "development") {
        return json({ ok: true, devResetToken: raw });
      }
    }
    return json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
