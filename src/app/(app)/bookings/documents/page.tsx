import { listBookingDocuments } from "@/features/documents/queries";
import { listBookings } from "@/features/bookings/queries";
import { DocumentsClient } from "@/components/bookings/documents-client";
import { vi } from "@/i18n/vi";

export default async function BookingDocumentsPage() {
  const [documents, bookings] = await Promise.all([
    listBookingDocuments(),
    listBookings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{vi.nav.documents}</h1>
        <p className="text-sm text-muted-foreground">
          Xuất và quản lý các bản Phiếu xác nhận dịch vụ cố định (snapshot) gửi khách hàng
        </p>
      </div>

      <DocumentsClient documents={documents} bookings={bookings} />
    </div>
  );
}