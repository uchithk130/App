"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Crosshair, MapPin, Search } from "lucide-react";
import { KcalAppLayout } from "@/components/kcal/kcal-app-layout";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";

const MapPicker = dynamic(
  () => import("@/components/customer/map/map-picker").then((m) => m.MapPicker),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[42vh] min-h-[220px] w-full items-center justify-center rounded-b-3xl bg-slate-100 text-sm text-slate-500"
        aria-hidden
      >
        Loading map…
      </div>
    ),
  },
);
import { API_BASE } from "@/lib/config";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { writeStoredLocation } from "@/lib/location-storage";

const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];

export function AddLocationContent() {
  const router = useRouter();
  const programmatic = React.useRef(false);
  const [picked, setPicked] = React.useState<[number, number]>(DEFAULT_CENTER);
  const [flyTo, setFlyTo] = React.useState<[number, number] | null>(null);

  const [addressLine, setAddressLine] = React.useState("");
  const [houseNo, setHouseNo] = React.useState("");
  const [line1, setLine1] = React.useState("");
  const [line2, setLine2] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [postcode, setPostcode] = React.useState("");
  const [label, setLabel] = React.useState("Home");
  const [searchQ, setSearchQ] = React.useState("");
  const [searchHits, setSearchHits] = React.useState<
    { lat: number; lng: number; label: string; line1: string; city: string; state: string; postcode: string }[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [geoErr, setGeoErr] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const jumpTo = React.useCallback((lat: number, lng: number) => {
    setPicked([lat, lng]);
    setFlyTo([lat, lng]);
  }, []);

  const reverse = React.useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/geocode/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
      );
      const data = (await res.json()) as {
        label?: string;
        line1?: string;
        city?: string;
        state?: string;
        postcode?: string;
      };
      if (data.label) setAddressLine(data.label);
      if (data.line1) setLine1(data.line1);
      if (data.city) setCity(data.city);
      if (data.state) setState(data.state);
      if (data.postcode) setPostcode(data.postcode);
    } catch {
      /* ignore */
    }
  }, []);

  const debounceRef = React.useRef<number | null>(null);
  const scheduleReverse = React.useCallback(
    (lat: number, lng: number) => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => void reverse(lat, lng), 450);
    },
    [reverse],
  );

  React.useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        jumpTo(lat, lng);
        void reverse(lat, lng);
      },
      () => setGeoErr("Location permission denied — search or drag the map."),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }, [jumpTo, reverse]);

  const runSearch = async () => {
    const q = searchQ.trim();
    if (q.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/geocode/search?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as {
        items: { lat: number; lng: number; label: string; line1: string; city: string; state: string; postcode: string }[];
      };
      setSearchHits(data.items ?? []);
      const first = data.items?.[0];
      if (first) {
        jumpTo(first.lat, first.lng);
        setAddressLine(first.label);
        setLine1(first.line1);
        setCity(first.city);
        setState(first.state);
        setPostcode(first.postcode);
        setSearchHits([]);
        setSearchQ("");
      }
    } finally {
      setLoading(false);
    }
  };

  const useMyLocation = () => {
    setGeoErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        jumpTo(lat, lng);
        void reverse(lat, lng);
      },
      () => setGeoErr("Could not get current location."),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const save = async () => {
    setSaveError(null);
    const lat = picked[0];
    const lng = picked[1];

    // Build line1 from house number + street
    const fullLine1 = [houseNo.trim(), line1.trim()].filter(Boolean).join(", ");
    if (!fullLine1) {
      setSaveError("Please enter your house/flat number and street.");
      return;
    }
    const finalCity = city.trim();
    const finalState = state.trim();
    const finalPincode = postcode.trim();
    if (!finalCity) { setSaveError("City is required."); return; }
    if (!finalState) { setSaveError("State is required."); return; }
    if (!finalPincode) { setSaveError("Pincode is required."); return; }

    const payload = {
      line1: fullLine1,
      line2: line2.trim() || undefined,
      city: finalCity,
      state: finalState,
      pincode: finalPincode,
      label: label.trim() || "Home",
      lat,
      lng,
      isDefault: true,
    };

    setSaving(true);
    try {
      if (getAccessToken()) {
        await api("/api/v1/customer/addresses", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      writeStoredLocation({
        line1: payload.line1,
        line2: payload.line2,
        city: payload.city,
        state: payload.state,
        pincode: payload.pincode,
        label: payload.label,
        lat,
        lng,
      });
      router.push("/locations");
    } catch (e) {
      setSaveError((e as Error).message || "Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KcalViewportShell>
      <KcalAppLayout>
        <div className="flex min-h-dvh flex-col bg-white pb-28 lg:pb-8">
          <header className="flex items-center gap-3 px-4 pt-3">
            <Link href="/locations" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-100">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="flex-1 text-center text-lg font-bold text-slate-900">Add new location</h1>
            <button
              type="button"
              onClick={useMyLocation}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-100"
              aria-label="Use my location"
            >
              <Crosshair className="h-5 w-5 text-emerald-700" />
            </button>
          </header>

          <div className="relative mt-2 px-4">
            <div className="flex gap-2">
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void runSearch()}
                placeholder="Search place or address"
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={() => void runSearch()}
                disabled={loading}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md disabled:opacity-50"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
            {searchHits.length > 1 ? (
              <ul className="absolute left-4 right-4 top-12 z-[600] max-h-48 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {searchHits.map((h) => (
                  <li key={`${h.lat}-${h.lng}-${h.label.slice(0, 40)}`}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-emerald-50"
                      onClick={() => {
                        jumpTo(h.lat, h.lng);
                        setAddressLine(h.label);
                        setLine1(h.line1);
                        setCity(h.city);
                        setState(h.state);
                        setPostcode(h.postcode);
                        setSearchHits([]);
                        setSearchQ("");
                      }}
                    >
                      {h.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {geoErr ? <p className="px-4 pt-2 text-xs text-amber-800">{geoErr}</p> : null}

          <div className="mt-2">
            <MapPicker
              initialCenter={DEFAULT_CENTER}
              flyTo={flyTo}
              onCenterChange={(lat, lng) => {
                setPicked([lat, lng]);
                scheduleReverse(lat, lng);
              }}
              programmaticMove={programmatic}
            />
          </div>

          <div className="relative z-10 -mt-4 rounded-t-3xl bg-white px-4 pb-8 pt-6 shadow-[0_-8px_30px_-8px_rgba(0,0,0,0.08)]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" aria-hidden />
            <h2 className="mb-4 text-base font-bold text-slate-900">Delivery Address</h2>

            {/* Detected location summary */}
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Detected location</label>
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="min-w-0 flex-1 text-sm text-slate-800">{addressLine || "Move the map to pick a point"}</p>
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
            </div>

            {/* Coordinates display */}
            <div className="mb-4 flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-500">Latitude</label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm tabular-nums text-slate-700">
                  {picked[0].toFixed(6)}
                </div>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-500">Longitude</label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm tabular-nums text-slate-700">
                  {picked[1].toFixed(6)}
                </div>
              </div>
            </div>

            {/* Address fields */}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  House / Flat / Floor No. <span className="text-rose-400">*</span>
                </label>
                <input
                  value={houseNo}
                  onChange={(e) => setHouseNo(e.target.value)}
                  placeholder="e.g. Flat 201, 2nd Floor"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Street / Area <span className="text-rose-400">*</span>
                </label>
                <input
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="e.g. MG Road, Indiranagar"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Landmark (optional)</label>
                <input
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="e.g. Near City Mall"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    City <span className="text-rose-400">*</span>
                  </label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bangalore"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    State <span className="text-rose-400">*</span>
                  </label>
                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Karnataka"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Pincode <span className="text-rose-400">*</span>
                  </label>
                  <input
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="e.g. 560001"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Save as</label>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Home"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>

            {saveError && (
              <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2 text-xs text-rose-600">{saveError}</p>
            )}

            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="mt-6 w-full rounded-pill bg-emerald-500 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/25 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Address"}
            </button>
          </div>
        </div>
      </KcalAppLayout>
    </KcalViewportShell>
  );
}
