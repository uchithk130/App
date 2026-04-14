import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  FITMEALS_CUSTOMER_LOGGED_IN_COOKIE,
  KCAL_ONBOARDED_COOKIE,
} from "./lib/kcal-gate-constants";

const PUBLIC_PATHS = new Set([
  "/splash",
  "/welcome",
  "/onboarding",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/login/") || pathname.startsWith("/register/")) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/images/")) {
    return NextResponse.next();
  }
  if (pathname === "/favicon.ico") return NextResponse.next();
  if (/\.(ico|png|jpg|jpeg|svg|webp|gif|txt|xml)$/i.test(pathname)) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const onboarded = request.cookies.get(KCAL_ONBOARDED_COOKIE)?.value === "1";
  const loggedIn = request.cookies.get(FITMEALS_CUSTOMER_LOGGED_IN_COOKIE)?.value === "1";

  if (onboarded || loggedIn) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/splash";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
