import { createClient } from "@/lib/supabase/server";
import { calcPaidPercent } from "@/lib/money";
import { parseTstzRange, getDateKeyHCM } from "@/lib/date";
import { getMonthlyFinanceReport, type FinanceMonthReport } from "@/features/finance/queries";
import type { BookingStatusValue } from "@/features/bookings/schema";

export interface DashboardBookingCard {
  id: string;
  shortCode: string;
  title: string;
  status: BookingStatusValue;
  total_price: number;
  clientName: string;
  paidPercent: number;
}

export interface DashboardUpcomingSession {
  id: string;
  bookingId: string;
  shortCode: string;
  bookingTitle: string;
  clientName: string;
  startIso: string;
  endIso: string;
  location: string | null;
}

function unwrapOne<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  return Array.isArray(val) ? (val[0] ?? null) : val;
}

export async function getDashboardSummary(monthStart: string, todayKey: string): Promise<{
  bookings: DashboardBookingCard[];
  upcomingSessions: DashboardUpcomingSession[];
  financeReport: FinanceMonthReport | null;
  albumsWaitingCount: number;
}> {
  const supabase = await createClient();

  const [
    { data: bookingRows, error: bErr },
    { data: finRows, error: fErr },
    { data: sessionRows, error: sErr },
    financeReport,
    { count: albumsWaitingCount, error: aErr },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, code, title, status, total_price, clients(name)")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false }),
    supabase.from("v_booking_financials").select("booking_id, paid"),
    supabase
      .from("booking_sessions")
      .select("id, during, location, bookings!inner(id, code, title, status, clients(name))")
      .neq("bookings.status", "cancelled")
      .order("during", { ascending: true }),
    getMonthlyFinanceReport(monthStart),
    supabase
      .from("albums")
      .select("id", { count: "exact", head: true })
      .in("status", ["client_done", "retouching"]),
  ]);

  if (bErr) throw new Error(bErr.message);
  if (fErr) throw new Error(fErr.message);
  if (sErr) throw new Error(sErr.message);
  if (aErr) throw new Error(aErr.message);

  const paidMap = new Map<string, number>();
  for (const f of finRows ?? []) {
    if (f.booking_id) {
      paidMap.set(f.booking_id, Number(f.paid ?? 0));
    }
  }

  const bookings: DashboardBookingCard[] = (bookingRows ?? []).map((row) => {
    const client = unwrapOne(row.clients as { name: string } | null);
    const total = Number(row.total_price ?? 0);
    const paid = paidMap.get(row.id) ?? 0;

    return {
      id: row.id,
      shortCode: `#${row.code.slice(-6)}`,
      title: row.title,
      status: row.status,
      total_price: total,
      clientName: client?.name ?? "Khách lẻ",
      paidPercent: calcPaidPercent(paid, total),
    };
  });

  const upcomingSessions: DashboardUpcomingSession[] = [];
  for (const row of sessionRows ?? []) {
    if (upcomingSessions.length >= 6) break;
    const parsed = parseTstzRange(row.during);
    if (!parsed) continue;

    const startIso = parsed.start.toISOString();
    if (getDateKeyHCM(startIso) < todayKey) continue;

    const b = unwrapOne(
      row.bookings as {
        id: string;
        code: string;
        title: string;
        status: BookingStatusValue;
        clients: { name: string } | null;
      } | null
    );
    if (!b) continue;

    const c = unwrapOne(b.clients);
    upcomingSessions.push({
      id: row.id,
      bookingId: b.id,
      shortCode: `#${b.code.slice(-6)}`,
      bookingTitle: b.title,
      clientName: c?.name ?? "Khách lẻ",
      startIso,
      endIso: parsed.end.toISOString(),
      location: row.location,
    });
  }

  return {
    bookings,
    upcomingSessions,
    financeReport,
    albumsWaitingCount: albumsWaitingCount ?? 0,
  };
}