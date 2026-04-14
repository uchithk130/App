"use client";

import { Star } from "lucide-react";

type Props = {
  averageRating: number | null;
  totalCount: number;
  distribution: Record<number, number>;
};

export function ReviewSummary({ averageRating, totalCount, distribution }: Props) {
  const stars = averageRating != null ? Array.from({ length: 5 }, (_, i) => i < Math.round(averageRating)) : [];

  return (
    <div className="flex items-start gap-6">
      {/* Left: Average */}
      <div className="flex flex-col items-center">
        <span className="text-4xl font-extrabold text-kcal-charcoal">
          {averageRating != null ? averageRating.toFixed(1) : "--"}
        </span>
        <div className="mt-1 flex gap-0.5">
          {stars.map((filled, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${filled ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
            />
          ))}
        </div>
        <span className="mt-1 text-xs text-kcal-muted">
          {totalCount} review{totalCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Right: Distribution bars */}
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star] ?? 0;
          const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="w-3 text-right text-xs font-semibold text-kcal-charcoal">{star}</span>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-right text-[11px] text-kcal-muted">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
