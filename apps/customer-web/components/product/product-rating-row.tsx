"use client";

import Link from "next/link";
import { Star } from "lucide-react";

type Props = {
  avg: number | null;
  count: number;
  mealSlug?: string;
  showSeeAll?: boolean;
};

export function ProductRatingRow({ avg, count, mealSlug, showSeeAll = true }: Props) {
  if (!count || avg == null) {
    return <span className="block text-sm text-kcal-muted">No reviews yet</span>;
  }

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(avg));

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5" aria-label={`${avg.toFixed(1)} out of 5 stars`}>
        {stars.map((filled, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${filled ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-kcal-charcoal">{avg.toFixed(1)}</span>
      <span className="text-sm text-kcal-muted">({count} review{count !== 1 ? "s" : ""})</span>
      {showSeeAll && mealSlug && (
        <Link
          href={`/meals/${mealSlug}/reviews`}
          className="ml-auto text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition"
        >
          See all reviews
        </Link>
      )}
    </div>
  );
}
