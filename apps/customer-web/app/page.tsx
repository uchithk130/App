"use client";

import { KcalAppLayout } from "@/components/kcal/kcal-app-layout";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";
import { HomeScreen } from "@/components/customer/home/home-screen";

export default function HomePage() {
  return (
    <KcalViewportShell>
      <KcalAppLayout>
        <HomeScreen />
      </KcalAppLayout>
    </KcalViewportShell>
  );
}
