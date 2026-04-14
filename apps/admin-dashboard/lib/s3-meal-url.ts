/** Object keys we store under `meals/…` in S3 (must match API upload/read validation). */
export const MEALS_KEY_RE = /^meals\/[a-zA-Z0-9/_\-.]+$/;

/** Returns S3 object key: raw `meals/…` stored in DB, or path from a full URL (S3 / CDN). */
export function extractMealsKeyFromUrl(url: string): string | null {
  const t = url.trim();
  if (t && !t.includes("..") && MEALS_KEY_RE.test(t)) return t;
  try {
    const u = new URL(t);
    const path = u.pathname.replace(/^\/+/, "");
    if (!path.startsWith("meals/")) return null;
    if (path.includes("..") || !MEALS_KEY_RE.test(path)) return null;
    return path;
  } catch {
    return null;
  }
}
