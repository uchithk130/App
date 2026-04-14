"use client";

import * as React from "react";
import { ChevronRight, Check, Loader2 } from "lucide-react";

type Props = {
  label: string;
  onConfirm: () => Promise<void> | void;
  disabled?: boolean;
  variant?: "amber" | "green" | "red";
};

const COLORS = {
  amber: { bg: "bg-amber-500", track: "bg-amber-100", text: "text-amber-700" },
  green: { bg: "bg-emerald-500", track: "bg-emerald-100", text: "text-emerald-700" },
  red: { bg: "bg-rose-500", track: "bg-rose-100", text: "text-rose-700" },
};

export function SwipeToConfirm({ label, onConfirm, disabled, variant = "amber" }: Props) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const startX = React.useRef(0);
  const maxOffset = React.useRef(0);

  const c = COLORS[variant];
  const THUMB = 56;
  const THRESHOLD = 0.75;

  React.useEffect(() => {
    if (trackRef.current) {
      maxOffset.current = trackRef.current.clientWidth - THUMB - 8;
    }
  }, []);

  const handleStart = (clientX: number) => {
    if (disabled || loading || done) return;
    if (trackRef.current) maxOffset.current = trackRef.current.clientWidth - THUMB - 8;
    startX.current = clientX;
    setDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!dragging) return;
    const dx = Math.max(0, Math.min(clientX - startX.current, maxOffset.current));
    setOffset(dx);
  };

  const handleEnd = async () => {
    if (!dragging) return;
    setDragging(false);
    if (offset >= maxOffset.current * THRESHOLD) {
      setOffset(maxOffset.current);
      setLoading(true);
      try {
        await onConfirm();
        setDone(true);
      } catch {
        setOffset(0);
      } finally {
        setLoading(false);
      }
    } else {
      setOffset(0);
    }
  };

  const pct = maxOffset.current > 0 ? offset / maxOffset.current : 0;

  return (
    <div
      ref={trackRef}
      className={`relative h-16 overflow-hidden rounded-2xl ${c.track} ${disabled ? "opacity-50" : ""}`}
      onTouchStart={(e) => handleStart(e.touches[0]!.clientX)}
      onTouchMove={(e) => handleMove(e.touches[0]!.clientX)}
      onTouchEnd={() => void handleEnd()}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => { if (dragging) handleMove(e.clientX); }}
      onMouseUp={() => void handleEnd()}
      onMouseLeave={() => { if (dragging) void handleEnd(); }}
    >
      {/* Label */}
      <div className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${c.text} transition-opacity ${pct > 0.3 ? "opacity-30" : "opacity-100"}`}>
        {done ? "Done!" : label}
      </div>

      {/* Fill */}
      <div
        className={`absolute left-1 top-1 bottom-1 rounded-xl ${c.bg} opacity-20 transition-none`}
        style={{ width: offset + THUMB }}
      />

      {/* Thumb */}
      <div
        className={`absolute left-1 top-1 flex h-[calc(100%-8px)] w-14 items-center justify-center rounded-xl ${c.bg} text-white shadow-lg ${
          dragging ? "" : "transition-transform duration-300"
        }`}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : done ? (
          <Check className="h-6 w-6" strokeWidth={3} />
        ) : (
          <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
        )}
      </div>
    </div>
  );
}
