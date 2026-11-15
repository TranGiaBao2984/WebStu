import { vi } from "@/i18n/vi";

export default function LoadingPage() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      {vi.common.loading}
    </div>
  );
}
