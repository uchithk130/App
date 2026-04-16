/**
 * Return the image URL as stored in the DB.
 * The S3 bucket is public so direct URLs work in the browser.
 */
export function customerMealImageUrl(_req: Request, stored: string | null | undefined): string | null {
  if (stored == null) return null;
  const url = String(stored).trim();
  return url || null;
}
