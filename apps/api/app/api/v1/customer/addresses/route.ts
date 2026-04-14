import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
  label: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().optional(),
});

function mapRow(a: {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  lat: unknown;
  lng: unknown;
  isDefault: boolean;
  label: string | null;
}) {
  return {
    id: a.id,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    label: a.label,
    lat: a.lat != null ? Number(a.lat) : null,
    lng: a.lng != null ? Number(a.lng) : null,
    isDefault: a.isDefault,
  };
}

export async function GET(req: Request) {
  try {
    const { profile } = await requireCustomer(req);
    const rows = await prisma.address.findMany({
      where: { customerId: profile.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return json({ items: rows.map(mapRow) });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const { profile } = await requireCustomer(req);
    const body = postSchema.parse(await req.json());

    const data = {
      customerId: profile.id,
      line1: body.line1.trim(),
      line2: body.line2?.trim() || null,
      city: body.city.trim(),
      state: body.state.trim(),
      pincode: body.pincode.trim(),
      label: body.label?.trim() || null,
      lat: body.lat != null ? body.lat : null,
      lng: body.lng != null ? body.lng : null,
      isDefault: body.isDefault ?? false,
    };

    const created = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { customerId: profile.id },
          data: { isDefault: false },
        });
      }
      return tx.address.create({ data });
    });

    return json({ item: mapRow(created) });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
