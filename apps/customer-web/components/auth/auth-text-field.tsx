"use client";

import * as React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
};

export const AuthTextField = React.forwardRef<HTMLInputElement, Props>(function AuthTextField(
  { id, label, error, className = "", ...rest },
  ref,
) {
  const errId = `${id}-error`;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        className={`w-full rounded-2xl border bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 disabled:cursor-not-allowed disabled:bg-slate-50 ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200"} ${className}`}
        {...rest}
      />
      {error ? (
        <p id={errId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});
