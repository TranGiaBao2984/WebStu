"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import type { ScheduleSessionItem } from "@/features/bookings/queries";
import {
  getDateKeyHCM,
  getWeekDaysHCM,
  getMonthGridHCM,
  shiftDateKey,
  shiftYearMonth,
  formatTimeVN,
  formatDateVN,
} from "@/lib/date";
import { BookingStatusBadge } from "./status-badge";
import { vi } from "@/i18n/vi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ScheduleClient({ sessions }: { sessions: ScheduleSessionItem[] }) {
  const todayKey = useMemo(() => getDateKeyHCM(), []);
  const [mode, setMode] = useState<"week" | "month">("week");
  const [anchorDate, setAnchorDate] = useState(todayKey);
  const [anchorMonth, setAnchorMonth] = useState(todayKey.slice(0, 7));

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, ScheduleSessionItem[]>();
    for (const s of sessions) {
      const key = getDateKeyHCM(s.startIso);
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    return map;
  }, [sessions]);

  const weekDays = useMemo(() => getWeekDaysHCM(anchorDate), [anchorDate]);
  const monthCells = useMemo(() => getMonthGridHCM(anchorMonth), [anchorMonth]);

  const handlePrev = () => {
    if (mode === "week") setAnchorDate((d) => shiftDateKey(d, -7));
    else setAnchorMonth((m) => shiftYearMonth(m, -1));
  };

  const handleNext = () => {
    if (mode === "week") setAnchorDate((d) => shiftDateKey(d, 7));
    else setAnchorMonth((m) => shiftYearMonth(m, 1));
  };

  const handleToday = () => {
    setAnchorDate(todayKey);
    setAnchorMonth(todayKey.slice(0, 7));
  };

  const rangeLabel =
    mode === "week"
      ? `${formatDateVN(`${weekDays[0].dateKey}T12:00:00+07:00`)} – ${formatDateVN(`${weekDays[6].dateKey}T12:00:00+07:00`)}`
      : `Tháng ${anchorMonth.slice(5, 7)}/${anchorMonth.slice(0, 4)}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="button" size="icon" variant="outline" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={handleToday}>
            {vi.schedule.today}
          </Button>
          <Button type="button" size="icon" variant="outline" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="ml-1 text-sm font-semibold sm:text-base">{rangeLabel}</span>
        </div>

        <div className="flex gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={mode === "week" ? "default" : "outline"}
            onClick={() => setMode("week")}
          >
            {vi.schedule.weekView}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "month" ? "default" : "outline"}
            onClick={() => setMode("month")}
          >
            {vi.schedule.monthView}
          </Button>
        </div>
      </div>

      {mode === "week" ? (
        <div className="grid gap-3 md:grid-cols-7">
          {weekDays.map((day, idx) => {
            const daySessions = sessionsByDay.get(day.dateKey) ?? [];
            return (
              <Card
                key={day.dateKey}
                className={cn(day.isToday && "border-primary ring-1 ring-primary/40")}
              >
                <CardContent className="space-y-2.5 p-3">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {vi.schedule.weekdays[idx]}
                    </span>
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                        day.isToday && "bg-primary text-primary-foreground"
                      )}
                    >
                      {day.dayNumber}
                    </span>
                  </div>

                  {daySessions.length === 0 ? (
                    <p className="py-3 text-center text-xs text-muted-foreground">—</p>
                  ) : (
                    <div className="space-y-2">
                      {daySessions.map((s) => (
                        <Link
                          key={s.id}
                          href={`/bookings/${s.bookingId}`}
                          className="block rounded-lg border bg-primary/5 p-2 text-xs transition-colors hover:bg-primary/10"
                        >
                          <p className="font-bold text-primary">
                            {formatTimeVN(s.startIso)} – {formatTimeVN(s.endIso)}
                          </p>
                          <p className="mt-0.5 line-clamp-1 font-semibold">{s.bookingTitle}</p>
                          <p className="text-muted-foreground">{s.clientName}</p>
                          {s.location && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{s.location}</span>
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground pb-2">
              {vi.schedule.weekdays.map((wd) => (
                <div key={wd}>{wd}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthCells.map((cell) => {
                const daySessions = sessionsByDay.get(cell.dateKey) ?? [];
                return (
                  <div
                    key={cell.dateKey}
                    className={cn(
                      "min-h-20.5 rounded-md border p-1.5 text-xs",
                      !cell.inCurrentMonth && "bg-muted/40 opacity-50",
                      cell.isToday && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="mb-1 flex justify-between">
                      <span
                        className={cn(
                          "font-semibold",
                          cell.isToday && "text-primary"
                        )}
                      >
                        {cell.dayNumber}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {daySessions.map((s) => (
                        <Link
                          key={s.id}
                          href={`/bookings/${s.bookingId}`}
                          className="block truncate rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                          title={`${formatTimeVN(s.startIso)} ${s.bookingTitle} - ${s.clientName}`}
                        >
                          {formatTimeVN(s.startIso)} {s.clientName}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danh sách chi tiết các ca chụp để dễ bấm trên điện thoại */}
      <div className="space-y-2 pt-2">
        {sessions.slice(0, 10).map((s) => (
          <Link key={s.id} href={`/bookings/${s.bookingId}`} className="block">
            <Card className="hover:border-primary/40">
              <CardContent className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <div>
                  <span className="font-semibold text-primary">
                    {formatDateVN(s.startIso)} ({formatTimeVN(s.startIso)} –{" "}
                    {formatTimeVN(s.endIso)})
                  </span>
                  <span className="mx-2 font-medium">{s.bookingTitle}</span>
                  <span className="text-muted-foreground">• {s.clientName}</span>
                </div>
                <BookingStatusBadge status={s.bookingStatus} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
