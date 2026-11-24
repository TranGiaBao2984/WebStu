import { AppShell } from "@/components/layout/app-shell";
import { getStudioSettings } from "@/features/settings/queries";
import { vi } from "@/i18n/vi";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const studioNamePromise = getStudioSettings()
    .then((s) => s?.studio_name ?? vi.common.appName)
    .catch(() => vi.common.appName);

  return <AppShell studioNamePromise={studioNamePromise}>{children}</AppShell>;
}