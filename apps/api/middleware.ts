import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function allowedOrigins() {
  return [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_ADMIN_URL,
    process.env.NEXT_PUBLIC_RIDER_URL,
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
  ].filter((x): x is string => Boolean(x));
}

export function middleware(req: NextRequest) {
  const origins = allowedOrigins();
  const origin = req.headers.get("origin") ?? "";
  const allowOrigin = origins.includes(origin) ? origin : origins[0] ?? "*";

  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  const res = NextResponse.next();
  headers.forEach((v, k) => res.headers.set(k, v));
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
