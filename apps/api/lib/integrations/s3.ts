import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../env";

/** Upload from API (avoids browser CORS on presigned PUT). */
export async function putMealImageObject(key: string, contentType: string, body: Buffer) {
  const e = env();
  const bucket = e.S3_BUCKET_NAME;
  const client = getS3Client();
  if (!client || !bucket) return false;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return true;
}

export function getS3Client() {
  try {
    const e = env();
    if (!e.AWS_ACCESS_KEY_ID || !e.AWS_SECRET_ACCESS_KEY || !e.AWS_REGION) return null;
    return new S3Client({
      region: e.AWS_REGION,
      credentials: {
        accessKeyId: e.AWS_ACCESS_KEY_ID,
        secretAccessKey: e.AWS_SECRET_ACCESS_KEY,
      },
    });
  } catch {
    return null;
  }
}

export async function presignMealImageUpload(key: string, contentType: string, expiresIn = 900) {
  const e = env();
  const bucket = e.S3_BUCKET_NAME;
  const client = getS3Client();
  if (!client || !bucket) return null;
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, cmd, { expiresIn });
}

export async function deleteObjectKey(key: string) {
  const e = env();
  const bucket = e.S3_BUCKET_NAME;
  const client = getS3Client();
  if (!client || !bucket) return false;
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  return true;
}

/**
 * Public URL for an object key. Prefer `S3_PUBLIC_BASE_URL` (CDN / path-style / MinIO).
 * If unset, falls back to the standard virtual-hosted S3 URL when bucket + region are set.
 */
export function publicUrlForKey(key: string): string | null {
  const base = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (base) return `${base}/${key}`;

  const bucket = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  if (bucket && region) {
    const path = key
      .split("/")
      .map((seg) => encodeURIComponent(seg))
      .join("/");
    return `https://${bucket}.s3.${region}.amazonaws.com/${path}`;
  }
  return null;
}
