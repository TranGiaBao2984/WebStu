import { listBookings } from "@/features/bookings/queries";
import { BookingsListClient } from "@/components/bookings/bookings-list-client";
import { vi } from "@/i18n/vi";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const activeStatus = status ?? "all";
  const bookings = await listBookings({ status: activeStatus, search: q });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{vi.bookings.title}</h1>
        <p className="text-sm text-muted-foreground">{vi.bookings.subtitle}</p>
      </div>
      <BookingsListClient
        initialBookings={bookings}
        activeStatus={activeStatus}
        initialSearch={q ?? ""}
      />
    </div>
  );
}
