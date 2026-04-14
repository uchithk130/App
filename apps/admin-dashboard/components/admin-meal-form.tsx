"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@fitmeals/ui";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { RichDescriptionEditor } from "@/components/rich-description-editor";
import { MealImageField } from "@/components/meal-image-field";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  categoryId: z.string().min(1),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "PRE_WORKOUT", "POST_WORKOUT"]),
  basePrice: z.string(),
  calories: z.coerce.number(),
  proteinG: z.string(),
  carbG: z.string(),
  fatG: z.string(),
  fiberG: z.string(),
  listingStatus: z.enum(["ACTIVE", "PAUSED", "INACTIVE"]),
  richInProtein: z.boolean(),
  richInFiber: z.boolean(),
  richInLowCarb: z.boolean(),
});

export type AdminMealFormProps = {
  mode: "create" | "edit";
  mealId?: string;
};

type MealDetail = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  mealType: string;
  description: string | null;
  basePrice: string;
  listingStatus: "ACTIVE" | "PAUSED" | "INACTIVE";
  richInProtein: boolean;
  richInFiber: boolean;
  richInLowCarb: boolean;
  coverUrl: string | null;
  nutrition: {
    calories: number;
    proteinG: string;
    carbG: string;
    fatG: string;
    fiberG: string;
  } | null;
};

export function AdminMealForm({ mode, mealId }: AdminMealFormProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const [desc, setDesc] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [contentVersion, setContentVersion] = React.useState(0);
  const [err, setErr] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      mealType: "LUNCH",
      basePrice: "349",
      calories: 500,
      proteinG: "40",
      carbG: "45",
      fatG: "12",
      fiberG: "8",
      listingStatus: "ACTIVE",
      richInProtein: false,
      richInFiber: false,
      richInLowCarb: false,
      name: "",
      slug: "",
      categoryId: "",
    },
  });

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
  }, [router]);

  const categories = useQuery({
    queryKey: ["admin-meal-categories"],
    queryFn: () => api<{ items: { id: string; name: string }[] }>("/api/v1/admin/meal-categories"),
    enabled: !!getAccessToken(),
  });

  const meal = useQuery({
    queryKey: ["admin-meal", mealId],
    queryFn: () => api<MealDetail>(`/api/v1/admin/meals/${mealId}`),
    enabled: mode === "edit" && !!mealId && !!getAccessToken(),
  });

  const hydratedRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    hydratedRef.current = null;
  }, [mealId]);

  React.useEffect(() => {
    if (mode !== "edit" || !meal.data || !mealId) return;
    if (hydratedRef.current === meal.data.id) return;
    hydratedRef.current = meal.data.id;
    const m = meal.data;
    const n = m.nutrition;
    form.reset({
      name: m.name,
      slug: m.slug,
      categoryId: m.categoryId,
      mealType: m.mealType as z.infer<typeof schema>["mealType"],
      basePrice: m.basePrice,
      listingStatus: m.listingStatus,
      calories: n?.calories ?? 0,
      proteinG: n?.proteinG ?? "0",
      carbG: n?.carbG ?? "0",
      fatG: n?.fatG ?? "0",
      fiberG: n?.fiberG ?? "0",
      richInProtein: m.richInProtein,
      richInFiber: m.richInFiber,
      richInLowCarb: m.richInLowCarb,
    });
    setDesc(m.description ?? "");
    setImageUrl(m.coverUrl ?? "");
    setContentVersion((v) => v + 1);
  }, [mode, mealId, meal.data, form]);

  const title = mode === "create" ? "Add meal to menu" : "Edit meal";
  const subtitle =
    mode === "create"
      ? "Rich description, image upload (S3), and listing status"
      : "Update details, image, and menu visibility";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="ghost" className="-ml-2 rounded-full text-slate-600">
        <Link href="/meals">← Back to meals</Link>
      </Button>

      {mode === "edit" && meal.isLoading ? (
        <p className="text-slate-500">Loading meal…</p>
      ) : null}
      {mode === "edit" && meal.isError ? (
        <p className="text-red-600">{(meal.error as Error).message}</p>
      ) : null}

      <Card
        className="overflow-hidden rounded-3xl border-0 bg-white shadow-lg ring-1 ring-slate-100"
        data-testid="admin-meal-form-card"
      >
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-orange-50/80 to-amber-50/50">
          <CardTitle className="text-xl">{title}</CardTitle>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </CardHeader>
        <CardContent className="p-6">
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit(async (v) => {
              setErr(null);
              try {
                const nutrition = {
                  calories: v.calories,
                  proteinG: v.proteinG,
                  carbG: v.carbG,
                  fatG: v.fatG,
                  fiberG: v.fiberG,
                };

                if (mode === "create") {
                  await api("/api/v1/admin/meals", {
                    method: "POST",
                    body: JSON.stringify({
                      name: v.name,
                      slug: v.slug,
                      categoryId: v.categoryId,
                      mealType: v.mealType,
                      description: desc || undefined,
                      basePrice: v.basePrice,
                      listingStatus: v.listingStatus,
                      primaryImageUrl: imageUrl.trim() || undefined,
                      nutrition,
                      richInProtein: v.richInProtein,
                      richInFiber: v.richInFiber,
                      richInLowCarb: v.richInLowCarb,
                    }),
                  });
                } else if (mealId) {
                  await api(`/api/v1/admin/meals/${mealId}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                      name: v.name,
                      slug: v.slug,
                      categoryId: v.categoryId,
                      mealType: v.mealType,
                      description: desc || null,
                      basePrice: v.basePrice,
                      listingStatus: v.listingStatus,
                      primaryImageUrl: imageUrl.trim() ? imageUrl.trim() : null,
                      nutrition,
                      richInProtein: v.richInProtein,
                      richInFiber: v.richInFiber,
                      richInLowCarb: v.richInLowCarb,
                    }),
                  });
                  hydratedRef.current = null;
                  await qc.invalidateQueries({ queryKey: ["admin-meal", mealId] });
                }

                await qc.invalidateQueries({ queryKey: ["admin-meals-list"] });
                router.push("/meals");
              } catch (e) {
                setErr((e as Error).message);
              }
            })}
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input className="rounded-2xl border-slate-200" data-testid="admin-meal-name" {...form.register("name")} />
                </div>
                <div className="space-y-1">
                  <Label>Slug</Label>
                  <Input className="rounded-2xl border-slate-200" data-testid="admin-meal-slug" {...form.register("slug")} />
                </div>
                <div className="space-y-1">
                  <Label>Category</Label>
                  <select
                    className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                    data-testid="admin-meal-category"
                    {...form.register("categoryId")}
                  >
                    <option value="">Select category</option>
                    {categories.data?.items.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Meal type</Label>
                  <select
                    className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                    {...form.register("mealType")}
                  >
                    {["BREAKFAST", "LUNCH", "DINNER", "SNACK", "PRE_WORKOUT", "POST_WORKOUT"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Base price (INR)</Label>
                  <Input className="rounded-2xl border-slate-200" {...form.register("basePrice")} />
                </div>
                <div className="space-y-1">
                  <Label>Listing status</Label>
                  <select
                    className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                    {...form.register("listingStatus")}
                  >
                    <option value="ACTIVE">Active — visible to customers</option>
                    <option value="PAUSED">Paused — hidden temporarily</option>
                    <option value="INACTIVE">Inactive — off menu</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Description</Label>
                <RichDescriptionEditor key={contentVersion} value={desc} onChange={setDesc} />
              </div>
            </div>

            <div>
              <Label className="mb-2 block text-base">Meal image</Label>
              <MealImageField mealId={mode === "edit" ? mealId : undefined} imageUrl={imageUrl} onImageUrlChange={setImageUrl} />
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-2 text-sm font-semibold text-slate-700">Menu highlights</div>
              <p className="mb-3 text-xs text-slate-500">Shown on the customer app menu cards next to calories and rating.</p>
              <div className="mb-4 flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...form.register("richInProtein")} />
                  Rich in protein
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...form.register("richInFiber")} />
                  Rich in fiber
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...form.register("richInLowCarb")} />
                  Low carb
                </label>
              </div>
              <div className="mb-2 text-sm font-semibold text-slate-700">Nutrition</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1">
                  <Label className="text-xs">Calories</Label>
                  <Input type="number" className="rounded-xl" {...form.register("calories")} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Protein (g)</Label>
                  <Input className="rounded-xl" {...form.register("proteinG")} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Carbs (g)</Label>
                  <Input className="rounded-xl" {...form.register("carbG")} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fat (g)</Label>
                  <Input className="rounded-xl" {...form.register("fatG")} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fiber (g)</Label>
                  <Input className="rounded-xl" {...form.register("fiberG")} />
                </div>
              </div>
            </div>

            {err ? <p className="text-sm text-red-600">{err}</p> : null}
            <Button
              type="submit"
              disabled={mode === "edit" && (meal.isLoading || !meal.data)}
              className="rounded-full bg-gradient-to-r from-admin-orange to-amber-500 px-8 font-semibold text-white shadow-lg"
              data-testid="admin-meal-save"
            >
              {mode === "create" ? "Save meal" : "Update meal"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
