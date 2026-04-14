"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { WellnessOnboardingShell } from "./wellness-onboarding-shell";
import { WellnessProgressDots } from "./wellness-progress-dots";
import { OnboardingSlideIllustration } from "./slide-illustrations";
import { WellnessMark } from "./wellness-mark";
import { ONBOARDING_SLIDES } from "@/lib/onboarding-content-data";
import { getAccessToken } from "@/lib/auth-store";
import { getClientCookie } from "@/lib/kcal-gate-cookies";
import { FITMEALS_CUSTOMER_LOGGED_IN_COOKIE } from "@/lib/kcal-gate-constants";
import { markCustomerOnboardingComplete } from "@/lib/customer-onboarding-storage";

type Phase = "slides" | "auth";

export function WellnessOnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const replayIntro = searchParams.get("replay") === "1";

  const [phase, setPhase] = React.useState<Phase>("slides");
  const [slide, setSlide] = React.useState(0);

  React.useEffect(() => {
    if (typeof window === "undefined" || replayIntro) return;
    if (getAccessToken() || getClientCookie(FITMEALS_CUSTOMER_LOGGED_IN_COOKIE) === "1") {
      router.replace("/");
    }
  }, [replayIntro, router]);

  const total = ONBOARDING_SLIDES.length;
  const current = ONBOARDING_SLIDES[slide]!;

  const goAuth = React.useCallback(() => setPhase("auth"), []);

  const next = () => {
    if (phase !== "slides") return;
    if (slide < total - 1) {
      setSlide((s) => s + 1);
      return;
    }
    goAuth();
  };

  const skip = () => goAuth();

  const finishToHome = () => {
    markCustomerOnboardingComplete();
    router.push("/");
  };

  const splitVisual =
    phase === "auth" ? (
      <div className="flex flex-col items-center gap-4">
        <WellnessMark className="h-40 w-40 opacity-95 drop-shadow-md lg:h-48 lg:w-48" />
        <p className="max-w-xs text-center text-sm font-medium text-emerald-900/90">
          Your calm, confident path to better nutrition starts here.
        </p>
      </div>
    ) : (
      <div key={slide} className="wellness-fade-in flex justify-center">
        <OnboardingSlideIllustration index={slide} />
      </div>
    );

  const slideBody = (
    <div className="flex min-h-0 flex-1 flex-col px-6 pb-8 pt-10 lg:px-12 lg:pb-12 lg:pt-12">
      {phase === "slides" ? (
        <>
          <div key={slide} className="wellness-fade-in flex flex-1 flex-col items-center lg:block lg:flex-initial">
            <div className="mb-6 flex w-full justify-center lg:hidden">
              <OnboardingSlideIllustration index={slide} />
            </div>
            <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 lg:text-left lg:text-3xl">
              {current.title}
            </h2>
            <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-slate-600 lg:text-left lg:text-base">
              {current.subtitle}
            </p>
          </div>

          <div className="mt-8 flex justify-center lg:mt-10">
            <WellnessProgressDots total={total} active={slide} />
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-10 lg:pt-12">
            <button
              type="button"
              className="w-full rounded-pill bg-emerald-500 px-6 py-3.5 text-center text-base font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600"
              onClick={next}
            >
              Next
            </button>
            <button
              type="button"
              className="w-full py-2 text-center text-sm font-medium text-slate-500 transition hover:text-slate-700"
              onClick={skip}
            >
              Skip
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-6 flex justify-center lg:hidden">
            <WellnessMark className="h-24 w-24 drop-shadow-sm" />
          </div>
          <div className="flex flex-1 flex-col items-center justify-center lg:items-start">
            <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 lg:text-left lg:text-3xl">
              You&apos;re set
            </h2>
            <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-slate-600 lg:text-left lg:text-base">
              Sign in to sync meals and subscriptions, or start exploring the menu right away.
            </p>
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-8 lg:pt-10">
            <button
              type="button"
              className="w-full rounded-pill bg-emerald-500 px-6 py-3.5 text-center text-base font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600"
              onClick={finishToHome}
            >
              Start healthy
            </button>
            <Link
              href="/login"
              className="w-full rounded-pill border border-slate-200 bg-white py-3.5 text-center text-base font-semibold text-emerald-800 shadow-sm transition hover:bg-slate-50"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="w-full py-2 text-center text-sm font-semibold text-slate-600 underline-offset-4 hover:text-emerald-800 hover:underline"
            >
              Create an account
            </Link>
          </div>
        </>
      )}
    </div>
  );

  return (
    <WellnessOnboardingShell tone="split" splitVisual={splitVisual}>
      {slideBody}
    </WellnessOnboardingShell>
  );
}

export function WellnessOnboardingFallback() {
  return (
    <WellnessOnboardingShell tone="light">
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
        <p className="mt-4 text-sm text-slate-500">Loading…</p>
      </div>
    </WellnessOnboardingShell>
  );
}
