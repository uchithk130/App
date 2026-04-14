"use client";

import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function AuthPrimaryButton({ children, loading, className = "", disabled, ...rest }: Props) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={`flex w-full items-center justify-center rounded-pill bg-emerald-500 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
          Please wait…
        </span>
      ) : (
        children
      )}
    </button>
  );
}
