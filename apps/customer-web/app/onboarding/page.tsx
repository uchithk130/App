import { Suspense } from "react";
import { OnboardingContent, OnboardingFallback } from "./onboarding-content";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingFallback />}>
      <OnboardingContent />
    </Suspense>
  );
}
