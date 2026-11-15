"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Calendar, Phone, Trash2 } from "lucide-react";
import { BOOKING_STATUSES } from "@/features/bookings/schema";
import { deleteBookingAction } from "@/features/bookings/actions";
import type { BookingListItem } from "@/features/bookings/queries";
import { BookingStatusBadge } from "./status-badge";
import { formatVND } from "@/lib/money";
import { formatDateTimeVN } from "@/lib/date";
import { vi } from "@/i18n/vi";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function BookingsListClient({
  initialBookings,
  activeStatus,
  initialSearch,
}: {
  initialBookings: BookingListItem[];
  activeStatus: string;
  initialSearch: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const navigateFilter = (status: string, q: string) => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    router.push(`/bookings?${params.toString()}`);
  };

  const handleDeleteBooking = (e: React.MouseEvent, b: BookingListItem) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !window.confirm(
        `Bạn có chắc muốn xóa lịch hẹn "${b.shortCode} - ${b.title}" không? Dữ liệu ca chụp và thanh toán của lịch này cũng sẽ bị xóa.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      setNotice(null);
      const res = await deleteBookingAction(b.id);
      if (res.error) {
        setNotice({ type: "err", text: res.error });
      } else {
        setNotice({ type: "ok", text: vi.bookings.deleted });
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigateFilter(activeStatus, search);
          }}
          className="flex flex-1 gap-2 sm:max-w-md"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={vi.bookings.searchPlaceholder}
            />
          </div>
          <Button type="submit" variant="secondary">
            Tìm
          </Button>
        </form>

        <Link href="/bookings/new" className={buttonVariants()}>
          <Plus className="mr-1.5 h-4 w-4" />
          {vi.bookings.newBooking}
        </Link>
      </div>

      {notice && (
        <div
          className={
            notice.type === "ok"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800"
              : "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
          }
        >
          {notice.text}
        </div>
      )}

      {/* Bộ lọc 9 trạng thái cuộn ngang tốt trên điện thoại */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <Button
          type="button"
          size="sm"
          variant={activeStatus === "all" ? "default" : "outline"}
          onClick={() => navigateFilter("all", search)}
        >
          {vi.common.all}
        </Button>
        {BOOKING_STATUSES.map((st) => (
          <Button
            key={st}
            type="button"
            size="sm"
            variant={activeStatus === st ? "default" : "outline"}
            onClick={() => navigateFilter(st, search)}
          >
            {vi.bookings.statuses[st]}
          </Button>
        ))}
      </div>

      {initialBookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {vi.bookings.empty}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {initialBookings.map((b) => (
            <Link key={b.id} href={`/bookings/${b.id}`} className="block">
              <Card className="transition-all hover:border-primary/50 hover:shadow-sm">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {b.shortCode}
                      </span>
                      <BookingStatusBadge status={b.status} />
                      <span className="font-semibold">{b.title}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{b.clientName}</span>
                      {b.clientPhone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {b.clientPhone}
                        </span>
                      )}
                      {b.nextSessionStart && (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Calendar className="h-3 w-3" />
                          {formatDateTimeVN(b.nextSessionStart)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t pt-2.5 sm:border-t-0 sm:pt-0 sm:text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Đã trả {formatVND(b.paid)} ({b.paidPercent}%)
                      </p>
                      <p className="text-sm font-bold">{formatVND(b.total_price)}</p>
                    </div>
                    <div className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
                      Còn: {formatVND(b.remaining)}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={isPending}
                      onClick={(e) => handleDeleteBooking(e, b)}
                      aria-label="Xóa lịch hẹn"
                      title="Xóa lịch hẹn"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}