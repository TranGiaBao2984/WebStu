"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, RefreshCw, Printer, Trash2, Eye, X } from "lucide-react";
import {
  createBookingDocumentAction,
  syncBookingDocumentAction,
  deleteBookingDocumentAction,
} from "@/features/documents/actions";
import type { BookingDocumentRow, DocumentSnapshot } from "@/features/documents/queries";
import type { BookingListItem } from "@/features/bookings/queries";
import { formatVND } from "@/lib/money";
import { formatDateVN, formatTimeVN, formatDateTimeVN } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DocumentsClient({
  documents,
  bookings,
}: {
  documents: BookingDocumentRow[];
  bookings: BookingListItem[];
}) {
  const router = useRouter();
  const [selectedBookingId, setSelectedBookingId] = useState(bookings[0]?.id ?? "");
  const [previewDoc, setPreviewDoc] = useState<BookingDocumentRow | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setNotice(null);
      const res = await createBookingDocumentAction(selectedBookingId);
      if (res.error) {
        setNotice({ type: "err", text: res.error });
      } else {
        setNotice({ type: "ok", text: "Đã xuất Phiếu xác nhận (Snapshot) mới." });
        router.refresh();
      }
    });
  };

  const handleSync = (doc: BookingDocumentRow) => {
    startTransition(async () => {
      setNotice(null);
      const res = await syncBookingDocumentAction(doc.id, doc.booking_id);
      if (res.error) {
        setNotice({ type: "err", text: res.error });
      } else {
        setNotice({ type: "ok", text: `Đã đồng bộ lại dữ liệu mới nhất cho phiếu ${doc.code}.` });
        router.refresh();
      }
    });
  };

  const handleDelete = (doc: BookingDocumentRow) => {
    if (!window.confirm(`Bạn có chắc muốn xóa phiếu xác nhận "${doc.code}" không?`)) return;
    startTransition(async () => {
      setNotice(null);
      const res = await deleteBookingDocumentAction(doc.id);
      if (res.error) {
        setNotice({ type: "err", text: res.error });
      } else {
        if (previewDoc?.id === doc.id) setPreviewDoc(null);
        setNotice({ type: "ok", text: "Đã xóa phiếu xác nhận." });
        router.refresh();
      }
    });
  };

  const activeSnap = previewDoc ? (previewDoc.snapshot as unknown as DocumentSnapshot) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Xuất Phiếu xác nhận dịch vụ (Snapshot)</CardTitle>
          <CardDescription>
            Dữ liệu tên Studio, gói chụp, ca chụp và công nợ tại thời điểm xuất sẽ được đóng băng cố định để gửi cho khách.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row">
            <select
              className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
            >
              <option value="">-- Chọn lịch hẹn cần xuất phiếu --</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.shortCode} • {b.title} — {b.clientName} ({formatVND(b.total_price)})
                </option>
              ))}
            </select>
            <Button type="submit" disabled={isPending || !selectedBookingId}>
              <Plus className="mr-1.5 h-4 w-4" />
              Xuất phiếu xác nhận
            </Button>
          </form>
        </CardContent>
      </Card>

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

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Chưa có phiếu xác nhận nào. Hãy chọn một lịch hẹn phía trên để xuất phiếu đầu tiên.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const snap = doc.snapshot as unknown as DocumentSnapshot;
            return (
              <Card key={doc.id} className="transition-shadow hover:shadow-sm">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-mono text-sm font-bold text-primary">{doc.code}</span>
                      <Badge variant="outline">{snap?.booking?.shortCode}</Badge>
                      <span className="font-semibold">{snap?.booking?.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Khách hàng: <span className="font-medium text-foreground">{snap?.client?.name}</span>
                      {snap?.client?.phone ? ` (${snap.client.phone})` : ""} • Đồng bộ lần cuối:{" "}
                      {formatDateTimeVN(doc.synced_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-2 text-sm font-bold">
                      {formatVND(snap?.financials?.total ?? 0)}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      Xem & In
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleSync(doc)}
                      title="Cập nhật lại số liệu mới nhất từ lịch hẹn"
                    >
                      <RefreshCw className="mr-1 h-3.5 w-3.5" />
                      Đồng bộ
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {previewDoc && activeSnap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-background p-6 shadow-2xl print:static print:max-h-none print:border-none print:shadow-none">
            <div className="mb-4 flex items-center justify-between border-b pb-3 print:hidden">
              <span className="text-sm font-semibold text-muted-foreground">
                Bản xem trước phiếu xác nhận
              </span>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" onClick={() => window.print()}>
                  <Printer className="mr-1.5 h-4 w-4" />
                  In / Lưu PDF
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setPreviewDoc(null)}
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
                    Mã phiếu: {previewDoc.code}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ngày xuất: {formatDateVN(previewDoc.synced_at)}
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
                  {activeSnap.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2">
                      <span>{it.name}</span>
                      <span className="font-semibold">{formatVND(it.amount)}</span>
                    </div>
                  ))}
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
      )}
    </div>
  );
}