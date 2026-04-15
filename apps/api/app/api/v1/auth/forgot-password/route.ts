import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { AppScope } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  app: z.enum(["customer", "rider", "admin"]).default("customer"),
});

const appScopes: Record<string, AppScope> = {
  customer: AppScope.CUSTOMER,
  rider: AppScope.RIDER,
  admin: AppScope.ADMIN,
};

function hashToken(t: string) {
  return createHash("sha256").update(t).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const email = body.email.toLowerCase();
    const scope = appScopes[body.app]!;

    // Only look up the user for the specified app scope
    const user = await prisma.user.findUnique({
      where: { email_appScope: { email, appScope: scope }, deletedAt: null },
    });

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
    // Always return OK to not leak email existence
    return json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
