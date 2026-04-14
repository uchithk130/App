"use client";

import { Star, User } from "lucide-react";

type Props = {
  reviewerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export function ReviewCard({ reviewerName, rating, comment, createdAt }: Props) {
  const stars = Array.from({ length: 5 }, (_, i) => i < rating);
  const date = new Date(createdAt);
  const formatted = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const initials = reviewerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex gap-3 py-4">
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
        {initials || <User className="h-5 w-5" />}
      </div>

      <div className="min-w-0 flex-1">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-kcal-charcoal">{reviewerName}</span>
          <span className="shrink-0 text-xs text-kcal-muted">{formatted}</span>
        </div>

        {/* Stars */}
        <div className="mt-0.5 flex gap-0.5">
          {stars.map((filled, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${filled ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
            />
          ))}
        </div>

        {/* Comment */}
        {comment && (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{comment}</p>
        )}
      </div>
    </div>
  );
}
