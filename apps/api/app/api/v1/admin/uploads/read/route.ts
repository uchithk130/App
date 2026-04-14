import { GetObjectCommand } from "@aws-sdk/client-s3";
import { errorJson } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import { getS3Client } from "@/lib/integrations/s3";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const KEY_RE = /^meals\/[a-zA-Z0-9/_\-.]+$/;

/** Authenticated image bytes for admin preview (private buckets). Query: `key=meals/...` */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const url = new URL(req.url);
    const key = url.searchParams.get("key")?.trim() ?? "";
    if (!KEY_RE.test(key)) return errorJson("Invalid key", 400);

    const e = env();
    const bucket = e.S3_BUCKET_NAME;
    const client = getS3Client();
    if (!client || !bucket) return errorJson("S3 not configured", 503);

    const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const body = out.Body;
    if (!body) return errorJson("Not found", 404);

    const buf = await body.transformToByteArray();
    const ct = out.ContentType ?? "application/octet-stream";

    return new Response(Buffer.from(buf), {
      headers: {
        "Content-Type": ct,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
