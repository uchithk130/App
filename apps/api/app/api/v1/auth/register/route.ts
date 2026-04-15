import { z } from "zod";
import { AppScope, RoleCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { hashPassword } from "@/lib/auth/password";
import { createRefreshTokenValue, hashRefreshToken, signAccessToken } from "@/lib/auth/tokens";
import { setRefreshCookie } from "@/lib/auth/cookies";
import { refreshExpiresAt, refreshMaxAgeSeconds } from "@/lib/auth/refresh-ttl";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const email = body.email.toLowerCase();

    const roleCustomer = await prisma.role.findUnique({ where: { code: RoleCode.CUSTOMER } });
    if (!roleCustomer) return errorJson("Roles not seeded", 500);

    // Check ONLY customer-scoped accounts
    const existing = await prisma.user.findUnique({
      where: { email_appScope: { email, appScope: AppScope.CUSTOMER } },
    });

    if (existing) {
      return errorJson(
        "A customer account with this email already exists. Please log in.",
        409,
        "ALREADY_CUSTOMER",
      );
    }

    // Create a new customer-scoped User
    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email,
        phone: body.phone,
        passwordHash,
        appScope: AppScope.CUSTOMER,
        roles: { create: [{ roleId: roleCustomer.id }] },
        customerProfile: { create: { fullName: body.fullName } },
      },
    });

    const refresh = createRefreshTokenValue();
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(refresh),
        expiresAt: refreshExpiresAt(),
        userAgent: req.headers.get("user-agent")?.slice(0, 512) ?? null,
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      },
    });
    await setRefreshCookie(refresh, refreshMaxAgeSeconds());
    const accessToken = await signAccessToken({
      sub: user.id,
      roles: [RoleCode.CUSTOMER],
      scope: "CUSTOMER",
    });
    const payload: { accessToken: string; expiresIn: number; refreshToken?: string } = {
      accessToken,
      expiresIn: 900,
    };
    if (process.env.AUTH_RETURN_REFRESH_BODY === "1" || process.env.AUTH_RETURN_REFRESH_BODY === "true") {
      payload.refreshToken = refresh;
    }
    return json(payload);
  } catch (e) {
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
