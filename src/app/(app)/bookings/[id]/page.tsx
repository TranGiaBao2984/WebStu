import { notFound } from "next/navigation";
import { getBookingDetail } from "@/features/bookings/queries";
import { listServicePackages } from "@/features/settings/queries";
import { BookingDetailClient } from "@/components/bookings/booking-detail-client";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, packages] = await Promise.all([
    getBookingDetail(id),
    listServicePackages(),
  ]);

  if (!detail) {
    notFound();
  }

  return (
    <BookingDetailClient
      detail={detail}
      packages={packages.filter((p) => p.is_active)}
    />
  );
}
