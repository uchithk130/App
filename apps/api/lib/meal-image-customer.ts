import { resolveStoredImageUrl } from "@/lib/meal-image-url";

const MEALS_KEY_RE = /^meals\/[a-zA-Z0-9/_\-.]+$/;

/** S3 object key for paths stored as `meals/…` or full S3/CDN URL whose path starts with `meals/`. */
export function extractMealStorageKey(stored: string | null | undefined): string | null {
  if (stored == null) return null;
  const t = String(stored).trim();
  if (!t || t.includes("..")) return null;
  if (MEALS_KEY_RE.test(t)) return t;
  try {
    const u = new URL(t);
    const path = u.pathname.replace(/^\/+/, "");
    if (!path.startsWith("meals/") || !MEALS_KEY_RE.test(path)) return null;
    return path;
  } catch {
    return null;
  }
}

/**
 * URL the customer app can put in `<img src>`:
 * - data URIs pass through unchanged
 * - S3 / CDN URLs whose path contains `meals/…` are proxied via the public endpoint
 *   (handles private buckets where the direct URL would 403)
 * - other https URLs pass through unchanged
 * - raw `meals/…` keys are proxied
 */
export function customerMealImageUrl(req: Request, stored: string | null | undefined): string | null {
  if (stored == null || !String(stored).trim()) return null;
  const t = String(stored).trim();
  if (t.startsWith("data:")) return t;

  // Always try to extract a meals/ key first — even from full https URLs.
  // This ensures private-bucket S3 URLs get proxied instead of returning 403.
  const key = extractMealStorageKey(t);
  if (key) {
    const origin = new URL(req.url).origin;
    return `${origin}/api/v1/public/meal-images?key=${encodeURIComponent(key)}`;
  }

  // Non-S3 https URL (e.g. Unsplash mock, external CDN) — use directly
  if (/^https?:\/\//i.test(t)) return t;

  return resolveStoredImageUrl(t);
}
