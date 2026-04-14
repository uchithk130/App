"use client";

import Link from "next/link";
import { Button } from "@fitmeals/ui";
import { clearTokens } from "@/lib/auth-store";
import { useRouter } from "next/navigation";

export function SiteNav({ authed }: { authed: boolean }) {
  const router = useRouter();
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-primary">
          FitMeals
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link className="rounded-md px-2 py-1 hover:bg-muted" href="/menu">
            Menu
          </Link>
          <Link className="rounded-md px-2 py-1 hover:bg-muted" href="/plans">
            Plans
          </Link>
          {authed ? (
            <>
              <Link className="rounded-md px-2 py-1 hover:bg-muted" href="/cart">
                Cart
              </Link>
              <Link className="rounded-md px-2 py-1 hover:bg-muted" href="/orders">
                Orders
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="customer-logout"
                onClick={async () => {
                  clearTokens();
                  await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1/auth/logout`, {
                    method: "POST",
                    credentials: "include",
                  }).catch(() => undefined);
                  router.push("/login");
                  router.refresh();
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button size="sm" variant="outline">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Join</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
