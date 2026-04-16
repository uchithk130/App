import { API_BASE } from "./config";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./auth-store";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  const token = typeof window !== "undefined" ? getAccessToken() : null;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if ((res.status === 401 || res.status === 403) && typeof window !== "undefined") {
    const refresh = getRefreshToken();
    if (refresh) {
      const r = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh, app: "customer" }),
      });
      if (r.ok) {
        const j = (await r.json()) as { accessToken: string };
        setTokens(j.accessToken, refresh);
        headers.set("Authorization", `Bearer ${j.accessToken}`);
        const retry = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: "include" });
        if (retry.ok) return (await retry.json()) as T;
        res = retry;
      } else {
        clearTokens();
      }
    } else {
      clearTokens();
    }
  }

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = { error: text };
    }
  }
  if (!res.ok) {
    const err = body as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return body as T;
}
