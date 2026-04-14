"use client";

import * as React from "react";
import { Star } from "lucide-react";

type Props = {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
};

const sizes = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-10 w-10" };

export function StarRatingSelector({ value, onChange, size = "lg", disabled }: Props) {
  const cls = sizes[size];
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onChange(s)}
          className="rounded-full p-0.5 transition hover:scale-110 active:scale-95 disabled:pointer-events-none"
          aria-label={`${s} star${s > 1 ? "s" : ""}`}
        >
          <Star
            className={`${cls} transition ${
              s <= value
                ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                : "fill-slate-200 text-slate-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
