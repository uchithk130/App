"use client";

import { WellnessOnboardingFallback, WellnessOnboardingFlow } from "@/components/onboarding/wellness-onboarding-flow";

export function OnboardingContent() {
  return <WellnessOnboardingFlow />;
}

export function OnboardingFallback() {
  return <WellnessOnboardingFallback />;
}
