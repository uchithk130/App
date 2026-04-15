"use client";

import Link from "next/link";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";

export default function MessagesPage() {
  return (
    <KcalViewportShell>
      <div className="min-h-dvh bg-white">
        <main className="mx-auto max-w-kcal px-5 pb-10 pt-8">
          <Link
            href="/profile"
            className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-kcal-sage"
          >
            <ChevronLeft className="h-4 w-4" />
            Profile
          </Link>
          <h1 className="text-2xl font-bold text-kcal-charcoal">Messages</h1>
          <p className="mt-2 text-sm text-kcal-muted">Your conversations and notifications.</p>

          <section className="mt-8 flex flex-col items-center rounded-kcal-xl border border-kcal-cream bg-kcal-cream/30 p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <MessageCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold text-kcal-charcoal">No messages yet</h2>
            <p className="mt-2 text-sm text-kcal-muted">
              Your order updates and support conversations will appear here.
            </p>
          </section>
        </main>
      </div>
    </KcalViewportShell>
  );
}
