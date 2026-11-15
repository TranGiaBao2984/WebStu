export const STUDIO_TIMEZONE = "Asia/Ho_Chi_Minh";

export function formatDateVN(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: STUDIO_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatTimeVN(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: STUDIO_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatDateTimeVN(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: STUDIO_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: false,
  }).format(date);
}

export function getDateKeyHCM(input: string | Date = new Date()): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value ?? "2026";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthStartHCM(now: Date = new Date()): string {
  return `${getDateKeyHCM(now).slice(0, 7)}-01`;
}

/**
 * Tạo chuỗi tstzrange chuẩn múi giờ +07:00 cho Postgres: [start, end)
 */
export function buildTstzRangeHCM(dateStr: string, startTime: string, endTime: string): string {
  return `[${dateStr}T${startTime}:00+07:00,${dateStr}T${endTime}:00+07:00)`;
}

/**
 * Giải mã chuỗi tstzrange từ Postgres (vd: ["2026-11-20 02:00:00+00","2026-11-20 04:00:00+00"))
 */
export function parseTstzRange(rangeStr: string): { start: Date; end: Date } | null {
  if (!rangeStr) return null;
  const trimmed = rangeStr.trim().replace(/^[\[(]/, "").replace(/[\])]$/, "");
  const parts = trimmed.split(",");
  if (parts.length !== 2) return null;

  const rawStart = parts[0].trim().replace(/^"|"$/g, "");
  const rawEnd = parts[1].trim().replace(/^"|"$/g, "");

  const start = new Date(rawStart);
  const end = new Date(rawEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }
  return { start, end };
}

export interface CalendarDayCell {
  dateKey: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * Lấy danh sách 7 ngày trong tuần (Thứ 2 -> Chủ Nhật) chứa anchorDateKey (YYYY-MM-DD)
 */
export function getWeekDaysHCM(anchorDateKey: string): CalendarDayCell[] {
  const todayKey = getDateKeyHCM(new Date());
  const anchor = new Date(`${anchorDateKey}T12:00:00+07:00`);
  const dayOfWeek = anchor.getUTCDay(); // 0 = CN, 1 = T2 ... 6 = T7 (với 12:00+07 = 05:00 UTC cùng ngày)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(anchor.getTime() + diffToMonday * 86400000);
  const days: CalendarDayCell[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getTime() + i * 86400000);
    const key = getDateKeyHCM(d);
    days.push({
      dateKey: key,
      dayNumber: Number(key.slice(8, 10)),
      inCurrentMonth: true,
      isToday: key === todayKey,
    });
  }
  return days;
}

/**
 * Lấy lưới 35 hoặc 42 ô ngày cho lịch tháng (bắt đầu từ Thứ 2)
 */
export function getMonthGridHCM(yearMonth: string): CalendarDayCell[] {
  const todayKey = getDateKeyHCM(new Date());
  const firstDay = new Date(`${yearMonth}-01T12:00:00+07:00`);
  const firstDow = firstDay.getUTCDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const gridStart = new Date(firstDay.getTime() - offset * 86400000);

  const cells: CalendarDayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getTime() + i * 86400000);
    const key = getDateKeyHCM(d);
    cells.push({
      dateKey: key,
      dayNumber: Number(key.slice(8, 10)),
      inCurrentMonth: key.startsWith(yearMonth),
      isToday: key === todayKey,
    });
  }
  return cells;
}

export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const d = new Date(`${dateKey}T12:00:00+07:00`);
  return getDateKeyHCM(new Date(d.getTime() + deltaDays * 86400000));
}

export function shiftYearMonth(yearMonth: string, deltaMonths: number): string {
  const [yStr, mStr] = yearMonth.split("-");
  const totalMonths = Number(yStr) * 12 + (Number(mStr) - 1) + deltaMonths;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  return `${newYear}-${String(newMonth).padStart(2, "0")}`;
}
