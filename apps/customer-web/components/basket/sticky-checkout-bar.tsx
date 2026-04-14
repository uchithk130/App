"use client";

import { formatInr } from "@fitmeals/utils";

type Props = {
  total: number;
  onPlaceOrder: () => void;
  isPending?: boolean;
};

export function StickyCheckoutBar({ total, onPlaceOrder, isPending }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:sticky lg:bottom-0">
      <div className="mx-auto max-w-kcal lg:max-w-none">
        <div
          className="mx-3 mb-3 flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-3.5 shadow-[0_-4px_30px_-4px_rgba(0,0,0,0.12)] ring-1 ring-slate-100/80 lg:mx-0 lg:mb-0 lg:rounded-xl lg:shadow-lg"
          style={{ paddingBottom: "max(0.875rem, env(safe-area-inset-bottom, 0px))" }}
        >
          <div>
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-lg font-extrabold text-slate-900">{formatInr(total)}</p>
          </div>
          <button
            type="button"
            onClick={onPlaceOrder}
            disabled={isPending}
            className="rounded-full bg-emerald-600 px-7 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60"
            data-testid="place-order-btn"
          >
            {isPending ? "Placing\u2026" : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
