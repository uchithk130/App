import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  asChild?: boolean;
};

export function KcalPrimaryButton({ children, className = "", type = "button", ...props }: Props) {
  return (
    <button
      type={type}
      className={`w-full rounded-pill bg-kcal-sage py-4 text-center text-base font-bold text-white shadow-kcal transition hover:bg-kcal-sage-dark active:scale-[0.99] disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
