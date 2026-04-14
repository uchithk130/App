"use client";

import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type HeaderMenuItem = { id: string; title: string; subtitle?: string; href: string };

type Props = {
  icon: LucideIcon;
  count: number;
  menuTitle: string;
  items: HeaderMenuItem[];
  viewAllHref: string;
};

export function AdminHeaderIconMenu({ icon: Icon, count, menuTitle, items, viewAllHref }: Props) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function close(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", close);
      return () => document.removeEventListener("mousedown", close);
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2.5 text-slate-600 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-admin-orange/30"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={menuTitle}
      >
        <Icon className="h-5 w-5" aria-hidden />
        {count > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-admin-orange px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/10"
          role="menu"
        >
          <div className="border-b border-slate-100 bg-admin-canvas/40 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{menuTitle}</p>
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-slate-500">Nothing here yet.</li>
            ) : (
              items.map((it) => (
                <li key={it.id} role="none">
                  <Link
                    role="menuitem"
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 transition hover:bg-admin-canvas/80"
                  >
                    <div className="text-sm font-medium text-slate-900">{it.title}</div>
                    {it.subtitle ? <div className="text-xs text-slate-500">{it.subtitle}</div> : null}
                  </Link>
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-slate-100 p-2">
            <Link
              href={viewAllHref}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-center text-sm font-semibold text-admin-orange hover:bg-orange-50"
            >
              View all
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
