import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const SETTING_KEY = "store.location";

const bodySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
});

/** GET - fetch store/counter location */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const row = await prisma.adminSetting.findUnique({ where: { key: SETTING_KEY } });
    return json({ location: row?.value ?? null });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}

/** PUT - set store/counter location */
export async function PUT(req: Request) {
  try {
    await requireAdmin(req);
    const body = bodySchema.parse(await req.json());
    await prisma.adminSetting.upsert({
      where: { key: SETTING_KEY },
      create: { key: SETTING_KEY, value: body as object },
      update: { value: body as object },
    });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
