import { AppShell } from "@/components/layout/app-shell";
import { getStudioSettings } from "@/features/settings/queries";
import { vi } from "@/i18n/vi";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getStudioSettings();
  const studioName = settings?.studio_name ?? vi.common.appName;

  return <AppShell studioName={studioName}>{children}</AppShell>;
}
