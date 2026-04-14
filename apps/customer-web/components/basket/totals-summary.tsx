"use client";

import { formatInr } from "@fitmeals/utils";

type Props = {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode?: string | null;
};

export function TotalsSummary({ subtotal, deliveryFee, discount, total, couponCode }: Props) {
  return (
    <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex justify-between text-sm text-slate-600">
        <span>Subtotal</span>
        <span>{formatInr(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm text-slate-600">
        <span>Delivery fee</span>
        <span>{deliveryFee === 0 ? "Free" : formatInr(deliveryFee)}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-sm text-emerald-600">
          <span>Discount{couponCode ? ` (${couponCode})` : ""}</span>
          <span>?{formatInr(discount)}</span>
        </div>
      )}
      <hr className="border-slate-100" />
      <div className="flex justify-between text-base font-bold text-slate-900">
        <span>Total</span>
        <span>{formatInr(total)}</span>
      </div>
    </div>
  );
}
