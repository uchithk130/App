"use client";

import { Minus, Plus } from "lucide-react";
import { formatInr } from "@fitmeals/utils";

type Props = {
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
  totalPrice: number;
  onAddToCart: () => void;
  isPending?: boolean;
  minQty?: number;
  maxQty?: number;
};

export function StickyAddToCart({
  quantity,
  onDecrement,
  onIncrement,
  totalPrice,
  onAddToCart,
  isPending,
  minQty = 1,
  maxQty = 50,
}: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:sticky lg:bottom-0">
      <div className="mx-auto max-w-kcal lg:max-w-none">
        <div
          className="mx-3 mb-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_-4px_30px_-4px_rgba(0,0,0,0.12)] ring-1 ring-slate-100/80 lg:mx-0 lg:mb-0 lg:rounded-xl lg:shadow-lg"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
        >
          {/* Quantity stepper */}
          <div className="flex items-center gap-0 rounded-full bg-[#f0f7ef] ring-1 ring-emerald-100">
            <button
              type="button"
              onClick={onDecrement}
              disabled={isPending || quantity <= minQty}
              className="flex h-10 w-10 items-center justify-center rounded-full text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <span className="min-w-[2rem] text-center text-sm font-bold tabular-nums text-kcal-charcoal">
              {quantity}
            </span>
            <button
              type="button"
              onClick={onIncrement}
              disabled={isPending || quantity >= maxQty}
              className="flex h-10 w-10 items-center justify-center rounded-full text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>

          {/* Add to basket button */}
          <button
            type="button"
            onClick={onAddToCart}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60"
            data-testid="add-to-cart"
          >
            <span>{isPending ? "Adding\u2026" : "Add to basket"}</span>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">
              {formatInr(totalPrice)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
