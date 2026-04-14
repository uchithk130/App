import { z } from "zod";

export const cursorQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CursorPage<T> = { items: T[]; nextCursor: string | null };

export function encodeCursor(id: string) {
  return Buffer.from(id, "utf8").toString("base64url");
}

export function decodeCursor(raw: string): string | null {
  try {
    const id = Buffer.from(raw, "base64url").toString("utf8");
    return id || null;
  } catch {
    return null;
  }
}
