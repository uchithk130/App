"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { formatInr } from "@fitmeals/utils";

type Props = {
  id: string;
  name: string;
  slug: string;
  unitPrice: string;
  compareAtPrice?: string | null;
  coverUrl?: string | null;
  quantity: number;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
  disabled?: boolean;
};

export function BasketItemCard({
  name,
  unitPrice,
  compareAtPrice,
  coverUrl,
  quantity,
  onQtyChange,
  onRemove,
  disabled,
}: Props) {
  const hasDiscount = compareAtPrice && Number(compareAtPrice) > Number(unitPrice);
  const lineTotal = Number(unitPrice) * quantity;

  return (
    <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
      {/* Thumbnail */}
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-300">No img</div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="truncate text-sm font-semibold text-slate-900">{name}</h3>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">{formatInr(compareAtPrice)}</span>
            )}
            <span className="text-sm font-bold text-slate-900">{formatInr(unitPrice)}</span>
          </div>
        </div>

        {/* Qty stepper + remove */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-0 rounded-full bg-[#f0f7ef] ring-1 ring-emerald-100">
            <button
              type="button"
              disabled={disabled || quantity <= 1}
              onClick={() => onQtyChange(Math.max(1, quantity - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40"
              aria-label="Decrease"
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
            <span className="min-w-[1.5rem] text-center text-xs font-bold tabular-nums text-slate-900">
              {quantity}
            </span>
            <button
              type="button"
              disabled={disabled || quantity >= 50}
              onClick={() => onQtyChange(Math.min(50, quantity + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40"
              aria-label="Increase"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{formatInr(lineTotal)}</span>
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
