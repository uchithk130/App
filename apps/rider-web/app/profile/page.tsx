"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@fitmeals/ui";
import {
  ChevronRight,
  HelpCircle,
  FileText,
  LogOut,
  Shield,
  Truck,
  User,
  CreditCard,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { clearTokens, getAccessToken } from "@/lib/auth-store";
import { API_BASE } from "@/lib/config";

type RiderMe = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  availability: string;
  approvalStatus: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
  stats: { totalDeliveries: number };
};

function MenuRow({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-3 transition active:bg-slate-50 hover:bg-slate-50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-medium text-slate-700">{label}</span>
      <ChevronRight className="h-4 w-4 text-slate-300" />
    </Link>
  );
}

export default function RiderProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setMounted(true);
  }, [router]);

  const me = useQuery({
    queryKey: ["rider-me"],
    queryFn: () => api<RiderMe>("/api/v1/rider/me"),
    enabled: mounted && !!getAccessToken(),
  });

  const handleLogout = async () => {
    clearTokens();
    await fetch(`${API_BASE}/api/v1/auth/logout`, { method: "POST", credentials: "include" }).catch(() => undefined);
    router.push("/login");
  };

  if (!mounted) return null;

  const d = me.data;
  const initials = d
    ? d.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "R";

  return (
    <div className="pb-28 pt-4">
      {/* Header */}
      <div className="mb-5 px-5">
        <h1 className="text-xl font-bold text-slate-900">Profile</h1>
      </div>

      {/* Profile card */}
      <div className="mx-5 mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        {me.isLoading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-3.5 w-24 rounded" />
            </div>
          </div>
        ) : d ? (
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xl font-bold text-white ring-4 ring-amber-100">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-900">{d.fullName}</h2>
              {d.phone && (
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <Phone className="h-3 w-3" /> {d.phone}
                </p>
              )}
              {d.email && (
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <Mail className="h-3 w-3" /> {d.email}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  d.approvalStatus === "APPROVED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {d.approvalStatus === "APPROVED" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {d.approvalStatus}
                </span>
                {d.vehicleType && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    <Truck className="h-3 w-3" /> {d.vehicleType}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Stats */}
      {d && (
        <div className="mx-5 mb-5 flex gap-3">
          <div className="flex-1 rounded-xl bg-amber-50 p-3 text-center">
            <p className="text-xl font-bold text-amber-700">{d.stats.totalDeliveries}</p>
            <p className="text-[10px] font-semibold text-amber-600">Total Deliveries</p>
          </div>
          {d.vehicleNumber && (
            <div className="flex-1 rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-sm font-bold text-slate-700">{d.vehicleNumber}</p>
              <p className="text-[10px] font-semibold text-slate-500">Vehicle</p>
            </div>
          )}
        </div>
      )}

      {/* Menu */}
      <div className="mx-5 space-y-0.5">
        <MenuRow icon={User} label="Personal Info" href="/profile" />
        <MenuRow icon={Truck} label="Vehicle Details" href="/profile" />
        <MenuRow icon={CreditCard} label="Bank Details" href="/profile" />
        <div className="my-2 h-px bg-slate-100" />
        <MenuRow icon={Shield} label="Security" href="/profile" />
        <MenuRow icon={HelpCircle} label="Help Center" href="/profile" />
        <MenuRow icon={FileText} label="Terms of Service" href="/profile" />
        <MenuRow icon={FileText} label="Privacy Policy" href="/profile" />
      </div>

      {/* Logout */}
      <div className="mx-5 mt-4">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="flex w-full items-center gap-3 rounded-2xl bg-rose-50 px-4 py-3.5 transition hover:bg-rose-100"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-rose-500 shadow-sm">
            <LogOut className="h-4 w-4" />
          </span>
          <span className="flex-1 text-left text-sm font-bold text-rose-600">Log Out</span>
          <ChevronRight className="h-4 w-4 text-rose-300" />
        </button>
      </div>

      {/* Logout modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
              <LogOut className="h-6 w-6 text-rose-500" />
            </div>
            <h3 className="mb-2 text-center text-lg font-bold text-slate-900">Logout</h3>
            <p className="mb-6 text-center text-sm text-slate-500">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex-1 rounded-xl bg-rose-500 px-4 py-3 text-sm font-bold text-white shadow-sm"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
