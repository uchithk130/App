import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { verifyAccessToken } from "@/lib/auth/tokens";

export const dynamic = "force-dynamic";

/** GET - fetch store/counter location (for riders) */
export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return errorJson("Unauthorized", 401);
    const p = await verifyAccessToken(auth.slice(7));
    if (!p) return errorJson("Unauthorized", 401);

    const row = await prisma.adminSetting.findUnique({ where: { key: "store.location" } });
    return json({ location: row?.value ?? null });
  } catch {
    return errorJson("Server error", 500);
  }
}
