import { redirect } from "next/navigation";

export default function BookingDocumentsPage() {
  redirect("/bookings?tab=documents");
}