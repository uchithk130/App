import { GetObjectCommand } from "@aws-sdk/client-s3";
import { errorJson } from "@/lib/http";
import { getS3Client } from "@/lib/integrations/s3";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const KEY_RE = /^meals\/[a-zA-Z0-9/_\-.]+$/;

/** Public read for menu photos (keys under `meals/` only). No auth — same pattern as CDN edge for catalog images. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key")?.trim() ?? "";
    if (!KEY_RE.test(key)) return errorJson("Invalid key", 400);

    const e = env();
    const bucket = e.S3_BUCKET_NAME;
    const client = getS3Client();
    if (!client || !bucket) return errorJson("Image unavailable", 503);

    const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const body = out.Body;
    if (!body) return errorJson("Not found", 404);

    const buf = await body.transformToByteArray();
    const ct = out.ContentType ?? "application/octet-stream";

    return new Response(Buffer.from(buf), {
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return errorJson("Server error", 500);
  }
}
