"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Truck, Eye, EyeOff, AlertCircle, Clock } from "lucide-react";
import { API_BASE } from "@/lib/config";
import { setTokens } from "@/lib/auth-store";

export default function RiderLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [errCode, setErrCode] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setErrCode(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, app: "rider" }),
      });
      const data = (await res.json()) as { accessToken?: string; refreshToken?: string; error?: string; code?: string };
      if (!res.ok) {
        setErr(data.error ?? "Login failed");
        setErrCode(data.code ?? null);
        return;
      }
      if (data.accessToken) {
        setTokens(data.accessToken, data.refreshToken);
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-200/50">
          <Truck className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">FitMeals Rider</h1>
        <p className="text-sm text-slate-500">Sign in to start delivering</p>
      </div>

      {/* Pending/rejected message */}
      {errCode === "RIDER_PENDING" && (
        <div className="mb-5 w-full max-w-sm rounded-2xl bg-amber-50 p-4 text-center ring-1 ring-amber-200">
          <Clock className="mx-auto mb-2 h-6 w-6 text-amber-500" />
          <p className="text-sm font-semibold text-amber-800">Account Pending Approval</p>
          <p className="mt-1 text-xs text-amber-600">An admin will review and approve your account before you can sign in.</p>
        </div>
      )}
      {errCode === "RIDER_REJECTED" && (
        <div className="mb-5 w-full max-w-sm rounded-2xl bg-rose-50 p-4 text-center ring-1 ring-rose-200">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-rose-500" />
          <p className="text-sm font-semibold text-rose-800">Registration Not Approved</p>
          <p className="mt-1 text-xs text-rose-600">Your rider registration was not approved. Please contact support.</p>
        </div>
      )}
      {errCode === "RIDER_SUSPENDED" && (
        <div className="mb-5 w-full max-w-sm rounded-2xl bg-rose-50 p-4 text-center ring-1 ring-rose-200">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-rose-500" />
          <p className="text-sm font-semibold text-rose-800">Account Suspended</p>
          <p className="mt-1 text-xs text-rose-600">Your rider account has been suspended. Please contact support.</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={(e) => void handleSubmit(e)} className="w-full max-w-sm space-y-4">
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            placeholder="rider@fitmeals.com"
          />
        </label>

        <label className="relative block">
          <span className="text-xs font-semibold text-slate-600">Password</span>
          <div className="relative mt-1">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              placeholder="Min 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        {err && !errCode && (
          <p className="flex items-center gap-1.5 text-sm text-rose-600">
            <AlertCircle className="h-4 w-4" />
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-white shadow-sm shadow-amber-200/50 transition hover:bg-amber-600 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-center text-sm text-slate-500">
          New rider?{" "}
          <Link href="/register" className="font-semibold text-amber-600 hover:underline">
            Apply here
          </Link>
        </p>
      </form>
    </div>
  );
}
