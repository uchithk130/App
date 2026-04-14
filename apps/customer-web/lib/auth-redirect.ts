/** Avoid open redirects — only allow same-origin relative paths. */
export function safeAuthRedirect(url: string | null): string {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return "/";
  return url;
}
