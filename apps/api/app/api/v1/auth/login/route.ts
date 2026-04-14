import { z } from "zod";
import { RoleCode, RiderApprovalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { verifyPassword } from "@/lib/auth/password";
import { createRefreshTokenValue, hashRefreshToken, signAccessToken } from "@/lib/auth/tokens";
import { setRefreshCookie } from "@/lib/auth/cookies";
import { refreshExpiresAt, refreshMaxAgeSeconds } from "@/lib/auth/refresh-ttl";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  app: z.enum(["customer", "admin", "rider"]),
});

const appRole: Record<string, RoleCode> = {
  customer: RoleCode.CUSTOMER,
  admin: RoleCode.ADMIN,
  rider: RoleCode.RIDER,
};

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const requiredRole = appRole[body.app]!;
    const user = await prisma.user.findFirst({
      where: { email: body.email.toLowerCase(), deletedAt: null },
      include: { roles: { include: { role: true } } },
    });
    if (!user) return errorJson("Invalid credentials", 401);
    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) return errorJson("Invalid credentials", 401);
    const roles = user.roles.map((r) => r.role.code);
    if (!roles.includes(requiredRole)) return errorJson("Invalid account for this app", 403);

    if (body.app === "rider") {
      const rp = await prisma.riderProfile.findUnique({ where: { userId: user.id } });
      if (!rp) return errorJson("Invalid account for this app", 403);
      if (rp.approvalStatus === RiderApprovalStatus.PENDING) {
        return errorJson("Your rider account is pending admin approval", 403, "RIDER_PENDING");
      }
      if (rp.approvalStatus === RiderApprovalStatus.REJECTED) {
        return errorJson("Your rider registration was not approved", 403, "RIDER_REJECTED");
      }
      if (rp.approvalStatus === (RiderApprovalStatus as Record<string, string>).SUSPENDED) {
        return errorJson("Your rider account has been suspended", 403, "RIDER_SUSPENDED");
      }
    }

    const refresh = createRefreshTokenValue();
    const tokenHash = hashRefreshToken(refresh);
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: refreshExpiresAt(),
        userAgent: req.headers.get("user-agent")?.slice(0, 512) ?? null,
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      },
    });
    await setRefreshCookie(refresh, refreshMaxAgeSeconds());
    const accessToken = await signAccessToken({ sub: user.id, roles });
    return json({ accessToken, expiresIn: 900, refreshToken: refresh });
  } catch (e) {
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
