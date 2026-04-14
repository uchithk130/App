import { env } from "../env";

export function refreshMaxAgeSeconds() {
  const v = env().JWT_REFRESH_EXPIRES_IN;
  const d = /^(\d+)d$/.exec(v);
  if (d) return Number.parseInt(d[1]!, 10) * 86400;
  const h = /^(\d+)h$/.exec(v);
  if (h) return Number.parseInt(h[1]!, 10) * 3600;
  const m = /^(\d+)m$/.exec(v);
  if (m) return Number.parseInt(m[1]!, 10) * 60;
  return 7 * 86400;
}

export function refreshExpiresAt() {
  return new Date(Date.now() + refreshMaxAgeSeconds() * 1000);
}
