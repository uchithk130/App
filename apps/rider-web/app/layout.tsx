import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { RiderAppShell } from "@/components/rider-app-shell";

export const metadata: Metadata = {
  title: "FitMeals Rider",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FFFBF0]">
        <Providers>
          <RiderAppShell>{children}</RiderAppShell>
        </Providers>
      </body>
    </html>
  );
}
