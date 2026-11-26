import { listBookings } from "@/features/bookings/queries";
import { listBookingDocuments } from "@/features/documents/queries";
import { BookingsListClient } from "@/components/bookings/bookings-list-client";
import { vi } from "@/i18n/vi";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; tab?: string }>;
}) {
  const { status, q, tab } = await searchParams;
  const activeStatus = status ?? "all";
  const hasFilter = activeStatus !== "all" || Boolean(q?.trim());

  const [bookings, allBookings, documents] = await Promise.all([
    listBookings({ status: activeStatus, search: q }),
    hasFilter ? listBookings() : Promise.resolve(undefined),
    listBookingDocuments(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý đặt lịch</h1>
        <p className="text-sm text-muted-foreground">{vi.bookings.subtitle}</p>
      </div>
      <BookingsListClient
        initialBookings={bookings}
        activeStatus={activeStatus}
        initialSearch={q ?? ""}
        documents={documents}
        allBookings={allBookings ?? bookings}
        initialTab={tab === "documents" ? "documents" : "bookings"}
      />
    </div>
  );
}