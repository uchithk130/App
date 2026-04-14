"use client";

import { X, CheckCircle2 } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  message: string;
  ctaLabel: string;
  onCta: () => void;
  onClose?: () => void;
  variant?: "success" | "thanks";
};

export function PostDeliveryModal({ open, title, message, ctaLabel, onCta, onClose, variant = "success" }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" onClick={onClose ?? onCta}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm rounded-t-3xl bg-white px-6 pb-8 pt-6 shadow-2xl lg:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Handle bar */}
        <div className="mb-5 flex justify-center lg:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-300" />
        </div>

        {/* Icon */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className={`h-12 w-12 ${variant === "thanks" ? "text-emerald-500" : "text-emerald-600"}`} strokeWidth={1.5} />
        </div>

        <h2 className="mb-2 text-center text-xl font-bold text-slate-900">{title}</h2>
        <p className="mb-6 text-center text-sm text-slate-500">{message}</p>

        <button
          type="button"
          onClick={onCta}
          className="w-full rounded-full bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98]"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
