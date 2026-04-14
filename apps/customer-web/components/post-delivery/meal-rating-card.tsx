"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { StarRatingSelector } from "./star-rating-selector";

type Props = {
  mealId: string;
  mealName: string;
  coverUrl: string | null;
  rating: number;
  comment: string;
  onRatingChange: (r: number) => void;
  onCommentChange: (c: string) => void;
};

export function MealRatingCard({ mealName, coverUrl, rating, comment, onRatingChange, onCommentChange }: Props) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">No img</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-sm font-bold text-slate-900">{mealName}</p>
          <StarRatingSelector value={rating} onChange={onRatingChange} size="sm" />
        </div>
      </div>

      {rating > 0 && (
        <textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder={rating <= 2 ? "What could be improved?" : "Share your thoughts (optional)"}
          rows={2}
          className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
        />
      )}
    </div>
  );
}
