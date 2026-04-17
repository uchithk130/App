"use client";

import { Phone, MessageCircle, User } from "lucide-react";

type Props = {
  name: string;
  orderId: string;
  /** Show call/message actions -- should be true only during active delivery */
  showActions?: boolean;
};

export function RiderInfoCard({ name, orderId, showActions = true }: Props) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      {/* Avatar */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
        {initials || <User className="h-6 w-6" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">Delivery partner #{orderId.slice(0, 8)}</p>
      </div>

      {/* Contact actions -- only during active delivery */}
      {showActions && (
        <div className="flex gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
            aria-label="Chat with rider"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <a
            href="tel:"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
            aria-label="Call rider"
          >
            <Phone className="h-5 w-5" />
          </a>
        </div>
      )}
    </div>
  );
}

