"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WellnessOnboardingShell } from "./wellness-onboarding-shell";
import { WellnessMark } from "./wellness-mark";
import { getAccessToken } from "@/lib/auth-store";
import { getClientCookie, hasKcalGateOnClient, setCustomerLoggedInCookie } from "@/lib/kcal-gate-cookies";
import { FITMEALS_CUSTOMER_LOGGED_IN_COOKIE, KCAL_ONBOARDED_COOKIE } from "@/lib/kcal-gate-constants";
import {
  isCustomerOnboardingComplete,
  markCustomerOnboardingComplete,
  resetCustomerOnboardingForDev,
} from "@/lib/customer-onboarding-storage";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

function syncGateCookiesForHome() {
  if (typeof window === "undefined") return;
  if (isCustomerOnboardingComplete() && getClientCookie(KCAL_ONBOARDED_COOKIE) !== "1") {
    markCustomerOnboardingComplete();
  }
  if (getAccessToken() && getClientCookie(FITMEALS_CUSTOMER_LOGGED_IN_COOKIE) !== "1") {
    setCustomerLoggedInCookie();
  }
}

export function WellnessSplashScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const replayIntro = searchParams.get("replay") === "1";
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (process.env.NODE_ENV === "development" && searchParams.get("resetOnboarding") === "1") {
      resetCustomerOnboardingForDev();
    }
  }, [searchParams]);

  const goNext = React.useCallback(() => {
    if (typeof window === "undefined") return;
    if (replayIntro) {
      router.replace("/welcome?replay=1");
      return;
    }
    if (isCustomerOnboardingComplete()) {
      syncGateCookiesForHome();
      router.replace("/");
      return;
    }
    router.replace("/welcome");
  }, [replayIntro, router]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    if (!replayIntro && (getAccessToken() || hasKcalGateOnClient())) {
      syncGateCookiesForHome();
      router.replace("/");
      return;
    }

    const duration = 2600;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setProgress(t * 94);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const navTimer = window.setTimeout(goNext, duration);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(navTimer);
    };
  }, [goNext, replayIntro, router]);

  const continueNow = () => {
    goNext();
  };

  return (
    <WellnessOnboardingShell tone="gradient">
      <div className="flex min-h-dvh flex-col bg-gradient-to-b from-emerald-400 via-teal-500 to-emerald-700">
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8 pt-14">
          <WellnessMark className="h-28 w-28 drop-shadow-lg sm:h-32 sm:w-32" />
          <p className="mt-8 text-center text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl">
            FitMeals
          </p>
          <p className="mt-1 text-sm font-medium text-white/85">Version {APP_VERSION}</p>
          <p className="mt-10 max-w-xs text-center text-base leading-snug text-white/95">
            As nourishing as nature,
            <br />
            as steady as your routine.
          </p>
          <button
            type="button"
            onClick={continueNow}
            className="mt-10 rounded-pill border border-white/40 bg-white/15 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
          >
            Continue
          </button>
        </div>

        <div className="px-8 pb-10">
          <div className="mx-auto h-1 max-w-xs overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-4 text-center text-xs text-white/75">Loading your wellness experience…</p>
        </div>
      </div>
    </WellnessOnboardingShell>
  );
}

export function WellnessSplashFallback() {
  return (
    <WellnessOnboardingShell tone="gradient">
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-emerald-400 to-emerald-700 px-6">
        <WellnessMark className="h-24 w-24 animate-pulse opacity-90" />
        <p className="mt-6 text-sm font-medium text-white/85">Loading…</p>
      </div>
    </WellnessOnboardingShell>
  );
}
