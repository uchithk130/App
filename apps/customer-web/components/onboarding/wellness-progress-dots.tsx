"use client";

type Props = {
  total: number;
  active: number;
  className?: string;
};

/** Pill + dots — health palette (no coral primary). */
export function WellnessProgressDots({ total, active, className = "" }: Props) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`} role="tablist" aria-label="Onboarding step">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          role="tab"
          aria-selected={i === active}
          className={`h-2 rounded-full transition-all duration-300 ease-out ${
            i === active
              ? "w-8 bg-emerald-500 shadow-sm shadow-emerald-500/25"
              : "w-2 bg-emerald-200/90 dark:bg-emerald-900/50"
          }`}
        />
      ))}
    </div>
  );
}
