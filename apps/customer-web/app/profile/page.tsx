"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Globe,
  HelpCircle,
  Info,
  LogOut,
  MapPin,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Pencil,
  Shield,
  Tag,
  UserPlus,
  Volume2,
  FileText,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "@fitmeals/ui";
import { KcalAppLayout } from "@/components/kcal/kcal-app-layout";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";
import { api } from "@/lib/api";
import { clearTokens, getAccessToken } from "@/lib/auth-store";
import { API_BASE } from "@/lib/config";

/* ── Types ── */
type Profile = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  stats: { totalOrders: number };
};

/* ── Preference keys ── */
const PREF = {
  lang: "kcal_pref_lang",
  push: "kcal_pref_push",
  dark: "kcal_pref_dark",
  sound: "kcal_pref_sound",
  autoUpdate: "kcal_pref_auto_update",
} as const;

function readBool(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  const v = localStorage.getItem(key);
  return v === null ? fallback : v === "1";
}

/* ── Toggle Row ── */
function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${value ? "bg-emerald-500" : "bg-slate-200"}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

/* ── Menu Row ── */
function MenuRow({
  icon: Icon,
  label,
  href,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex-1 text-sm font-medium text-slate-800">{label}</span>
      <ChevronRight className="h-4 w-4 text-slate-300" />
    </>
  );

  const cls =
    "flex items-center gap-3.5 rounded-2xl px-3 py-3 transition active:bg-emerald-50/60 hover:bg-slate-50";

  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`w-full text-left ${cls}`}>
      {inner}
    </button>
  );
}

/* ── Logout Modal ── */
function LogoutModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-rose-50">
          <LogOut className="h-6 w-6 text-rose-500" />
        </div>
        <h3 className="mb-2 text-center text-lg font-bold text-slate-900">Logout</h3>
        <p className="mb-6 text-center text-sm text-slate-500">
          Are you sure you want to log out of your account?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-rose-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-50"
          >
            {loading ? "Logging out..." : "Yes, Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Guest CTA ── */
function GuestCTA() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 p-6 text-center ring-1 ring-emerald-200/40">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
        <UserPlus className="h-8 w-8 text-emerald-500" />
      </div>
      <h2 className="mb-1 text-lg font-bold text-slate-900">Welcome to FitMeals</h2>
      <p className="mb-5 text-sm text-slate-500">Login or register to access your full profile</p>
      <Link
        href="/login"
        className="inline-flex rounded-full bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
      >
        Login / Register
      </Link>
    </div>
  );
}

/* ── Profile Card ── */
function ProfileCard({ profile }: { profile: Profile }) {
  const initials = profile.fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-2xl font-bold text-white ring-4 ring-emerald-100">
            {initials}
          </div>
          <Link
            href="/profile/edit"
            className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md transition hover:bg-emerald-600"
            aria-label="Edit profile"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900">{profile.fullName}</h2>
          {profile.phone && (
            <p className="mt-0.5 text-sm text-slate-500">{profile.phone}</p>
          )}
          {profile.email && (
            <p className="text-sm text-slate-400">{profile.email}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Profile Skeleton ── */
function ProfileSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-4">
        <Skeleton className="h-[72px] w-[72px] rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-3 w-40 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════ */
export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  /* Preferences */
  const [lang, setLang] = React.useState("en");
  const [push, setPush] = React.useState(true);
  const [dark, setDark] = React.useState(false);
  const [sound, setSound] = React.useState(true);
  const [autoUpdate, setAutoUpdate] = React.useState(true);

  React.useEffect(() => {
    setMounted(true);
    setLang(localStorage.getItem(PREF.lang) ?? "en");
    setPush(readBool(PREF.push, true));
    setDark(readBool(PREF.dark, false));
    setSound(readBool(PREF.sound, true));
    setAutoUpdate(readBool(PREF.autoUpdate, true));
  }, []);

  const isAuthed = mounted && !!getAccessToken();

  const profile = useQuery({
    queryKey: ["customer-profile"],
    queryFn: () => api<Profile>("/api/v1/me/profile"),
    enabled: isAuthed,
    retry: false,
    staleTime: 60_000,
  });

  const persistBool = (key: string, val: boolean) => {
    localStorage.setItem(key, val ? "1" : "0");
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    clearTokens();
    await fetch(`${API_BASE}/api/v1/auth/logout`, { method: "POST", credentials: "include" }).catch(
      () => undefined
    );
    setLoggingOut(false);
    setLogoutOpen(false);
    router.push("/login");
    router.refresh();
  };

  /* Auth-aware menu row helper */
  const authHref = (href: string) => (isAuthed ? href : "/login");

  return (
    <KcalViewportShell>
      <KcalAppLayout>
        <div className="relative z-10 flex min-h-dvh flex-col bg-[#f7f8f7]">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-md">
            <div className="flex items-center justify-between px-4 py-3">
              <Link
                href="/"
                className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5 text-slate-800" />
              </Link>
              <h1 className="text-base font-bold text-slate-900">Profile</h1>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
                aria-label="More"
              >
                <MoreHorizontal className="h-5 w-5 text-slate-600" />
              </button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-6 pt-4 max-lg:kcal-safe-pb lg:px-6 lg:pb-10">
            {/* Profile card or Guest CTA */}
            {!mounted ? (
              <ProfileSkeleton />
            ) : isAuthed ? (
              profile.isLoading ? (
                <ProfileSkeleton />
              ) : profile.data ? (
                <ProfileCard profile={profile.data} />
              ) : (
                <ProfileSkeleton />
              )
            ) : (
              <GuestCTA />
            )}

            {/* Logout button for authed users */}
            {isAuthed && profile.data && (
              <button
                type="button"
                onClick={() => setLogoutOpen(true)}
                className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-rose-50 px-4 py-3.5 transition hover:bg-rose-100 active:bg-rose-100"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-rose-500 shadow-sm">
                  <LogOut className="h-5 w-5" />
                </span>
                <span className="flex-1 text-left text-sm font-semibold text-rose-600">Log Out</span>
                <ChevronRight className="h-4 w-4 text-rose-300" />
              </button>
            )}

            {/* Menu rows */}
            <div className="mt-6 space-y-1">
              <MenuRow icon={MapPin} label="My Locations" href={authHref("/locations")} />
              <MenuRow icon={Tag} label="My Promotions" href={authHref("/promotions")} />
              <MenuRow icon={CreditCard} label="Payment Methods" href={authHref("/payments")} />
              <MenuRow icon={MessageCircle} label="Messages" href={authHref("/messages")} />
              <MenuRow icon={UserPlus} label="Invite Friends" href="/invite" />
            </div>

            <div className="my-4 h-px bg-slate-100" />

            <div className="space-y-1">
              <MenuRow icon={Shield} label="Security" href={authHref("/security")} />
              <MenuRow icon={HelpCircle} label="Help Center" href="/support" />
              <MenuRow icon={FileText} label="Terms of Service" href="/terms" />
              <MenuRow icon={FileText} label="Privacy Policy" href="/privacy" />
              <MenuRow icon={Info} label="About App" href="/about" />
            </div>

            {/* Settings */}
            <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Settings
              </h3>

              {/* Language */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700">Language</span>
                </div>
                <select
                  value={lang}
                  onChange={(e) => {
                    setLang(e.target.value);
                    localStorage.setItem(PREF.lang, e.target.value);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="ta">Tamil</option>
                  <option value="kn">Kannada</option>
                </select>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Push Notifications */}
              <div className="flex items-center gap-2.5 py-0.5">
                <Bell className="mt-3 h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <ToggleRow
                    label="Push Notification"
                    value={push}
                    onChange={(v) => {
                      setPush(v);
                      persistBool(PREF.push, v);
                    }}
                  />
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Dark Mode */}
              <div className="flex items-center gap-2.5 py-0.5">
                <Moon className="mt-3 h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <ToggleRow
                    label="Dark Mode"
                    value={dark}
                    onChange={(v) => {
                      setDark(v);
                      persistBool(PREF.dark, v);
                    }}
                  />
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Sound */}
              <div className="flex items-center gap-2.5 py-0.5">
                <Volume2 className="mt-3 h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <ToggleRow
                    label="Sound"
                    value={sound}
                    onChange={(v) => {
                      setSound(v);
                      persistBool(PREF.sound, v);
                    }}
                  />
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Auto Update */}
              <div className="flex items-center gap-2.5 py-0.5">
                <RefreshCw className="mt-3 h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <ToggleRow
                    label="Automatically Updated"
                    value={autoUpdate}
                    onChange={(v) => {
                      setAutoUpdate(v);
                      persistBool(PREF.autoUpdate, v);
                    }}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Logout modal */}
        <LogoutModal
          open={logoutOpen}
          onClose={() => setLogoutOpen(false)}
          onConfirm={() => void handleLogout()}
          loading={loggingOut}
        />
      </KcalAppLayout>
    </KcalViewportShell>
  );
}
