"use client";

import { Button } from "@/components/ui/button";
import { vi } from "@/i18n/vi";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm font-medium text-destructive">{error.message || vi.common.errorGeneric}</p>
      <Button variant="outline" onClick={reset}>
        {vi.common.retry}
      </Button>
    </div>
  );
}
