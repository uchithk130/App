"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { WellnessOnboardingShell } from "./wellness-onboarding-shell";
import { WellnessMark } from "./wellness-mark";
import { getAccessToken } from "@/lib/auth-store";
import { getClientCookie } from "@/lib/kcal-gate-cookies";
import { FITMEALS_CUSTOMER_LOGGED_IN_COOKIE } from "@/lib/kcal-gate-constants";

export function WellnessWelcomeScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const replayIntro = searchParams.get("replay") === "1";

  React.useEffect(() => {
    if (typeof window === "undefined" || replayIntro) return;
    if (getAccessToken() || getClientCookie(FITMEALS_CUSTOMER_LOGGED_IN_COOKIE) === "1") {
      router.replace("/");
    }
  }, [replayIntro, router]);

  const q = replayIntro ? "?replay=1" : "";

  return (
    <WellnessOnboardingShell tone="light">
      <div className="relative flex min-h-dvh flex-col lg:min-h-[min(90dvh,880px)]">
        {/* Hero — premium health photography placeholder (gradient + texture); swap `bg-*` or add Image later */}
        <div className="relative min-h-[48vh] shrink-0 overflow-hidden bg-gradient-to-br from-emerald-300/95 via-teal-200/90 to-emerald-100 lg:min-h-[320px] lg:rounded-b-[2.5rem]">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2248%22%20height=%2248%22%3E%3Cpath%20d=%22M0%2048h48V0H0z%22%20fill=%22none%22/%3E%3Ccircle%20cx=%2212%22%20cy=%2212%22%20r=%222%22%20fill=%22rgba(255,255,255,0.15)%22/%3E%3C/svg%3E')] opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/50 via-emerald-900/10 to-transparent" />
          <div className="relative flex h-full min-h-[280px] items-center justify-center px-6 pt-10 lg:min-h-[320px]">
            <WellnessMark className="h-28 w-28 drop-shadow-lg lg:h-36 lg:w-36" />
          </div>
          {/* Intro copy over hero (reference: lower-third scrim) */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-6 pb-10 pt-20">
            <p className="text-center text-base font-medium text-white/95">Welcome to</p>
            <h1 className="mt-1 text-center text-3xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-4xl">
              FitMeals
            </h1>
          </div>
        </div>

        <div className="flex flex-1 flex-col bg-[hsl(140,30%,99%)] px-6 pb-10 pt-8 lg:px-14 lg:pb-12 lg:pt-10">
          <p className="mx-auto max-w-md text-center text-sm leading-relaxed text-slate-600 lg:text-base">
            Premium nutrition, calibrated for your goals — calm, clear, and built for everyday wellness.
          </p>

          <div className="mt-auto flex flex-col gap-4 pt-10 lg:pt-12">
            <button
              type="button"
              className="w-full rounded-pill bg-emerald-500 px-6 py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600"
              onClick={() => router.push(`/onboarding${q}`)}
            >
              Continue
            </button>
            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-emerald-700 underline-offset-4 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </WellnessOnboardingShell>
  );
}
