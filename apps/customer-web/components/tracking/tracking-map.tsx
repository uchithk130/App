"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@fitmeals/ui";
import "leaflet/dist/leaflet.css";

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
const Polyline = dynamic(
  () => import("react-leaflet").then((m) => m.Polyline),
  { ssr: false }
);

type Props = {
  destination: [number, number] | null;
  riderPosition: [number, number] | null;
};

export function TrackingMap({ destination, riderPosition }: Props) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !destination) {
    return <Skeleton className="h-56 w-full rounded-2xl" />;
  }

  const center = riderPosition ?? destination;
  const positions = riderPosition && destination ? [riderPosition, destination] : [];

  return (
    <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-100">
      <MapContainer
        center={center}
        zoom={14}
        className="h-56 w-full [&_.leaflet-control-attribution]:text-[10px]"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {destination && <Marker position={destination} />}
        {riderPosition && <Marker position={riderPosition} />}
        {positions.length === 2 && (
          <Polyline
            positions={positions}
            pathOptions={{ color: "#059669", weight: 4, opacity: 0.7, dashArray: "10 6" }}
          />
        )}
      </MapContainer>
    </div>
  );
}
