"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/auth-store";
import { api } from "@/lib/api";

type Props = {
  title: string;
  subtitle?: string;
  /** When set, shows a back control (e.g. meal detail -> meals list). */
  backHref?: string;
};

export function KcalTopBar({ title, subtitle, backHref }: Props) {
  const [authed, setAuthed] = React.useState(false);
  React.useEffect(() => setAuthed(!!getAccessToken()), []);

  const cart = useQuery({
    queryKey: ["cart"],
    queryFn: () => api<{ items: { quantity: number }[] }>("/api/v1/cart"),
    enabled: authed,
  });
  const cartCount = cart.data?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-kcal-cream bg-white/95 px-4 py-3 backdrop-blur-md lg:px-8">
      {backHref ? (
        <Link
          href={backHref}
          className="shrink-0 rounded-full p-2 text-kcal-charcoal transition hover:bg-kcal-cream"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold text-kcal-charcoal">{title}</h1>
        {subtitle ? <p className="truncate text-xs text-kcal-muted">{subtitle}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {authed ? (
          <Link
            href="/cart"
            className="relative rounded-full p-2.5 text-kcal-charcoal transition hover:bg-kcal-cream"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 top-0 flex min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>
        ) : (
          <Link
            href="/login"
            className="rounded-full px-3 py-2 text-xs font-semibold text-kcal-sage hover:bg-kcal-cream"
          >
            Log in
          </Link>
        )}
        <Link
          href="/profile"
          className="rounded-full p-2.5 text-kcal-charcoal transition hover:bg-kcal-cream"
          aria-label="Profile"
        >
          <User className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
