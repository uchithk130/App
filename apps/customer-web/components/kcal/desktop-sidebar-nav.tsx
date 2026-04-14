"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { kcalMainNavItems } from "./kcal-nav-config";

export function DesktopSidebarNav() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-dvh w-56 flex-col border-r border-emerald-100/80 bg-white pt-6 shadow-sm lg:flex"
      aria-label="Main navigation"
    >
      <Link href="/" className="mb-6 px-5 text-2xl font-bold tracking-tight text-emerald-600">
        FitMeals
      </Link>
      <nav className="flex flex-1 flex-col gap-1 px-3 pb-6">
        {kcalMainNavItems.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-emerald-50 text-emerald-800" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.4 : 1.9} />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
