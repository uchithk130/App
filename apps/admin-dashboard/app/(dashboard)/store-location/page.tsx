"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Save, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

type StoreLocation = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export default function StoreLocationPage() {
  const qc = useQueryClient();
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [lat, setLat] = React.useState("");
  const [lng, setLng] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  const q = useQuery({
    queryKey: ["store-location"],
    queryFn: () => api<{ location: StoreLocation | null }>("/api/v1/admin/settings/store-location"),
  });

  React.useEffect(() => {
    if (q.data?.location) {
      setName(q.data.location.name);
      setAddress(q.data.location.address);
      setLat(String(q.data.location.lat));
      setLng(String(q.data.location.lng));
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: () =>
      api("/api/v1/admin/settings/store-location", {
        method: "PUT",
        body: JSON.stringify({
          name,
          address,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["store-location"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleGetCurrentLocation = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
      },
      () => alert("Could not get current location"),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Store / Counter Location</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          Set your restaurant or counter location. Riders will see navigation directions to this location for order pickup.
        </p>
      </div>

      <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-zinc-300">Store Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. FitMeals Kitchen"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-admin-orange focus:ring-2 focus:ring-admin-orange/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-zinc-300">Full Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Main Street, City, State, Pincode"
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-admin-orange focus:ring-2 focus:ring-admin-orange/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-zinc-300">Latitude</label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="e.g. 12.9716"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm tabular-nums outline-none focus:border-admin-orange focus:ring-2 focus:ring-admin-orange/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-zinc-300">Longitude</label>
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="e.g. 77.5946"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm tabular-nums outline-none focus:border-admin-orange focus:ring-2 focus:ring-admin-orange/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <MapPin className="h-4 w-4" />
            Use Current Location
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending || !name.trim() || !address.trim() || !lat || !lng}
            className="flex items-center gap-2 rounded-xl bg-admin-orange px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-50"
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Location
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </div>

      {q.data?.location && (
        <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="mb-2 text-sm font-bold text-slate-700 dark:text-zinc-300">Current Location Preview</h3>
          <div className="space-y-1 text-sm text-slate-600 dark:text-zinc-400">
            <p><span className="font-medium">Name:</span> {q.data.location.name}</p>
            <p><span className="font-medium">Address:</span> {q.data.location.address}</p>
            <p><span className="font-medium">Coordinates:</span> {q.data.location.lat}, {q.data.location.lng}</p>
          </div>
          <a
            href={`https://www.google.com/maps?q=${q.data.location.lat},${q.data.location.lng}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-admin-orange hover:underline"
          >
            <MapPin className="h-3.5 w-3.5" /> View on Google Maps
          </a>
        </div>
      )}
    </div>
  );
}
