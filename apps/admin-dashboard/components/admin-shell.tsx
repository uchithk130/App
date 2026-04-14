"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutGrid,
  BarChart3,
  ShoppingCart,
  Star,
  Truck,
  Users,
  UserRound,
  ChefHat,
  Plus,
  Wallet,
  Banknote,
  Settings,
  ChevronDown,
  Menu,
  Search,
  Bell,
  MessageCircle,
  Gift,
  Tag,
  Layers,
} from "lucide-react";
import { Button } from "@fitmeals/ui";
import { clearTokens, getAccessToken } from "@/lib/auth-store";
import { API_BASE } from "@/lib/config";
import { api } from "@/lib/api";
import { AdminHeaderIconMenu } from "@/components/admin-header-icon-menu";
import { MOCK_MESSAGES, MOCK_NOTIFICATIONS } from "@/lib/admin-header-mock";

const dashGroup = [
  { href: "/", label: "Dashboard", Icon: LayoutGrid },
  { href: "/orders", label: "Orders", Icon: ShoppingCart },
  { href: "/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/reviews", label: "Reviews", Icon: Star },
] as const;

const otherNav = [
  {
    label: "Operations",
    items: [
      { href: "/delivery", label: "Delivery & riders", Icon: Truck },
      { href: "/riders", label: "Riders", Icon: Users },
      { href: "/customers", label: "Customers", Icon: UserRound },
    ],
  },
  {
    label: "Menu",
    items: [
      { href: "/categories", label: "Categories", Icon: Layers },
      { href: "/meals", label: "Meals", Icon: ChefHat },
      { href: "/meals/new", label: "Add meal", Icon: Plus },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/finance", label: "Finance", Icon: Wallet },
      { href: "/payouts", label: "Payouts", Icon: Banknote },
      { href: "/coupons", label: "Coupons", Icon: Tag },
    ],
  },
  { label: "System", items: [{ href: "/settings", label: "Settings", Icon: Settings }] },
] as const;

const iconCls = "h-5 w-5 shrink-0";

function linkActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/meals") {
    if (pathname === "/meals") return true;
    if (pathname.startsWith("/meals/") && !pathname.startsWith("/meals/new")) return true;
    return false;
  }
  if (href === "/meals/new") return pathname.startsWith("/meals/new");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function breadcrumbs(pathname: string) {
  if (pathname === "/") return [{ label: "Dashboard", href: "/" }];
  const segments = pathname.split("/").filter(Boolean);
  const out: { label: string; href: string }[] = [{ label: "Dashboard", href: "/" }];
  let acc = "";
  const labels: Record<string, string> = {
    meals: "Meals",
    new: "New meal",
    edit: "Edit meal",
    orders: "Orders",
    delivery: "Delivery",
    riders: "Riders",
    customers: "Customers",
    analytics: "Analytics",
    finance: "Finance",
    settings: "Settings",
    reviews: "Reviews",
    notifications: "Notifications",
    messages: "Messages",
    rewards: "Rewards",
    coupons: "Coupons",
  };
  for (const seg of segments) {
    acc += `/${seg}`;
    out.push({ label: labels[seg] ?? seg, href: acc });
  }
  return out;
}

function initialsFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  if (local.length === 1) return local.toUpperCase();
  return "A";
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNav, setMobileNav] = React.useState(false);
  const [dashOpen, setDashOpen] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const me = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => api<{ user: { email: string; roles: string[] } }>("/api/v1/auth/me"),
    enabled: mounted && !!getAccessToken(),
    staleTime: 60_000,
  });

  const couponsHeaderQ = useQuery({
    queryKey: ["admin-coupons-header"],
    queryFn: () =>
      api<{ items: { id: string; code: string; description: string | null; isActive: boolean }[] }>(
        "/api/v1/admin/coupons?limit=20"
      ),
    enabled: mounted && !!getAccessToken(),
    staleTime: 30_000,
  });

  const activeCoupons = couponsHeaderQ.data?.items.filter((c) => c.isActive) ?? [];
  const couponMenuItems = activeCoupons.slice(0, 6).map((c) => ({
    id: c.id,
    title: c.code,
    subtitle: c.description ?? undefined,
    href: "/coupons",
  }));

  React.useEffect(() => {
    setMobileNav(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
  }, [router]);

  const logout = async () => {
    clearTokens();
    await fetch(`${API_BASE}/api/v1/auth/logout`, { method: "POST", credentials: "include" }).catch(() => undefined);
    router.push("/login");
  };

  const crumbs = breadcrumbs(pathname);
  const pageTitle = crumbs[crumbs.length - 1]?.label ?? "Dashboard";

  const email = mounted ? (me.data?.user.email ?? "") : "";
  const profileLine = !mounted ? "Administrator" : email || (me.isLoading ? "Loading..." : "Administrator");
  const profileInitials = !mounted ? "A" : email ? initialsFromEmail(email) : "A";
  const roleLabel = "Administrator";

  const sidebar = (
    <div className="flex h-full flex-col border-r border-slate-200/80 bg-white shadow-[4px_0_24px_rgba(242,153,13,0.07)]">
      <div className="flex h-[4.5rem] items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-admin-orange text-lg font-bold text-white shadow-md shadow-orange-200/50">
          F
        </div>
        <div>
          <div className="text-base font-bold tracking-tight text-slate-900">FitMeals</div>
          <div className="text-xs text-slate-500">Restaurant admin</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" data-testid="admin-sidebar-nav">
        <div className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Main</div>
        <button
          type="button"
          onClick={() => setDashOpen((o) => !o)}
          className="mb-1 flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-admin-orange hover:bg-orange-50"
        >
          <span>Dashboard</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${dashOpen ? "rotate-180" : ""}`} aria-hidden />
        </button>
        {dashOpen ? (
          <ul className="mb-4 space-y-0.5 pl-2">
            {dashGroup.map((item) => {
              const active = linkActive(pathname, item.href);
              const I = item.Icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? "bg-orange-50 text-admin-orange" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <I className={iconCls} aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}

        {otherNav.map((section) => (
          <div key={section.label} className="mb-4">
            <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{section.label}</div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = linkActive(pathname, item.href);
                const I = item.Icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active ? "bg-orange-50 text-admin-orange" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <I className={iconCls} aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-admin-canvas">
      <aside className="hidden h-full w-[260px] shrink-0 overflow-y-auto lg:block">{sidebar}</aside>

      {mobileNav ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-admin-navy/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNav(false)}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] overflow-y-auto transform transition-transform lg:hidden ${
          mobileNav ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-30 flex min-h-16 shrink-0 flex-wrap items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md md:px-6">
          <button
            type="button"
            className="rounded-xl p-2 text-slate-600 hover:bg-admin-canvas lg:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" aria-hidden />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-slate-900 md:text-xl">{pageTitle}</h1>
            <p className="text-xs text-slate-500 md:text-sm">Welcome to FitMeals Admin</p>
          </div>

          <div className="relative hidden max-w-md flex-1 md:block">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
              <Search className="h-4 w-4" aria-hidden />
            </span>
            <input
              type="search"
              placeholder="Search here…"
              className="h-11 w-full rounded-full border-0 bg-admin-canvas py-2 pl-11 pr-4 text-sm outline-none ring-2 ring-transparent transition placeholder:text-slate-400 focus:bg-white focus:ring-admin-orange/25"
              readOnly
              title="Search (preview)"
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <AdminHeaderIconMenu
              icon={Bell}
              count={MOCK_NOTIFICATIONS.length}
              menuTitle="Notifications"
              items={MOCK_NOTIFICATIONS}
              viewAllHref="/notifications"
            />
            <AdminHeaderIconMenu
              icon={MessageCircle}
              count={MOCK_MESSAGES.length}
              menuTitle="Messages"
              items={MOCK_MESSAGES}
              viewAllHref="/messages"
            />
            <AdminHeaderIconMenu
              icon={Gift}
              count={activeCoupons.length}
              menuTitle="Coupons"
              items={couponMenuItems}
              viewAllHref="/coupons"
            />
            <div className="ml-2 hidden items-center gap-3 sm:flex">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-admin-orange bg-white text-xs font-bold text-admin-orange"
                title={profileLine}
              >
                {profileInitials}
              </div>
              <div className="min-w-0 text-left leading-tight">
                <div className="truncate text-sm font-semibold text-slate-900">{profileLine}</div>
                <div className="text-xs font-medium text-admin-orange">{roleLabel}</div>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-2 rounded-full border-slate-200"
              data-testid="admin-logout"
              onClick={() => void logout()}
            >
              Log out
            </Button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
