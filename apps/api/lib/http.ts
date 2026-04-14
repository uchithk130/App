import { NextResponse } from "next/server";

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorJson(message: string, status: number, code?: string, details?: unknown) {
  return NextResponse.json({ error: message, code, details }, { status });
}
