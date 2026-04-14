import { publicUrlForKey } from "@/lib/integrations/s3";

/** Turn DB-stored image value into a browser-loadable URL (full URL, data URL, or S3 key → public base). */
export function resolveStoredImageUrl(stored: string | null | undefined): string | null {
  if (stored == null || !String(stored).trim()) return null;
  const u = String(stored).trim();
  if (/^https?:\/\//i.test(u) || u.startsWith("data:")) return u;
  return publicUrlForKey(u) ?? u;
}
