"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@fitmeals/ui";
import { X } from "lucide-react";

export function AdminSlideOver({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const [portalRoot, setPortalRoot] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  // Lock body scroll when open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Close on escape
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const panel = (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close panel"
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-[70] flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </>
  );

  if (!portalRoot) return null;
  return createPortal(panel, portalRoot);
}
