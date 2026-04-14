import { Leaf } from "lucide-react";

/** Brand mark for splash — replace with logo asset later. */
export function WellnessMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-white/90 shadow-inner ring-2 ring-white/50 ${className}`}
      aria-hidden
    >
      <div className="flex h-[72%] w-[72%] items-center justify-center rounded-full bg-emerald-500/15">
        <Leaf className="h-[55%] w-[55%] text-emerald-600" strokeWidth={2} />
      </div>
    </div>
  );
}
