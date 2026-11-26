"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Calendar, Phone, Trash2, FileText } from "lucide-react";
import { BOOKING_STATUSES } from "@/features/bookings/schema";
import { deleteBookingAction } from "@/features/bookings/actions";
import {
  openOrCreateBookingDocumentAction,
  syncBookingDocumentAction,
} from "@/features/documents/actions";
import type { BookingListItem } from "@/features/bookings/queries";
import type { BookingDocumentRow } from "@/features/documents/queries";
import { BookingDocumentModal } from "./booking-document-modal";
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
  documents = [],
}: {
  initialBookings: BookingListItem[];
  activeStatus: string;
  initialSearch: string;
  documents?: BookingDocumentRow[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [activeDoc, setActiveDoc] = useState<BookingDocumentRow | null>(null);
  const [openingBookingId, setOpeningBookingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const docsByBookingId = useMemo(() => {
    const map = new Map<string, BookingDocumentRow>();
    for (const d of documents) {
      if (!map.has(d.booking_id)) {
        map.set(d.booking_id, d);
      }
    }
    return map;
  }, [documents]);

  const navigateFilter = (status: string, q: string) => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    const qs = params.toString();
    router.push(qs ? `/bookings?${qs}` : "/bookings");
  };

  const handleOpenDocument = (e: React.MouseEvent, b: BookingListItem) => {
    e.preventDefault();
    e.stopPropagation();

    const cached = docsByBookingId.get(b.id);
    if (cached) {
      setActiveDoc(cached);
      return;
    }

    setOpeningBookingId(b.id);
    startTransition(async () => {
      setNotice(null);
      const res = await openOrCreateBookingDocumentAction(b.id);
      setOpeningBookingId(null);
      if (res.error) {
        setNotice({ type: "err", text: res.error });
      } else if (res.document) {
        setActiveDoc(res.document);
        router.refresh();
      }
    });
  };

  const handleSyncActiveDocument = () => {
    if (!activeDoc) return;
    startTransition(async () => {
      setNotice(null);
      const res = await syncBookingDocumentAction(activeDoc.id, activeDoc.booking_id);
      if (res.error) {
        setNotice({ type: "err", text: res.error });
      } else if (res.document) {
        setActiveDoc(res.document);
        router.refresh();
      }
    });
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

                  <div className="flex flex-wrap items-center justify-between gap-2.5 border-t pt-2.5 sm:justify-end sm:border-t-0 sm:pt-0 sm:text-right">
                    <div className="mr-1">
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
                      size="sm"
                      variant="outline"
                      disabled={isPending && openingBookingId === b.id}
                      onClick={(e) => handleOpenDocument(e, b)}
                      className="h-8 gap-1.5 px-2.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>
                        {isPending && openingBookingId === b.id
                          ? "Đang mở..."
                          : "Phiếu xác nhận"}
                      </span>
                    </Button>

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

      {activeDoc && (
        <BookingDocumentModal
          document={activeDoc}
          isPending={isPending}
          onSync={handleSyncActiveDocument}
          onClose={() => setActiveDoc(null)}
        />
      )}
    </div>
  );
}