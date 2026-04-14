"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import { Skeleton } from "@fitmeals/ui";
import "leaflet/dist/leaflet.css";

/* Dynamic imports - Leaflet requires window */
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((m) => m.Polyline),
  { ssr: false }
);

/* ?? Custom icons ?? */
function makeIcon(color: string, emoji: string): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
    html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;
      background:${color};border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);
      font-size:16px;line-height:1">${emoji}</div>`,
  });
}

const riderIcon = () => makeIcon("#4f46e5", "???");
const destIcon = () => makeIcon("#059669", "??");

/* ?? Types ?? */
export type DeliveryMarker = {
  id: string;
  customerName: string;
  riderName: string;
  status: string;
  destination: { lat: number; lng: number } | null;
  riderLocation: { lat: number; lng: number } | null;
};

type Props = {
  deliveries: DeliveryMarker[];
};

/* ?? Default center (India) ?? */
const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];

export function DeliveryMap({ deliveries }: Props) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Skeleton className="h-[400px] w-full rounded-2xl" />;
  }

  // Compute map bounds from all known points
  const points: [number, number][] = [];
  for (const d of deliveries) {
    if (d.riderLocation) points.push([d.riderLocation.lat, d.riderLocation.lng]);
    if (d.destination) points.push([d.destination.lat, d.destination.lng]);
  }

  const center: [number, number] =
    points.length > 0
      ? [
          points.reduce((s, p) => s + p[0], 0) / points.length,
          points.reduce((s, p) => s + p[1], 0) / points.length,
        ]
      : DEFAULT_CENTER;

  const zoom = points.length === 0 ? 12 : points.length === 1 ? 15 : 13;

  return (
    <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-100">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-[400px] w-full [&_.leaflet-control-attribution]:text-[10px]"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {deliveries.map((d) => (
          <React.Fragment key={d.id}>
            {/* Rider marker */}
            {d.riderLocation && (
              <Marker
                position={[d.riderLocation.lat, d.riderLocation.lng]}
                icon={riderIcon()}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold">{d.riderName}</p>
                    <p className="text-slate-500">{d.status === "OUT_FOR_DELIVERY" ? "On the way" : "Assigned"}</p>
                    <p className="text-slate-400 mt-0.5">? {d.customerName}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Destination marker */}
            {d.destination && (
              <Marker
                position={[d.destination.lat, d.destination.lng]}
                icon={destIcon()}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold">{d.customerName}</p>
                    <p className="text-slate-500">Delivery destination</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Route line */}
            {d.riderLocation && d.destination && (
              <Polyline
                positions={[
                  [d.riderLocation.lat, d.riderLocation.lng],
                  [d.destination.lat, d.destination.lng],
                ]}
                pathOptions={{
                  color: d.status === "OUT_FOR_DELIVERY" ? "#f97316" : "#6366f1",
                  weight: 3,
                  opacity: 0.7,
                  dashArray: "8 6",
                }}
              />
            )}
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
}
