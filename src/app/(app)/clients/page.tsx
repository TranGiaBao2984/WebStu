import { ClientPrivacyPanel } from "@/components/clients/client-privacy-panel";
import { listClientsWithStats } from "@/features/clients/queries";
import { ClientsClient } from "@/components/clients/clients-client";
import { vi } from "@/i18n/vi";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clients = await listClientsWithStats(q);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{vi.clients.title}</h1>
        <p className="text-sm text-muted-foreground">{vi.clients.subtitle}</p>
      </div>
            <ClientPrivacyPanel
        clients={clients.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
        }))}
      />
      <ClientsClient initialClients={clients} initialSearch={q ?? ""} />
    </div>
  );
}
