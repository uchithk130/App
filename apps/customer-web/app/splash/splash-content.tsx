"use client";

import { WellnessSplashFallback, WellnessSplashScreen } from "@/components/onboarding/wellness-splash-screen";

export function SplashContent() {
  return <WellnessSplashScreen />;
}

export function SplashFallback() {
  return <WellnessSplashFallback />;
}
