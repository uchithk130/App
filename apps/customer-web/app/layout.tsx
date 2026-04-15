import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "kcal — FitMeals",
  description: "Find, track and eat healthy food.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@200..1000&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background font-kcal text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
