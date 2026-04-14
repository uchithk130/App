"use client";

import * as React from "react";
import { X, Tag, Calendar, FileText } from "lucide-react";

type CouponDetail = {
  id: string;
  code: string;
  title: string | null;
  description: string | null;
  discountLabel: string;
  freeShipping: boolean;
  percentOff: string | null;
  amountOff: string | null;
  maxDiscount: string | null;
  minOrderAmount: string | null;
  validFrom: string | null;
  expiresAt: string | null;
  firstOrderOnly: boolean;
  termsAndConditions: string | null;
};

type Props = {
  coupon: CouponDetail | null;
  onClose: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function PromoInfoSheet({ coupon, onClose }: Props) {
  if (!coupon) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative z-10 w-full max-w-lg rounded-t-3xl bg-white px-5 pb-8 pt-4 shadow-2xl lg:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="mb-3 flex justify-center lg:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-300" />
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
          <Tag className="h-8 w-8 text-emerald-600" />
        </div>

        {/* Title */}
        <h2 className="text-center text-lg font-bold text-slate-900">
          {coupon.title ?? coupon.discountLabel}
        </h2>
        {coupon.description && (
          <p className="mt-1 text-center text-sm text-slate-500">{coupon.description}</p>
        )}

        {/* Details grid */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <Tag className="h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <p className="text-xs text-slate-500">Promo Code</p>
              <p className="font-mono text-sm font-bold text-slate-900">{coupon.code}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <Tag className="h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <p className="text-xs text-slate-500">Discount</p>
              <p className="text-sm font-semibold text-slate-900">{coupon.discountLabel}</p>
            </div>
          </div>

          {coupon.maxDiscount && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <Tag className="h-4 w-4 shrink-0 text-amber-500" />
              <div>
                <p className="text-xs text-slate-500">Max Discount</p>
                <p className="text-sm font-semibold text-slate-900">?{coupon.maxDiscount}</p>
              </div>
            </div>
          )}

          {coupon.minOrderAmount && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <FileText className="h-4 w-4 shrink-0 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Minimum Order</p>
                <p className="text-sm font-semibold text-slate-900">?{coupon.minOrderAmount}</p>
              </div>
            </div>
          )}

          {(coupon.validFrom || coupon.expiresAt) && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <Calendar className="h-4 w-4 shrink-0 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Duration</p>
                <p className="text-sm font-semibold text-slate-900">
                  {coupon.validFrom ? formatDate(coupon.validFrom) : "Now"}
                  {" - "}
                  {coupon.expiresAt ? formatDate(coupon.expiresAt) : "No expiry"}
                </p>
              </div>
            </div>
          )}

          {coupon.firstOrderOnly && (
            <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700">
              ? First order only
            </p>
          )}

          {coupon.freeShipping && (
            <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-700">
              ?? Includes free shipping
            </p>
          )}
        </div>

        {/* Terms */}
        {coupon.termsAndConditions && (
          <div className="mt-5">
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Terms & Conditions</h3>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-500">
              {coupon.termsAndConditions}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
