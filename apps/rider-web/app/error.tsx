"use client";

import { Button } from "@fitmeals/ui";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6">
      <p className="text-destructive">{error.message}</p>
      <Button type="button" className="mt-4" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}
