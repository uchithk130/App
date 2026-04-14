"use client";

import * as React from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

function MoveEnd({
  onCenter,
  programmatic,
}: {
  onCenter: (lat: number, lng: number) => void;
  programmatic: React.MutableRefObject<boolean>;
}) {
  const map = useMapEvents({
    moveend() {
      if (programmatic.current) return;
      const c = map.getCenter();
      onCenter(c.lat, c.lng);
    },
  });
  void map;
  return null;
}

function FlyTo({
  target,
  programmaticMove,
}: {
  target: [number, number] | null;
  programmaticMove: React.MutableRefObject<boolean>;
}) {
  const map = useMap();
  const prev = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!target) return;
    const key = `${target[0]}_${target[1]}`;
    if (prev.current === key) return;
    prev.current = key;
    programmaticMove.current = true;
    map.flyTo(target, 16, { duration: 0.55 });
    const t = window.setTimeout(() => {
      programmaticMove.current = false;
    }, 650);
    return () => window.clearTimeout(t);
  }, [map, target, programmaticMove]);
  return null;
}

type Props = {
  initialCenter: [number, number];
  /** When set, map flies to this point (search / geolocation). */
  flyTo?: [number, number] | null;
  onCenterChange: (lat: number, lng: number) => void;
  programmaticMove: React.MutableRefObject<boolean>;
};

/** OSM + centered pin overlay. */
export function MapPicker({ initialCenter, flyTo, onCenterChange, programmaticMove }: Props) {
  return (
    <div className="relative w-full overflow-hidden rounded-b-3xl">
      <MapContainer
        center={initialCenter}
        zoom={15}
        className="h-[42vh] min-h-[220px] w-full [&_.leaflet-control-attribution]:text-[10px]"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyTo target={flyTo ?? null} programmaticMove={programmaticMove} />
        <MoveEnd onCenter={onCenterChange} programmatic={programmaticMove} />
      </MapContainer>
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full drop-shadow-md">
        <MapPin className="h-10 w-10 text-emerald-600" strokeWidth={2} aria-hidden />
      </div>
    </div>
  );
}
