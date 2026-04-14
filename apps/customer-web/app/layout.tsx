import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const kcalFont = Nunito({
  subsets: ["latin"],
  variable: "--font-kcal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "kcal — FitMeals",
  description: "Find, track and eat healthy food.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={kcalFont.variable}>
      <body className="min-h-screen bg-background font-kcal text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
