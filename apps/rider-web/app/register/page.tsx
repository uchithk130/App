"use client";

import * as React from "react";
import Link from "next/link";
import { Truck, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { API_BASE } from "@/lib/config";

export default function RiderRegisterPage() {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");
  const [vehicleType, setVehicleType] = React.useState("");
  const [vehicleNumber, setVehicleNumber] = React.useState("");
  const [emergencyContact, setEmergencyContact] = React.useState("");
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [doneMsg, setDoneMsg] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password !== confirmPw) { setErr("Passwords do not match"); return; }
    if (!termsAccepted) { setErr("Please accept the terms"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/register-rider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone: phone || undefined,
          vehicleType: vehicleType || undefined,
          vehicleNumber: vehicleNumber || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string; code?: string };
      if (!res.ok) { setErr(data.error ?? "Registration failed"); return; }
      setDoneMsg(data.message ?? "Application submitted!");
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Application Submitted!</h1>
        <p className="mt-2 max-w-xs text-sm text-slate-500">{doneMsg}</p>
        <Link
          href="/login"
          className="mt-6 rounded-xl bg-amber-500 px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 py-8">
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-200/50">
          <Truck className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Become a Rider</h1>
        <p className="text-sm text-slate-500">Apply to deliver with FitMeals</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="w-full max-w-sm space-y-4">
        {/* Basic info */}
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Full Name *</span>
          <input
            value={fullName} onChange={(e) => setFullName(e.target.value)} required
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            placeholder="Your full name"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Email *</span>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            placeholder="you@email.com"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Phone</span>
          <input
            value={phone} onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            placeholder="+91..."
          />
        </label>

        <div className="relative">
          <span className="text-xs font-semibold text-slate-600">Password *</span>
          <div className="relative mt-1">
            <input
              type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              placeholder="Min 8 characters"
            />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Confirm Password *</span>
          <input
            type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required minLength={8}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            placeholder="Repeat password"
          />
        </label>

        {/* Vehicle */}
        <div className="rounded-2xl bg-amber-50/50 p-4 ring-1 ring-amber-100">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-600">Vehicle Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-semibold text-slate-600">Type</span>
              <select
                value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
              >
                <option value="">Select</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Scooter">Scooter</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Car">Car</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-slate-600">Number</span>
              <input
                value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
                placeholder="KA-01-XX"
              />
            </label>
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Emergency Contact</span>
          <input
            value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            placeholder="Phone number"
          />
        </label>

        {/* Terms */}
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-700">
          <input
            type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
          />
          <span className="text-xs">
            I agree to the{" "}
            <Link href="/terms" className="font-semibold text-amber-600 hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="font-semibold text-amber-600 hover:underline">Privacy Policy</Link>
          </span>
        </label>

        {err && (
          <p className="flex items-center gap-1.5 text-sm text-rose-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-white shadow-sm shadow-amber-200/50 transition hover:bg-amber-600 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-amber-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
