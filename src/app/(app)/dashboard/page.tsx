import Link from "next/link";
import {
  Plus,
  CalendarClock,
  MapPin,
  TrendingUp,
  ArrowDownLeft,
  Wallet,
  Images,
} from "lucide-react";
import { getDashboardSummary } from "@/features/dashboard/queries";
import { formatVND } from "@/lib/money";
import {
  formatDateVN,
  formatTimeVN,
  getDateKeyHCM,
  getCurrentMonthStartHCM,
} from "@/lib/date";
import { vi } from "@/i18n/vi";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const monthStart = getCurrentMonthStartHCM();
  const currentMonthLabel = monthStart.slice(0, 7);
  const todayKey = getDateKeyHCM();

  const { bookings, upcomingSessions, financeReport, albumsWaitingCount } =
    await getDashboardSummary(monthStart, todayKey);

  const report = financeReport ?? {
    delivered_sales: 0,
    cash_in: 0,
    customer_debt: 0,
    net_profit: 0,
  };

  const columns = [
    {
      key: "pending",
      title: vi.dashboard.columns.pending,
      items: bookings.filter((b) => b.status === "pending"),
    },
    {
      key: "confirmed",
      title: vi.dashboard.columns.confirmed,
      items: bookings.filter((b) => b.status === "confirmed"),
    },
    {
      key: "shooting",
      title: vi.dashboard.columns.shooting,
      items: bookings.filter((b) => b.status === "shooting"),
    },
    {
      key: "postProduction",
      title: vi.dashboard.columns.postProduction,
      items: bookings.filter((b) =>
        ["selecting", "selected", "retouching", "retouched"].includes(b.status)
      ),
    },
    {
      key: "completed",
      title: vi.dashboard.columns.completed,
      items: bookings.filter((b) => b.status === "completed"),
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{vi.dashboard.title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{vi.dashboard.subtitle}</p>
        </div>
        <Link href="/bookings/new" className={`${buttonVariants()} w-full sm:w-auto justify-center`}>
          <Plus className="mr-1.5 h-4 w-4" />
          {vi.bookings.newBooking}
        </Link>
      </div>

      {/* 4 Thẻ chỉ số nhanh */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Link href="/finance" className="block">
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-muted-foreground">
                <span className="truncate">Doanh thu {currentMonthLabel}</span>
                <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
              </div>
              <p className="mt-1.5 sm:mt-2 text-base sm:text-xl font-bold truncate">
                {formatVND(report.delivered_sales)}
              </p>
              <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground truncate">
                Lãi ròng: {formatVND(report.net_profit ?? 0)}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/finance" className="block">
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-muted-foreground">
                <span className="truncate">Thực thu {currentMonthLabel}</span>
                <ArrowDownLeft className="h-4 w-4 shrink-0 text-emerald-600" />
              </div>
              <p className="mt-1.5 sm:mt-2 text-base sm:text-xl font-bold text-emerald-700 truncate">
                {formatVND(report.cash_in)}
              </p>
              <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground truncate">
                Tiền cọc & tất toán
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/bookings" className="block">
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-muted-foreground">
                <span className="truncate">Khách còn nợ</span>
                <Wallet className="h-4 w-4 shrink-0 text-amber-600" />
              </div>
              <p className="mt-1.5 sm:mt-2 text-base sm:text-xl font-bold text-amber-700 truncate">
                {formatVND(report.customer_debt)}
              </p>
              <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground truncate">
                Lịch chưa hủy
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/albums" className="block">
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-muted-foreground">
                <span className="truncate">Album hậu kỳ</span>
                <Images className="h-4 w-4 shrink-0 text-primary" />
              </div>
              <p className="mt-1.5 sm:mt-2 text-base sm:text-xl font-bold">
                {albumsWaitingCount} album
              </p>
              <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground truncate">
                Chờ/đang retouch
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Ca chụp hôm nay & sắp tới */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4 text-primary" />
            <span>{vi.dashboard.upcomingTitle}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2">
          {upcomingSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{vi.dashboard.upcomingEmpty}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingSessions.map((s) => {
                const isToday = getDateKeyHCM(s.startIso) === todayKey;
                return (
                  <Link
                    key={s.id}
                    href={`/bookings/${s.bookingId}`}
                    className={`rounded-lg border p-3 transition-colors hover:border-primary/50 ${
                      isToday ? "border-primary/40 bg-primary/5" : "bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-xs font-semibold text-primary">
                      <span className="flex items-center gap-1.5 truncate">
                        {isToday && (
                          <Badge className="px-1.5 py-0 text-[10px] shrink-0">Hôm nay</Badge>
                        )}
                        <span className="truncate">
                          {formatDateVN(s.startIso)} • {formatTimeVN(s.startIso)} –{" "}
                          {formatTimeVN(s.endIso)}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono">{s.shortCode}</span>
                    </div>
                    <p className="mt-1.5 font-semibold text-sm sm:text-base truncate">{s.bookingTitle}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.clientName}</p>
                    {s.location && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{s.location}</span>
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bảng 5 cột tiến độ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{vi.dashboard.pipelineTitle}</h2>
          <span className="text-[11px] text-muted-foreground xl:hidden">
            Vuốt ngang để xem các cột →
          </span>
        </div>

        <div className="flex gap-3.5 overflow-x-auto pb-2 snap-x snap-mandatory xl:grid xl:grid-cols-5 xl:overflow-visible xl:pb-0">
          {columns.map((col) => (
            <Card
              key={col.key}
              className="w-[265px] sm:w-[290px] xl:w-auto shrink-0 snap-start bg-card/80"
            >
              <CardHeader className="p-3.5 pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>{col.title}</span>
                  <Badge variant="secondary">{col.items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 pt-1 space-y-2.5">
                {col.items.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    {vi.common.empty}
                  </p>
                ) : (
                  col.items.map((b) => (
                    <Link
                      key={b.id}
                      href={`/bookings/${b.id}`}
                      className="block rounded-lg border bg-background p-2.5 text-xs transition-all hover:border-primary/50 hover:shadow-xs"
                    >
                      <div className="flex items-center justify-between font-mono text-xs text-primary">
                        <span>{b.shortCode}</span>
                        <span>{b.paidPercent}%</span>
                      </div>
                      <p className="mt-1 line-clamp-1 font-semibold text-foreground">{b.title}</p>
                      <p className="text-muted-foreground truncate">{b.clientName}</p>
                      {col.key === "postProduction" && (
                        <Badge variant="outline" className="mt-1.5 text-[11px]">
                          {vi.bookings.statuses[b.status]}
                        </Badge>
                      )}
                      <p className="mt-1.5 font-semibold">{formatVND(b.total_price)}</p>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}