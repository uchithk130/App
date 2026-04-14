import { apiErrorSchema } from "@fitmeals/types";

export type ApiClientConfig = {
  baseUrl: string;
  credentials?: RequestCredentials;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { config: ApiClientConfig; parseJson?: true }
): Promise<T>;
export async function apiFetch(
  path: string,
  init: RequestInit & { config: ApiClientConfig; parseJson: false }
): Promise<Response>;
export async function apiFetch<T>(
  path: string,
  init: RequestInit & { config: ApiClientConfig; parseJson?: boolean }
): Promise<T | Response> {
  const { config, parseJson = true, ...rest } = init;
  const url = `${config.baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...rest,
    credentials: config.credentials ?? "include",
    headers: {
      "Content-Type": "application/json",
      ...(rest.headers ?? {}),
    },
  });
  if (!parseJson) return res;
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
    const parsed = apiErrorSchema.safeParse(body);
    const msg = parsed.success ? parsed.data.error : `Request failed (${res.status})`;
    const code = parsed.success ? parsed.data.code : undefined;
    const details = parsed.success ? parsed.data.details : body;
    throw new ApiError(msg, res.status, code, details);
  }
  return body as T;
}
