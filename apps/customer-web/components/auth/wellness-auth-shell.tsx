"use client";

import * as React from "react";
import { WellnessOnboardingShell } from "@/components/onboarding/wellness-onboarding-shell";
import { WellnessMark } from "@/components/onboarding/wellness-mark";

type Props = {
  children: React.ReactNode;
  /** Optional line under the mark on desktop split panel */
  asideCaption?: string;
};

/**
 * Split layout matching onboarding: brand / illustration column + form column.
 * On small screens the form column includes a compact mark for continuity.
 */
export function WellnessAuthShell({ children, asideCaption }: Props) {
  const splitVisual = (
    <div className="flex flex-col items-center gap-5 text-center">
      <WellnessMark className="h-36 w-36 drop-shadow-md lg:h-44 lg:w-44" />
      <p className="max-w-[280px] text-sm font-medium leading-relaxed text-emerald-900/90">
        {asideCaption ??
          "Your wellness journey continues here — calm, clear, and built for everyday nutrition."}
      </p>
    </div>
  );

  return (
    <WellnessOnboardingShell tone="split" splitVisual={splitVisual}>
      <div className="flex min-h-dvh flex-col px-6 pb-10 pt-8 lg:min-h-0 lg:justify-center lg:px-12 lg:pb-12 lg:pt-10">
        <div className="mb-8 flex justify-center lg:hidden">
          <WellnessMark className="h-20 w-20 drop-shadow-sm" />
        </div>
        {children}
      </div>
    </WellnessOnboardingShell>
  );
}
