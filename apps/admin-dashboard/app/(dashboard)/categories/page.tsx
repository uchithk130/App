"use client";

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@fitmeals/ui";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Star,
  Eye,
  EyeOff,
  X,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  mealCount: number;
  createdAt: string;
};

/* ---- Form Modal ---- */
function CategoryFormModal({
  open,
  onClose,
  editData,
}: {
  open: boolean;
  onClose: () => void;
  editData: CategoryRow | null;
}) {
  const qc = useQueryClient();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [iconUrl, setIconUrl] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState("0");
  const [isActive, setIsActive] = React.useState(true);
  const [isFeatured, setIsFeatured] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (editData) {
      setName(editData.name);
      setSlug(editData.slug);
      setDescription(editData.description ?? "");
      setIconUrl(editData.iconUrl ?? "");
      setSortOrder(String(editData.sortOrder));
      setIsActive(editData.isActive);
      setIsFeatured(editData.isFeatured);
    } else {
      setName(""); setSlug(""); setDescription(""); setIconUrl("");
      setSortOrder("0"); setIsActive(true); setIsFeatured(false);
    }
    setErr(null);
  }, [editData, open]);

  // Auto-slug from name
  React.useEffect(() => {
    if (!editData && name) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  }, [name, editData]);

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        iconUrl: iconUrl.trim() || null,
        sortOrder: Number(sortOrder) || 0,
        isActive,
        isFeatured,
      };
      if (editData) {
        return api(`/api/v1/admin/meal-categories/${editData.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      }
      return api("/api/v1/admin/meal-categories", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-meal-categories"] });
      onClose();
    },
    onError: (e: Error) => setErr(e.message),
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {editData ? "Edit Category" : "Add Category"}
          </h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Name *</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-admin-orange focus:ring-2 focus:ring-admin-orange/20"
                placeholder="e.g. High Protein"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Slug *</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-admin-orange focus:ring-2 focus:ring-admin-orange/20"
                placeholder="high-protein"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-admin-orange focus:ring-2 focus:ring-admin-orange/20"
              placeholder="Short description for customers..."
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Icon URL</span>
              <input
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-admin-orange focus:ring-2 focus:ring-admin-orange/20"
                placeholder="https://..."
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Sort Order</span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-admin-orange focus:ring-2 focus:ring-admin-orange/20"
              />
            </label>
          </div>

          <div className="flex gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-admin-orange focus:ring-admin-orange"
              />
              Active
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-admin-orange focus:ring-admin-orange"
              />
              Featured on Home
            </label>
          </div>

          {err && <p className="text-sm text-rose-600">{err}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!name.trim() || !slug.trim() || save.isPending}
              onClick={() => save.mutate()}
              className="rounded-xl bg-admin-orange px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-50"
            >
              {save.isPending ? "Saving..." : editData ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Main Page ---- */
export default function AdminCategoriesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [mounted, setMounted] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editData, setEditData] = React.useState<CategoryRow | null>(null);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setMounted(true);
  }, [router]);

  const q = useQuery({
    queryKey: ["admin-meal-categories"],
    queryFn: () => api<{ items: CategoryRow[] }>("/api/v1/admin/meal-categories"),
    enabled: mounted && !!getAccessToken(),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api(`/api/v1/admin/meal-categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-meal-categories"] }),
  });

  const toggleFeatured = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      api(`/api/v1/admin/meal-categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isFeatured }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-meal-categories"] }),
  });

  const deleteCat = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/admin/meal-categories/${id}`, { method: "DELETE" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-meal-categories"] }),
  });

  const categories = q.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500">Manage meal categories shown to customers.</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditData(null); setFormOpen(true); }}
          className="flex items-center gap-2 rounded-xl bg-admin-orange px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Categories table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3.5 w-10">#</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Slug</th>
                <th className="px-5 py-3.5 text-center">Meals</th>
                <th className="px-5 py-3.5 text-center">Active</th>
                <th className="px-5 py-3.5 text-center">Featured</th>
                <th className="px-5 py-3.5 w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {q.isLoading ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Layers className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">No categories yet</p>
                    <p className="text-xs text-slate-400">Add your first category to organize meals.</p>
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 text-slate-400">
                      <GripVertical className="h-4 w-4" />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {cat.iconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cat.iconUrl} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-slate-100" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <Layers className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">{cat.name}</p>
                          {cat.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1">{cat.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{cat.slug}</td>
                    <td className="px-5 py-3 text-center tabular-nums text-slate-700">{cat.mealCount}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleActive.mutate({ id: cat.id, isActive: !cat.isActive })}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                          cat.isActive
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {cat.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {cat.isActive ? "Active" : "Hidden"}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleFeatured.mutate({ id: cat.id, isFeatured: !cat.isFeatured })}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                          cat.isFeatured
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        <Star className={`h-3 w-3 ${cat.isFeatured ? "fill-amber-400" : ""}`} />
                        {cat.isFeatured ? "Featured" : "No"}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => { setEditData(cat); setFormOpen(true); }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (cat.mealCount > 0) {
                              alert(`Cannot delete: ${cat.mealCount} meal(s) linked.`);
                              return;
                            }
                            if (confirm(`Delete "${cat.name}"?`)) deleteCat.mutate(cat.id);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CategoryFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        editData={editData}
      />
    </div>
  );
}
