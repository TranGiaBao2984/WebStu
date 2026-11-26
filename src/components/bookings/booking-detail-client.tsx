"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, CalendarClock, Wallet, Package, FileText, Eye, RefreshCw, Printer, X } from "lucide-react";
import {
  openOrCreateBookingDocumentAction,
  createBookingDocumentAction,
  syncBookingDocumentAction,
  deleteBookingDocumentAction,
} from "@/features/documents/actions";
import type { BookingDocumentRow, DocumentSnapshot } from "@/features/documents/queries";
import { BOOKING_STATUSES, type BookingStatusValue } from "@/features/bookings/schema";
import {
  deleteBookingAction,
  updateBookingStatusAction,
  updateBookingInfoAction,
  addBookingItemAction,
  deleteBookingItemAction,
  addBookingSessionAction,
  deleteBookingSessionAction,
  addPaymentAction,
  deletePaymentAction,
} from "@/features/bookings/actions";
import type { BookingDetailData } from "@/features/bookings/queries";
import type { ServicePackageRow } from "@/features/settings/queries";
import { BookingStatusBadge } from "./status-badge";
import { formatVND, formatVNDInput, parseVNDInput } from "@/lib/money";
import { formatDateVN, formatTimeVN, formatDateTimeVN, getDateKeyHCM } from "@/lib/date";
import { vi } from "@/i18n/vi";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function BookingDetailClient({
  detail,
  packages,
  documents = [],
}: {
  detail: BookingDetailData;
  packages: ServicePackageRow[];
  documents?: BookingDocumentRow[];
}) {
  const [previewDoc, setPreviewDoc] = useState<BookingDocumentRow | null>(null);
  const router = useRouter();
  const { booking, shortCode, client, items, sessions, payments, financials } = detail;
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // State thông tin chung
  const [title, setTitle] = useState(booking.title);
  const [note, setNote] = useState(booking.note ?? "");

  // State thêm hạng mục
  const [itemKind, setItemKind] = useState<"package" | "custom" | "surcharge">("package");
  const [selectedPkgId, setSelectedPkgId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemAmount, setItemAmount] = useState(0);

  // State thêm ca chụp
  const [sessDate, setSessDate] = useState(getDateKeyHCM());
  const [sessStart, setSessStart] = useState("14:00");
  const [sessEnd, setSessEnd] = useState("16:00");
  const [sessLocation, setSessLocation] = useState("");
  const [sessCrew, setSessCrew] = useState("");

  // State thêm thanh toán
  const [payKind, setPayKind] = useState<"deposit" | "balance" | "refund">("balance");
  const [payAmount, setPayAmount] = useState(Math.max(0, financials.remaining));
  const [payMethod, setPayMethod] = useState("Chuyển khoản");

  const handleQuickOpenDocument = () => {
    if (documents.length > 0) {
      setPreviewDoc(documents[0]);
      return;
    }
    startTransition(async () => {
      setNotice(null);
      const res = await openOrCreateBookingDocumentAction(booking.id);
      if (res.error) {
        setNotice({ type: "err", text: res.error });
      } else if (res.document) {
        setPreviewDoc(res.document);
        router.refresh();
      }
    });
  };

  const handleDeleteBooking = () => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa lịch hẹn "${shortCode} - ${booking.title}" không? Dữ liệu ca chụp và thanh toán của lịch này cũng sẽ bị xóa.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      setNotice(null);
      const res = await deleteBookingAction(booking.id);
      if (res.error) {
        setNotice({ type: "err", text: res.error });
      } else {
        router.push("/bookings");
        router.refresh();
      }
    });
  };

  const handleStatusChange = (nextStatus: BookingStatusValue) => {
    startTransition(async () => {
      setNotice(null);
      const res = await updateBookingStatusAction(booking.id, nextStatus);
      if (res.error) setNotice({ type: "err", text: res.error });
      else setNotice({ type: "ok", text: vi.bookings.detail.updatedStatus });
    });
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setNotice(null);
      const res = await updateBookingInfoAction(booking.id, { title, note });
      if (res.error) setNotice({ type: "err", text: res.error });
      else setNotice({ type: "ok", text: vi.bookings.detail.savedInfo });
    });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setNotice(null);
      const res = await addBookingItemAction(booking.id, {
        kind: itemKind,
        package_id: itemKind === "package" ? selectedPkgId : "",
        name: itemName,
        amount: Number(itemAmount),
      });
      if (res.error) {
        setNotice({ type: "err", text: res.error });
      } else {
        setItemName("");
        setItemAmount(0);
        setSelectedPkgId("");
        setNotice({ type: "ok", text: vi.bookings.detail.addedItem });
      }
    });
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setNotice(null);
      const res = await addBookingSessionAction(booking.id, {
        session_date: sessDate,
        start_time: sessStart,
        end_time: sessEnd,
        location: sessLocation,
        crew_note: sessCrew,
      });
      if (res.error) {
        setNotice({ type: "err", text: res.error });
      } else {
        setSessLocation("");
        setSessCrew("");
        setNotice({ type: "ok", text: vi.bookings.detail.addedSession });
      }
    });
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setNotice(null);
      const res = await addPaymentAction(booking.id, {
        kind: payKind,
        amount: Number(payAmount),
        method: payMethod,
      });
      if (res.error) {
        setNotice({ type: "err", text: res.error });
      } else {
        setPayAmount(0);
        setNotice({ type: "ok", text: vi.bookings.detail.addedPayment });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/bookings" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {vi.common.back}
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary">{shortCode}</span>
              <BookingStatusBadge status={booking.status} />
            </div>
            <h1 className="text-xl font-bold sm:text-2xl">{booking.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {client && (
            <div className="text-sm text-muted-foreground">
              Khách hàng: <span className="font-semibold text-foreground">{client.name}</span>
              {client.phone ? ` — ${client.phone}` : ""}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleQuickOpenDocument()}
            className="border-primary/30 text-primary hover:bg-primary/10"
          >
            <FileText className="mr-1.5 h-4 w-4" />
            Phiếu xác nhận
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleDeleteBooking}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Xóa lịch hẹn
          </Button>
        </div>
      </div>

      {notice && (
        <div
          className={
            notice.type === "ok"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
              : "rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
          }
        >
          {notice.text}
        </div>
      )}

      {/* 1. Thanh chọn 9 trạng thái */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{vi.bookings.detail.statusSection}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {BOOKING_STATUSES.map((st) => (
              <Button
                key={st}
                type="button"
                size="sm"
                disabled={isPending}
                variant={booking.status === st ? "default" : "outline"}
                onClick={() => handleStatusChange(st)}
              >
                {vi.bookings.statuses[st]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. Tổng quan Thanh toán (Ví dụ 810.000 / 500.000 -> 62%, còn 310.000) */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-primary" />
            <span>{vi.bookings.detail.paymentsSection}</span>
          </CardTitle>
          <CardDescription>{vi.bookings.detail.revenueNote}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-3 gap-3 rounded-xl bg-muted/60 p-4 text-center">
            <div>
              <span className="block text-xs text-muted-foreground">
                {vi.bookings.detail.totalLabel}
              </span>
              <span className="text-base font-bold sm:text-lg">
                {formatVND(financials.total)}
              </span>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground">
                {vi.bookings.detail.paidLabel} ({financials.paidPercent}%)
              </span>
              <span className="text-base font-bold text-emerald-700 sm:text-lg">
                {formatVND(financials.paid)}
              </span>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground">
                {vi.bookings.detail.remainingLabel}
              </span>
              <span className="text-base font-bold text-primary sm:text-lg">
                {formatVND(financials.remaining)}
              </span>
            </div>
          </div>

          <form
            onSubmit={handleAddPayment}
            className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[160px_1fr_160px_auto]"
          >
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={payKind}
              onChange={(e) => setPayKind(e.target.value as "deposit" | "balance" | "refund")}
            >
              <option value="deposit">{vi.bookings.detail.paymentKinds.deposit}</option>
              <option value="balance">{vi.bookings.detail.paymentKinds.balance}</option>
              <option value="refund">{vi.bookings.detail.paymentKinds.refund}</option>
            </select>

            <Input
              type="text"
              inputMode="numeric"
              className="tabular-nums"
              placeholder="Số tiền VND"
              value={formatVNDInput(payAmount)}
              onChange={(e) => setPayAmount(parseVNDInput(e.target.value))}
            />

            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
            >
              {vi.bookings.form.methods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <Button type="submit" disabled={isPending}>
              <Plus className="mr-1 h-4 w-4" />
              Ghi nhận
            </Button>
          </form>

          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{vi.bookings.detail.noPayments}</p>
          ) : (
            <div className="divide-y rounded-lg bg-muted/40">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                  <div>
                    <Badge variant={p.kind === "refund" ? "destructive" : "secondary"}>
                      {vi.bookings.detail.paymentKinds[p.kind]}
                    </Badge>
                    <span className="ml-2 font-semibold">
                      {p.kind === "refund" ? "-" : "+"}
                      {formatVND(p.amount)}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({p.method || "—"} • {formatDateTimeVN(p.paid_at)})
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await deletePaymentAction(booking.id, p.id);
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Các ca chụp (Chống trùng giờ) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4 text-primary" />
            <span>{vi.bookings.detail.sessionsSection}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddSession} className="space-y-3 rounded-lg border bg-muted/40 p-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">{vi.bookings.form.sessionDate}</Label>
                <Input type="date" value={sessDate} onChange={(e) => setSessDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{vi.bookings.form.startTime}</Label>
                <Input type="time" value={sessStart} onChange={(e) => setSessStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{vi.bookings.form.endTime}</Label>
                <Input type="time" value={sessEnd} onChange={(e) => setSessEnd(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                placeholder={vi.bookings.form.locationPlaceholder}
                value={sessLocation}
                onChange={(e) => setSessLocation(e.target.value)}
              />
              <Input
                placeholder={vi.bookings.form.crewNotePlaceholder}
                value={sessCrew}
                onChange={(e) => setSessCrew(e.target.value)}
              />
              <Button type="submit" disabled={isPending}>
                <Plus className="mr-1 h-4 w-4" />
                Thêm ca
              </Button>
            </div>
          </form>

          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{vi.bookings.detail.noSessions}</p>
          ) : (
            <div className="divide-y rounded-lg bg-muted/40">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-primary">
                      {formatDateVN(s.startIso)} • {formatTimeVN(s.startIso)} –{" "}
                      {formatTimeVN(s.endIso)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.location || "Chưa ghi địa điểm"}
                      {s.crew_note ? ` • Ê-kíp: ${s.crew_note}` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await deleteBookingSessionAction(booking.id, s.id);
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Hạng mục dịch vụ & Phụ thu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-primary" />
            <span>{vi.bookings.detail.itemsSection}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handleAddItem}
            className="grid gap-3 rounded-lg border bg-muted/40 p-3 sm:grid-cols-[140px_1fr_150px_auto]"
          >
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={itemKind}
              onChange={(e) => {
                const k = e.target.value as "package" | "custom" | "surcharge";
                setItemKind(k);
                setSelectedPkgId("");
                setItemName("");
                setItemAmount(0);
              }}
            >
              <option value="package">{vi.bookings.detail.itemKinds.package}</option>
              <option value="custom">{vi.bookings.detail.itemKinds.custom}</option>
              <option value="surcharge">{vi.bookings.detail.itemKinds.surcharge}</option>
            </select>

            {itemKind === "package" ? (
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={selectedPkgId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedPkgId(id);
                  const found = packages.find((p) => p.id === id);
                  if (found) {
                    setItemName(found.name);
                    setItemAmount(Number(found.price));
                  }
                }}
              >
                <option value="">-- Chọn gói dịch vụ --</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatVND(p.price)})
                  </option>
                ))}
              </select>
            ) : (
              <Input
                placeholder="Tên dịch vụ / phụ thu..."
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            )}

            <Input
              type="text"
              inputMode="numeric"
              className="tabular-nums"
              placeholder="Số tiền VND"
              value={formatVNDInput(itemAmount)}
              onChange={(e) => setItemAmount(parseVNDInput(e.target.value))}
            />

            <Button type="submit" disabled={isPending}>
              <Plus className="mr-1 h-4 w-4" />
              Thêm
            </Button>
          </form>

          {items.length > 0 && (
            <div className="divide-y rounded-lg bg-muted/40">
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                  <div>
                    <Badge variant="outline" className="mr-2">
                      {vi.bookings.detail.itemKinds[it.kind as "package" | "custom" | "surcharge"] ??
                        it.kind}
                    </Badge>
                    <span className="font-medium">{it.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatVND(it.amount)}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteBookingItemAction(booking.id, it.id);
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Phiếu xác nhận dịch vụ (Snapshot) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              <span>Phiếu xác nhận dịch vụ</span>
            </CardTitle>
            <CardDescription>
              Xuất và in phiếu báo giá / xác nhận lịch chụp cố định cho lịch hẹn này
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                setNotice(null);
                const res = await createBookingDocumentAction(booking.id);
                if (res.error) setNotice({ type: "err", text: res.error });
                else {
                  setNotice({ type: "ok", text: "Đã xuất Phiếu xác nhận mới cho lịch hẹn này." });
                  router.refresh();
                }
              })
            }
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Xuất phiếu mới
          </Button>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có phiếu xác nhận nào cho lịch này. Bấm &ldquo;Xuất phiếu mới&rdquo; để tạo.
            </p>
          ) : (
            <div className="space-y-2.5">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3 text-sm"
                >
                  <div>
                    <span className="font-mono font-bold text-primary">{doc.code}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      Cập nhật: {formatDateTimeVN(doc.synced_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
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
                      onClick={() =>
                        startTransition(async () => {
                          setNotice(null);
                          const res = await syncBookingDocumentAction(doc.id, doc.booking_id);
                          if (res.error) setNotice({ type: "err", text: res.error });
                          else {
                            setNotice({ type: "ok", text: `Đã đồng bộ phiếu ${doc.code}.` });
                            router.refresh();
                          }
                        })
                      }
                    >
                      <RefreshCw className="mr-1 h-3.5 w-3.5" />
                      Đồng bộ
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => {
                        if (!window.confirm(`Xóa phiếu xác nhận "${doc.code}"?`)) return;
                        startTransition(async () => {
                          const res = await deleteBookingDocumentAction(doc.id);
                          if (res.error) setNotice({ type: "err", text: res.error });
                          else {
                            if (previewDoc?.id === doc.id) setPreviewDoc(null);
                            setNotice({ type: "ok", text: "Đã xóa phiếu xác nhận." });
                            router.refresh();
                          }
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {previewDoc && (() => {
        const activeSnap = previewDoc.snapshot as unknown as DocumentSnapshot;
        return (
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
        );
      })()}

      {/* 6. Thông tin chung */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{vi.bookings.detail.infoSection}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveInfo} className="space-y-3">
            <div className="space-y-1">
              <Label>{vi.bookings.form.bookingTitle}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{vi.common.note}</Label>
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <Button type="submit" variant="secondary" disabled={isPending}>
              {vi.common.save}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}