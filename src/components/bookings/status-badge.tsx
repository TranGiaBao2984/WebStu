import { Badge } from "@/components/ui/badge";
import { vi } from "@/i18n/vi";
import type { BookingStatusValue } from "@/features/bookings/schema";

const STATUS_STYLES: Record<BookingStatusValue, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-sky-100 text-sky-800 border-sky-200",
  shooting: "bg-purple-100 text-purple-800 border-purple-200",
  selecting: "bg-indigo-100 text-indigo-800 border-indigo-200",
  selected: "bg-blue-100 text-blue-800 border-blue-200",
  retouching: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  retouched: "bg-teal-100 text-teal-800 border-teal-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
};

export function BookingStatusBadge({ status }: { status: BookingStatusValue }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status]}>
      {vi.bookings.statuses[status]}
    </Badge>
  );
}
