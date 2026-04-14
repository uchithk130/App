import { z } from "zod";
import { apiFetch, type ApiClientConfig } from "./client";

const meSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    roles: z.array(z.enum(["CUSTOMER", "ADMIN", "RIDER"])),
  }),
});

export type MeResponse = z.infer<typeof meSchema>;

export async function fetchMe(config: ApiClientConfig) {
  const data = await apiFetch<unknown>("/api/v1/auth/me", { method: "GET", config });
  return meSchema.parse(data);
}

export async function loginRequest(
  config: ApiClientConfig,
  body: { email: string; password: string; app: "customer" | "admin" | "rider" }
) {
  return apiFetch<{ accessToken: string; expiresIn: number }>("/api/v1/auth/login", {
    method: "POST",
    config,
    body: JSON.stringify(body),
  });
}

export async function logoutRequest(config: ApiClientConfig) {
  return apiFetch<{ ok: boolean }>("/api/v1/auth/logout", { method: "POST", config });
}

export async function refreshRequest(config: ApiClientConfig, refreshToken?: string) {
  return apiFetch<{ accessToken: string; expiresIn: number }>("/api/v1/auth/refresh", {
    method: "POST",
    config,
    body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
  });
}
