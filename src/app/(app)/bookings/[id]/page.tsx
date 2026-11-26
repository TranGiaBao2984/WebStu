import { notFound } from "next/navigation";
import { getBookingDetail } from "@/features/bookings/queries";
import { listServicePackages } from "@/features/settings/queries";
import { listBookingDocumentsByBookingId } from "@/features/documents/queries";
import { BookingDetailClient } from "@/components/bookings/booking-detail-client";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, packages, documents] = await Promise.all([
    getBookingDetail(id),
    listServicePackages(),
    listBookingDocumentsByBookingId(id),
  ]);

  if (!detail) {
    notFound();
  }

  return (
    <BookingDetailClient
      detail={detail}
      packages={packages.filter((p) => p.is_active)}
      documents={documents}
    />
  );
}