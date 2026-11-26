"use client";

import { Printer, RefreshCw, X } from "lucide-react";
import type { BookingDocumentRow, DocumentSnapshot } from "@/features/documents/queries";
import { formatVND } from "@/lib/money";
import { formatDateVN, formatTimeVN } from "@/lib/date";
import { Button } from "@/components/ui/button";

export function BookingDocumentModal({
  document,
  isPending,
  onSync,
  onClose,
}: {
  document: BookingDocumentRow;
  isPending: boolean;
  onSync: () => void;
  onClose: () => void;
}) {
  const activeSnap = document.snapshot as unknown as DocumentSnapshot;
  if (!activeSnap) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs print:static print:bg-transparent print:p-0"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-background p-6 shadow-2xl print:max-h-none print:w-full print:max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b pb-3 print:hidden">
          <span className="text-sm font-semibold text-muted-foreground">
            Phiếu xác nhận dịch vụ • {activeSnap.client?.name}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={onSync}
              title="Cập nhật lại số liệu mới nhất từ lịch hẹn"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
              Đồng bộ mới nhất
            </Button>
            <Button type="button" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" />
              In / Lưu PDF
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onClose}
              aria-label="Đóng phiếu xác nhận"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-5 text-sm">
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight">
                {activeSnap.studio.name}
              </h2>
              {activeSnap.studio.phone && (
                <p className="text-xs text-muted-foreground">
                  Hotline: {activeSnap.studio.phone}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-primary">PHIẾU XÁC NHẬN DỊCH VỤ</p>
              <p className="font-mono text-xs text-muted-foreground">
                Mã phiếu: {document.code}
              </p>
              <p className="text-xs text-muted-foreground">
                Ngày xuất: {formatDateVN(document.synced_at)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg bg-muted/50 p-3.5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Khách hàng</p>
              <p className="font-semibold">{activeSnap.client.name}</p>
              <p className="text-xs">{activeSnap.client.phone || "Chưa có SĐT"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Buổi chụp</p>
              <p className="font-semibold">
                {activeSnap.booking.shortCode} — {activeSnap.booking.title}
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Thời gian & Địa điểm chụp
            </h3>
            {activeSnap.sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">Chưa ấn định khung giờ cụ thể.</p>
            ) : (
              <div className="space-y-1.5">
                {activeSnap.sessions.map((s, idx) => (
                  <div key={idx} className="rounded-md border px-3 py-2 text-xs">
                    <span className="font-semibold">
                      {formatDateVN(s.startIso)} ({formatTimeVN(s.startIso)} –{" "}
                      {formatTimeVN(s.endIso)})
                    </span>
                    {s.location ? ` • Địa điểm: ${s.location}` : ""}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              2. Hạng mục dịch vụ & Chi phí
            </h3>
            <div className="divide-y rounded-lg border">
              {activeSnap.items.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  Chưa có hạng mục dịch vụ chi tiết.
                </div>
              ) : (
                activeSnap.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2">
                    <span>{it.name}</span>
                    <span className="font-semibold">{formatVND(it.amount)}</span>
                  </div>
                ))
              )}
              <div className="flex items-center justify-between bg-muted/40 px-3 py-2 font-bold">
                <span>Tổng cộng</span>
                <span>{formatVND(activeSnap.financials.total)}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 text-emerald-700">
                <span>Đã thanh toán / Cọc</span>
                <span className="font-semibold">{formatVND(activeSnap.financials.paid)}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 font-bold text-primary">
                <span>Số tiền còn lại</span>
                <span>{formatVND(activeSnap.financials.remaining)}</span>
              </div>
            </div>
          </div>

          {activeSnap.booking.note && (
            <div>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                3. Ghi chú buổi chụp
              </h3>
              <p className="rounded-md border bg-muted/30 p-2.5 text-xs">
                {activeSnap.booking.note}
              </p>
            </div>
          )}

          {activeSnap.studio.doc_footer && (
            <div className="border-t pt-3 text-center text-xs italic text-muted-foreground">
              {activeSnap.studio.doc_footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}