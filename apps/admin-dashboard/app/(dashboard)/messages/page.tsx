import { Suspense } from "react";
import { MessagesContent } from "./messages-content";

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading messages…</div>}>
      <MessagesContent />
    </Suspense>
  );
}
