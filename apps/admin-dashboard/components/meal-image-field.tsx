"use client";

import * as React from "react";
import { Label } from "@fitmeals/ui";
import { api } from "@/lib/api";
import { API_BASE } from "@/lib/config";
import { getAccessToken } from "@/lib/auth-store";
import { extractMealsKeyFromUrl } from "@/lib/s3-meal-url";

type UploadRes = { key: string; publicUrl: string; mock?: boolean };

type Props = {
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  onUploadedPublicUrl?: (url: string) => void;
  /** When set, files go under `meals/{mealId}/…` instead of staging. */
  mealId?: string;
};

export function MealImageField({ imageUrl, onImageUrlChange, onUploadedPublicUrl, mealId }: Props) {
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [drag, setDrag] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const blobRevokeRef = React.useRef<string | null>(null);
  const [previewSrc, setPreviewSrc] = React.useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const uploadPairRef = React.useRef<{ publicUrl: string } | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const setManagedBlobPreview = React.useCallback((next: string | null) => {
    if (blobRevokeRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(blobRevokeRef.current);
    }
    blobRevokeRef.current = next;
    setPreviewSrc(next);
  }, []);

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (blobRevokeRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(blobRevokeRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    const trimmed = imageUrl.trim();
    if (!trimmed) {
      uploadPairRef.current = null;
      setManagedBlobPreview(null);
      setPreviewLoading(false);
      setPreviewError(null);
      return;
    }

    if (uploadPairRef.current?.publicUrl === trimmed) {
      return;
    }

    const key = extractMealsKeyFromUrl(trimmed);
    if (!key) {
      setManagedBlobPreview(null);
      setPreviewLoading(false);
      setPreviewError(null);
      return;
    }

    setManagedBlobPreview(null);
    setPreviewError(null);
    setPreviewLoading(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void (async () => {
        const token = getAccessToken();
        if (!token) {
          setPreviewLoading(false);
          setPreviewError("Sign in to load S3 preview.");
          return;
        }
        try {
          const r = await fetch(`${API_BASE}/api/v1/admin/uploads/read?key=${encodeURIComponent(key)}`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          });
          if (!r.ok) {
            setPreviewError("Could not load image from storage (check bucket / permissions).");
            setPreviewLoading(false);
            return;
          }
          const blob = await r.blob();
          const url = URL.createObjectURL(blob);
          setManagedBlobPreview(url);
        } catch {
          setPreviewError("Preview request failed.");
        } finally {
          setPreviewLoading(false);
        }
      })();
    }, 320);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [imageUrl, setManagedBlobPreview]);

  const uploadFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5MB");
      return;
    }
    setUploading(true);
    setUploadError(null);
    uploadPairRef.current = null;
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (mealId) fd.append("mealId", mealId);

      const res = await api<UploadRes>("/api/v1/admin/uploads", {
        method: "POST",
        body: fd,
      });

      if (!res.publicUrl) throw new Error("Upload did not return a public URL");

      const instant = URL.createObjectURL(file);
      setManagedBlobPreview(instant);
      uploadPairRef.current = { publicUrl: res.publicUrl };
      setPreviewError(null);
      setPreviewLoading(false);

      onImageUrlChange(res.publicUrl);
      onUploadedPublicUrl?.(res.publicUrl);
    } catch (e) {
      const msg = (e as Error).message;
      setUploadError(msg === "Unauthorized" ? "Session expired — refresh the page and sign in again." : msg);
    } finally {
      setUploading(false);
    }
  };

  const trimmedUrl = imageUrl.trim();
  const mealsKey = trimmedUrl ? extractMealsKeyFromUrl(trimmedUrl) : null;
  const imgSrc = previewSrc ?? (mealsKey ? undefined : trimmedUrl || undefined);

  return (
    <div className="space-y-4">
      <div>
        <Label>Image URL</Label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => {
            uploadPairRef.current = null;
            onImageUrlChange(e.target.value);
          }}
          placeholder="https://cdn…/meal.jpg"
          className="mt-1 flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none ring-orange-200 focus:ring-2"
        />
        <p className="mt-1 text-xs text-slate-500">
          Paste a CDN URL, or drag a file below. S3 keys under <code className="rounded bg-slate-100 px-1">meals/</code> load via
          admin preview (works for private buckets).
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f?.type.startsWith("image/")) void uploadFile(f);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 transition-colors ${
          drag ? "border-admin-orange bg-orange-50" : "border-slate-200 bg-slate-50 hover:border-orange-200"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          data-testid="meal-image-file-input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadFile(f);
            e.target.value = "";
          }}
        />
        <div className="mb-2 text-3xl">📷</div>
        <p className="text-center text-sm font-medium text-slate-700">
          {uploading ? "Uploading…" : "Drag & drop image here, or click to browse"}
        </p>
        <p className="mt-1 text-center text-xs text-slate-500">JPEG, PNG or WebP · max 5MB · uploaded via API to storage</p>
        {uploadError ? <p className="mt-2 text-center text-sm text-destructive">{uploadError}</p> : null}
      </div>

      {trimmedUrl || previewLoading ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-2">
          {imgSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={imgSrc} alt="Preview" className="mx-auto max-h-56 w-full rounded-2xl object-cover" />
          ) : previewLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading preview from storage…</p>
          ) : previewError ? (
            <p className="py-8 text-center text-sm text-destructive">{previewError}</p>
          ) : mealsKey ? (
            <p className="py-8 text-center text-sm text-slate-500">No preview available.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
