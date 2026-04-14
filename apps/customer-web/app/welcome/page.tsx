import { Suspense } from "react";
import { WellnessWelcomeScreen } from "@/components/onboarding/wellness-welcome-screen";
import { WellnessOnboardingFallback } from "@/components/onboarding/wellness-onboarding-flow";

export default function WelcomePage() {
  return (
    <Suspense fallback={<WellnessOnboardingFallback />}>
      <WellnessWelcomeScreen />
    </Suspense>
  );
}
