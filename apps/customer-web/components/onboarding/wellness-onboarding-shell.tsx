"use client";

import * as React from "react";

type Tone = "gradient" | "light" | "split";

type Props = {
  children: React.ReactNode;
  /** gradient: full-bleed wellness splash; light: soft off-white; split: two-column on large screens */
  tone: Tone;
  /** Left / top visual column on `split` (desktop). */
  splitVisual?: React.ReactNode;
  className?: string;
};

/**
 * Responsive shell: mobile feels full-screen and app-like; desktop uses a premium framed or split layout.
 */
export function WellnessOnboardingShell({ children, tone, splitVisual, className = "" }: Props) {
  if (tone === "split" && splitVisual) {
    return (
      <div
        className={`min-h-dvh bg-[hsl(140,25%,97%)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-white to-slate-50 ${className}`}
      >
        <div className="mx-auto flex min-h-dvh max-w-6xl flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-stretch lg:gap-0 lg:p-6 xl:p-10">
          <div className="relative hidden min-h-[280px] flex-col justify-center overflow-hidden rounded-[2rem] border border-emerald-100/80 bg-gradient-to-br from-emerald-100/90 via-teal-50 to-white p-10 shadow-sm lg:flex">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.12),transparent_55%)]" />
            <div className="relative flex h-full min-h-[320px] items-center justify-center">{splitVisual}</div>
          </div>
          <div className="flex min-h-dvh flex-1 flex-col bg-white lg:min-h-0 lg:rounded-[2rem] lg:border lg:border-slate-100 lg:shadow-xl">
            {children}
          </div>
        </div>
      </div>
    );
  }

  if (tone === "gradient") {
    return (
      <div
        className={`min-h-dvh bg-neutral-100 max-lg:flex max-lg:justify-center max-lg:px-0 lg:flex lg:items-center lg:justify-center lg:bg-gradient-to-br lg:from-emerald-50 lg:via-teal-50/80 lg:to-slate-100 lg:p-8 ${className}`}
      >
        <div
          className={`relative min-h-dvh w-full max-lg:max-w-kcal max-lg:overflow-x-hidden max-lg:rounded-[2.25rem] max-lg:shadow-2xl max-lg:ring-1 max-lg:ring-black/10 lg:min-h-[640px] lg:max-w-lg lg:overflow-hidden lg:rounded-[2.25rem] lg:shadow-2xl lg:ring-1 lg:ring-emerald-900/10`}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-dvh bg-neutral-100 max-lg:flex max-lg:justify-center max-lg:px-0 lg:flex lg:items-center lg:justify-center lg:bg-gradient-to-br lg:from-emerald-50/90 lg:via-white lg:to-slate-50 lg:p-8 ${className}`}
    >
      <div className="relative min-h-dvh w-full max-lg:max-w-kcal max-lg:overflow-x-hidden max-lg:rounded-[2.25rem] max-lg:shadow-2xl max-lg:ring-1 max-lg:ring-black/10 lg:min-h-[min(90dvh,880px)] lg:max-w-5xl lg:overflow-hidden lg:rounded-[2.5rem] lg:shadow-xl lg:ring-1 lg:ring-slate-200/80">
        {children}
      </div>
    </div>
  );
}
