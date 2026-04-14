"use client";

export function MealHighlightBadges({
  richInProtein,
  richInFiber,
  richInLowCarb,
  compact,
}: {
  richInProtein: boolean;
  richInFiber: boolean;
  richInLowCarb: boolean;
  compact?: boolean;
}) {
  const pill =
    "rounded-full px-2 py-0.5 font-semibold " +
    (compact ? "text-[10px]" : "text-[11px]");
  return (
    <div className="flex flex-wrap gap-1.5">
      {richInProtein ? (
        <span className={`${pill} bg-emerald-100 text-emerald-900`}>Rich in protein</span>
      ) : null}
      {richInFiber ? (
        <span className={`${pill} bg-amber-100 text-amber-900`}>Rich in fiber</span>
      ) : null}
      {richInLowCarb ? (
        <span className={`${pill} bg-sky-100 text-sky-900`}>Low carb</span>
      ) : null}
    </div>
  );
}

export function MealRatingRow({ avg, count }: { avg: number | null; count: number }) {
  if (!count || avg == null) {
    return <span className="block text-xs text-kcal-muted whitespace-nowrap">No ratings yet</span>;
  }
  return (
    <div
      className="flex flex-wrap items-center gap-1.5 whitespace-nowrap"
      role="img"
      aria-label={`Rated ${avg} out of 5, ${count} reviews`}
    >
      <span className="text-amber-500" aria-hidden>
        ★
      </span>
      <span className="text-sm font-semibold text-kcal-charcoal">{avg.toFixed(1)}</span>
      <span className="text-xs text-kcal-muted">({count})</span>
    </div>
  );
}
