"use client";

import Link from "next/link";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@fitmeals/ui";
import { KcalAppLayout } from "@/components/kcal/kcal-app-layout";
import { KcalTopBar } from "@/components/kcal/kcal-top-bar";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";

export default function PlansPage() {
  return (
    <KcalViewportShell>
      <KcalAppLayout>
        <div className="relative z-10 flex min-h-dvh flex-col bg-white">
          <KcalTopBar title="Plans" subtitle="Subscriptions & bundles" />
          <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-10 pt-6 max-lg:kcal-safe-pb lg:px-8">
            <p className="mb-6 text-sm text-kcal-muted">
              Commit to a week of precision nutrition — schedules, slots, and macro guardrails.
            </p>
            <Card className="rounded-kcal-xl border border-kcal-sage/30 bg-gradient-to-br from-kcal-mint/50 to-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-kcal-charcoal">Athlete week</CardTitle>
                <CardDescription>10 chef-curated meals / week · ₹4,299</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild className="rounded-pill bg-kcal-sage font-semibold text-white hover:bg-kcal-sage-dark">
                  <Link href="/register">Start subscription</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-pill border-kcal-sage text-kcal-sage">
                  <Link href="/menu">Compare with à la carte</Link>
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </KcalAppLayout>
    </KcalViewportShell>
  );
}
