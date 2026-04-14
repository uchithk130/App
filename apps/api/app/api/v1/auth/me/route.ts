import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAccess, AuthError } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await requireAccess(req);
    const user = await prisma.user.findFirst({
      where: { id: auth.sub, deletedAt: null },
      select: { id: true, email: true, roles: { select: { role: { select: { code: true } } } } },
    });
    if (!user) return errorJson("Not found", 404);
    return json({
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles.map((r) => r.role.code),
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
