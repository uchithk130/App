import { Suspense } from "react";
import { SplashContent, SplashFallback } from "./splash-content";

export default function SplashPage() {
  return (
    <Suspense fallback={<SplashFallback />}>
      <SplashContent />
    </Suspense>
  );
}
