import { getStudioSettings, listServicePackages } from "@/features/settings/queries";
import { SettingsClient } from "@/components/settings/settings-client";
import { vi } from "@/i18n/vi";

export default async function SettingsPage() {
  const [settings, packages] = await Promise.all([
    getStudioSettings(),
    listServicePackages(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{vi.settings.title}</h1>
        <p className="text-sm text-muted-foreground">{vi.settings.subtitle}</p>
      </div>
      <SettingsClient initialSettings={settings} initialPackages={packages} />
    </div>
  );
}
