"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@fitmeals/ui";
import { API_BASE } from "@/lib/config";
import { setTokens } from "@/lib/auth-store";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between bg-admin-navy p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-admin-orange text-lg font-bold text-white shadow-lg shadow-orange-900/20">
            F
          </div>
          <div>
            <div className="font-semibold tracking-tight">FitMeals Admin</div>
            <div className="text-xs text-slate-400">Restaurant control center</div>
          </div>
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-3xl font-bold leading-tight">Run kitchen, menu & delivery in one place.</h2>
          <p className="text-sm text-slate-400">
            Metor-inspired dashboard: dark sidebar, KPI cards, orders, riders, and analytics — wired to your FitMeals
            API.
          </p>
        </div>
        <p className="text-xs text-slate-500">© FitMeals · Internal use</p>
      </div>

      <main className="flex w-full flex-col justify-center bg-admin-canvas px-4 py-12 lg:w-1/2 lg:px-12">
        <Card className="mx-auto w-full max-w-md border-slate-200/80 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Sign in</CardTitle>
            <p className="text-sm text-muted-foreground">Administrator account</p>
          </CardHeader>
          <CardContent>
            <form
              data-testid="admin-login-form"
              className="space-y-4"
              onSubmit={form.handleSubmit(async (values) => {
                setErr(null);
                const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ ...values, app: "admin" }),
                });
                const data = (await res.json()) as { accessToken?: string; refreshToken?: string; error?: string };
                if (!res.ok) {
                  setErr(data.error ?? "Login failed");
                  return;
                }
                if (data.accessToken) {
                  setTokens(data.accessToken, data.refreshToken);
                  router.push("/");
                }
              })}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  data-testid="admin-email"
                  className="bg-[var(--admin-input-bg)]"
                  {...form.register("email")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  data-testid="admin-password"
                  className="bg-[var(--admin-input-bg)]"
                  {...form.register("password")}
                />
              </div>
              {err ? <p className="text-sm text-destructive">{err}</p> : null}
              <Button
                type="submit"
                className="w-full bg-admin-orange font-semibold text-white hover:bg-admin-orange-hover"
                data-testid="admin-login-submit"
              >
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
