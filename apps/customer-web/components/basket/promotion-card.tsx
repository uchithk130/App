"use client";

import { Tag, Info, Check, Ban } from "lucide-react";

type Props = {
  id: string;
  title: string | null;
  code: string;
  discountLabel: string;
  description: string | null;
  displayBadge: string | null;
  applicable: boolean;
  inapplicableReason: string | null;
  selected: boolean;
  onSelect: () => void;
  onInfo: () => void;
};

export function PromotionCard({
  title,
  code,
  discountLabel,
  description,
  displayBadge,
  applicable,
  inapplicableReason,
  selected,
  onSelect,
  onInfo,
}: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl transition ring-1 ${
        selected
          ? "bg-emerald-50/50 ring-emerald-400 shadow-md shadow-emerald-100"
          : applicable
          ? "bg-white ring-slate-100 shadow-sm"
          : "bg-slate-50 ring-slate-100 opacity-70"
      }`}
    >
      {displayBadge && (
        <div className="bg-emerald-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          {displayBadge}
        </div>
      )}
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Icon */}
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            selected ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          <Tag className="h-5 w-5" strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-900">{title ?? discountLabel}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInfo();
              }}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-400 hover:text-slate-600"
              aria-label="Coupon details"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </div>
          {description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{description}</p>
          )}
          <p className="mt-1 font-mono text-xs text-slate-400">{code}</p>
          {!applicable && inapplicableReason && (
            <p className="mt-1 flex items-center gap-1 text-xs text-rose-500">
              <Ban className="h-3 w-3" /> {inapplicableReason}
            </p>
          )}
        </div>

        {/* Selection control */}
        <button
          type="button"
          onClick={onSelect}
          disabled={!applicable}
          className="mt-1 shrink-0 disabled:cursor-not-allowed"
          aria-label={selected ? "Remove coupon" : "Select coupon"}
        >
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
              selected
                ? "border-emerald-500 bg-emerald-500"
                : applicable
                ? "border-slate-300 bg-white"
                : "border-slate-200 bg-slate-100"
            }`}
          >
            {selected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
          </div>
        </button>
      </div>
    </div>
  );
}
