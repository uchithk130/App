"use client";

import * as React from "react";
import { Gift, MapPinned, Salad, Truck } from "lucide-react";

const box = "mx-auto flex h-[min(220px,38vh)] w-full max-w-[280px] items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-100/80 ring-1 ring-emerald-100";

/** Placeholder compositions — Lucide icons, easy to swap for assets later. */
export function SlideIllustrationNutrition({ className = "" }: { className?: string }) {
  return (
    <div className={`${box} ${className}`}>
      <Salad className="h-24 w-24 text-emerald-600" strokeWidth={1.25} aria-hidden />
    </div>
  );
}

export function SlideIllustrationDelivery({ className = "" }: { className?: string }) {
  return (
    <div className={`${box} ${className}`}>
      <Truck className="h-24 w-24 text-emerald-600" strokeWidth={1.25} aria-hidden />
    </div>
  );
}

export function SlideIllustrationJourney({ className = "" }: { className?: string }) {
  return (
    <div className={`${box} ${className}`}>
      <MapPinned className="h-24 w-24 text-emerald-600" strokeWidth={1.25} aria-hidden />
    </div>
  );
}

export function SlideIllustrationOffers({ className = "" }: { className?: string }) {
  return (
    <div className={`${box} ${className}`}>
      <Gift className="h-24 w-24 text-emerald-600" strokeWidth={1.25} aria-hidden />
    </div>
  );
}

const map: React.FC<{ className?: string }>[] = [
  SlideIllustrationNutrition,
  SlideIllustrationDelivery,
  SlideIllustrationJourney,
  SlideIllustrationOffers,
];

export function OnboardingSlideIllustration({ index, className }: { index: number; className?: string }) {
  const I = map[index] ?? SlideIllustrationNutrition;
  return <I className={className} />;
}
