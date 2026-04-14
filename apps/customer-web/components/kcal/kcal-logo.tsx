import * as React from "react";

export function KcalLogo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <span
      className={`font-kcal text-3xl font-bold tracking-tight ${light ? "text-white" : "text-kcal-sage"} ${className}`}
      aria-label="kcal"
    >
      kcal
    </span>
  );
}
