"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Plus } from "lucide-react";
import { KcalAppLayout } from "@/components/kcal/kcal-app-layout";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { readStoredLocation, writeStoredLocation } from "@/lib/location-storage";

type Addr = {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  label: string | null;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
};

export function LocationsContent() {
  const router = useRouter();
  const qc = useQueryClient();
  const loggedIn = !!getAccessToken();
  const [selected, setSelected] = React.useState<string | null>(null);

  const list = useQuery({
    queryKey: ["customer-addresses"],
    queryFn: () => api<{ items: Addr[] }>("/api/v1/customer/addresses"),
    enabled: loggedIn,
  });

  React.useEffect(() => {
    const local = readStoredLocation();
    if (local?.id) setSelected(local.id);
    else if (loggedIn && list.data?.items.length) {
      const items = list.data.items;
      const def = items.find((a) => a.isDefault) ?? items[0];
      if (def) setSelected(def.id);
    }
  }, [loggedIn, list.data]);

  const apply = async () => {
    if (loggedIn && selected) {
      await api("/api/v1/customer/addresses/select", {
        method: "POST",
        body: JSON.stringify({ addressId: selected }),
      });
      const row = list.data?.items.find((a) => a.id === selected);
      if (row?.lat != null && row.lng != null) {
        writeStoredLocation({
          id: row.id,
          label: row.label ?? "Saved",
          line1: row.line1,
          line2: row.line2 ?? undefined,
          city: row.city,
          state: row.state,
          pincode: row.pincode,
          lat: row.lat,
          lng: row.lng,
        });
      }
    } else {
      const local = readStoredLocation();
      if (local) writeStoredLocation(local);
    }
    void qc.invalidateQueries({ queryKey: ["customer-addresses"] });
    router.push("/");
  };

  const rows: Addr[] = loggedIn ? (list.data?.items ?? []) : [];

  return (
    <KcalViewportShell>
      <KcalAppLayout>
        <div className="min-h-dvh bg-white pb-36 pt-3 lg:pb-12">
          <header className="mb-6 flex items-center gap-3 px-4">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-100"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5 text-slate-800" />
            </Link>
            <h1 className="flex-1 text-center text-lg font-bold text-slate-900">My Locations</h1>
            <span className="w-10" />
          </header>

          <div className="space-y-3 px-4">
            {!loggedIn ? (
              <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <Link href="/login" className="font-semibold underline">
                  Sign in
                </Link>{" "}
                to sync saved addresses. Until then we use the location from Add location.
              </p>
            ) : null}

            {list.isLoading && loggedIn ? (
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            ) : loggedIn && rows.length === 0 ? (
              <p className="text-center text-sm text-slate-500">No saved addresses yet.</p>
            ) : (
              rows.map((a) => {
                const active = selected === a.id;
                const line = [a.line1, a.city, a.pincode].filter(Boolean).join(", ");
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelected(a.id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
                      active ? "border-emerald-400 bg-emerald-50/50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                        active ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900">{a.label ?? "Address"}</p>
                      <p className="text-sm text-slate-500">{line}</p>
                    </div>
                    <MapPin className="mt-1 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                  </button>
                );
              })
            )}

            <Link
              href="/locations/new"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-50 py-3.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-100"
            >
              <Plus className="h-5 w-5" />
              Add new location
            </Link>
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-100 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:relative lg:mt-8 lg:border-0 lg:bg-transparent lg:px-4">
            <button
              type="button"
              onClick={() => void apply()}
              className="w-full rounded-pill bg-emerald-500 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/25"
            >
              Apply
            </button>
          </div>
        </div>
      </KcalAppLayout>
    </KcalViewportShell>
  );
}
