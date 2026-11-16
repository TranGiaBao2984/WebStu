"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  createExpenseAction,
  toggleExpensePaidAction,
  deleteExpenseAction,
} from "@/features/finance/actions";
import type { FinanceMonthReport, ExpenseWithBooking } from "@/features/finance/queries";
import type { BookingListItem } from "@/features/bookings/queries";
import { formatVND, formatVNDInput, parseVNDInput } from "@/lib/money";
import { formatDateVN, getDateKeyHCM } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SCOPE_LABELS: Record<"booking" | "general" | "capex", string> = {
  booking: "Chi phí theo lịch chụp",
  general: "Vận hành chung",
  capex: "Đầu tư thiết bị",
};

export function FinanceClient({
  selectedMonth,
  report,
  expenses,
  bookings,
}: {
  selectedMonth: string; // YYYY-MM
  report: FinanceMonthReport | null;
  expenses: ExpenseWithBooking[];
  bookings: BookingListItem[];
}) {
  const router = useRouter();
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // State thêm chi phí
  const [scope, setScope] = useState<"booking" | "general" | "capex">("general");
  const [bookingId, setBookingId] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState(0);
  const [isPaid, setIsPaid] = useState(true);
  const [paidDate, setPaidDate] = useState(getDateKeyHCM());

  const handleMonthChange = (nextMonth: string) => {
    if (!nextMonth) return;
    router.push(`/finance?month=${nextMonth}`);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setNotice(null);
      const res = await createExpenseAction({
        scope,
        booking_id: scope === "booking" ? bookingId : undefined,
        category,
        amount,
        is_paid: isPaid,
        paid_at: isPaid ? `${paidDate}T12:00:00+07:00` : undefined,
      });

      if (res.error) {
        setNotice({ type: "err", text: res.error });
      } else {
        setCategory("");
        setAmount(0);
        setNotice({ type: "ok", text: "Đã ghi nhận khoản chi phí mới." });
        router.refresh();
      }
    });
  };

  const r = report ?? {
    delivered_sales: 0,
    signed_revenue: 0,
    held_deposit: 0,
    cash_in: 0,
    deposit_in: 0,
    balance_in: 0,
    refund_out: 0,
    cash_out: 0,
    cash_out_booking: 0,
    cash_out_general: 0,
    cogs_delivered: 0,
    gross_profit: 0,
    net_profit: 0,
    customer_debt: 0,
  };

  return (
    <div className="space-y-6">
      {/* Bộ chọn tháng */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div>
          <p className="text-sm font-semibold">Kỳ báo cáo tài chính</p>
          <p className="text-xs text-muted-foreground">
            Doanh thu thực tế chỉ ghi nhận các lịch đã chuyển sang trạng thái Hoàn thành
          </p>
        </div>
        <Input
          type="month"
          className="w-44"
          value={selectedMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
        />
      </div>

      {/* 4 Thẻ chỉ số cốt lõi */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Doanh thu hoàn thành</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-xl font-bold">{formatVND(r.delivered_sales)}</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Giá trị ký mới: {formatVND(r.signed_revenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Thực thu tiền mặt/CK</span>
              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-xl font-bold text-emerald-700">{formatVND(r.cash_in)}</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Cọc: {formatVND(r.deposit_in)} • Tất toán: {formatVND(r.balance_in)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tổng chi phí đã trả</span>
              <ArrowUpRight className="h-4 w-4 text-destructive" />
            </div>
            <p className="mt-2 text-xl font-bold text-destructive">{formatVND(r.cash_out)}</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Hoàn khách: {formatVND(r.refund_out)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Lợi nhuận ròng</span>
              <AlertCircle className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-xl font-bold text-amber-700">
              {formatVND(r.net_profit ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Khách còn nợ: {formatVND(r.customer_debt)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bảng bóc tách P&L chi tiết */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bóc tách dòng tiền & Lợi nhuận tháng {selectedMonth}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="space-y-2 rounded-lg p-3.5 bg-muted/40">
            <p className="font-semibold text-emerald-700">Dòng tiền vào & Công nợ</p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tiền cọc thu trong tháng</span>
              <span className="font-medium">{formatVND(r.deposit_in)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Thanh toán phần còn lại</span>
              <span className="font-medium">{formatVND(r.balance_in)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cọc đang giữ (lịch chưa xong)</span>
              <span className="font-medium">{formatVND(r.held_deposit)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Tổng khách còn nợ</span>
              <span className="text-primary">{formatVND(r.customer_debt)}</span>
            </div>
          </div>

          <div className="space-y-2 rounded-lg p-3.5 bg-muted/40">
            <p className="font-semibold text-destructive">Chi phí & Lợi nhuận</p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chi phí trực tiếp theo lịch</span>
              <span className="font-medium">{formatVND(r.cash_out_booking)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chi phí vận hành chung</span>
              <span className="font-medium">{formatVND(r.cash_out_general)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lợi nhuận gộp</span>
              <span className="font-medium">{formatVND(r.gross_profit ?? 0)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Lợi nhuận ròng</span>
              <span className="text-primary">{formatVND(r.net_profit ?? 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sổ chi phí */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sổ chi phí Studio</CardTitle>
          <CardDescription>
            Ghi nhận chi phí thuê studio, makeup, trang phục, thiết bị hoặc vận hành hàng tháng
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
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

          <form onSubmit={handleAddExpense} className="space-y-3 rounded-lg border bg-muted/40 p-3.5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Nhóm chi phí</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={scope}
                  onChange={(e) => setScope(e.target.value as "booking" | "general" | "capex")}
                >
                  <option value="general">Vận hành chung</option>
                  <option value="booking">Chi phí theo lịch chụp</option>
                  <option value="capex">Đầu tư thiết bị</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Nội dung khoản chi *</Label>
                <Input
                  placeholder="VD: Thuê lens, Makeup, Tiền điện..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Số tiền (VND) *</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  className="tabular-nums"
                  placeholder="0"
                  value={formatVNDInput(amount)}
                  onChange={(e) => setAmount(parseVNDInput(e.target.value))}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {scope === "booking" && (
                  <select
                    className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                  >
                    <option value="">-- Gắn vào lịch hẹn --</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.shortCode} - {b.title}
                      </option>
                    ))}
                  </select>
                )}

                <label className="flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  Đã thanh toán
                </label>

                {isPaid && (
                  <Input
                    type="date"
                    className="h-9 w-40"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                  />
                )}
              </div>

              <Button type="submit" disabled={isPending}>
                <Plus className="mr-1.5 h-4 w-4" />
                Thêm khoản chi
              </Button>
            </div>
          </form>

          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có khoản chi phí nào được ghi nhận.</p>
          ) : (
            <div className="divide-y rounded-lg bg-muted/40">
              {expenses.map((ex) => (
                <div
                  key={ex.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
                >
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{SCOPE_LABELS[ex.scope]}</Badge>
                      <span className="font-semibold">{ex.category}</span>
                      {ex.bookingShortCode && (
                        <span className="font-mono text-xs text-primary">
                          ({ex.bookingShortCode} - {ex.bookingTitle})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ex.is_paid
                        ? `Đã chi ngày ${formatDateVN(ex.paid_at)}`
                        : "Chưa thanh toán (Công nợ phải trả)"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-destructive">-{formatVND(ex.amount)}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await toggleExpensePaidAction(ex.id, !ex.is_paid);
                          router.refresh();
                        })
                      }
                      title={ex.is_paid ? "Đánh dấu chưa trả" : "Đánh dấu đã trả"}
                    >
                      {ex.is_paid ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-600" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteExpenseAction(ex.id);
                          router.refresh();
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
    </div>
  );
}