"use client";

import { Button } from "@fitmeals/ui";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8">
      <p className="text-destructive">{error.message}</p>
      <Button className="mt-4" type="button" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}
