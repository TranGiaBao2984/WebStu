import { createClient } from "@/lib/supabase/server";
import { calcPaidPercent } from "@/lib/money";
import { parseTstzRange } from "@/lib/date";
import type { Database } from "@/types/database";
import type { BookingStatusValue } from "./schema";

export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingItemRow = Database["public"]["Tables"]["booking_items"]["Row"];
export type BookingSessionRow = Database["public"]["Tables"]["booking_sessions"]["Row"];
export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

function unwrapOne<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  return Array.isArray(val) ? (val[0] ?? null) : val;
}

export interface BookingListItem extends BookingRow {
  shortCode: string;
  clientName: string;
  clientPhone: string | null;
  paid: number;
  remaining: number;
  paidPercent: number;
  nextSessionStart: string | null;
}

export async function listBookings(filters?: {
  status?: string;
  search?: string;
}): Promise<BookingListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("bookings")
    .select("*, clients(name, phone), booking_sessions(during)")
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status as BookingStatusValue);
  }

  const [{ data: rows, error }, { data: financials, error: finErr }] = await Promise.all([
    query,
    supabase.from("v_booking_financials").select("*"),
  ]);

  if (error) throw new Error(error.message);
  if (finErr) throw new Error(finErr.message);

  const finMap = new Map<string, { paid: number; remaining: number }>();
  for (const f of financials ?? []) {
    if (f.booking_id) {
      finMap.set(f.booking_id, {
        paid: Number(f.paid ?? 0),
        remaining: Number(f.remaining ?? 0),
      });
    }
  }

  const searchLower = filters?.search?.trim().toLowerCase() ?? "";

  const mapped = (rows ?? []).map((row) => {
    const client = unwrapOne(row.clients as { name: string; phone: string | null } | null);
    const sessions = (row.booking_sessions as { during: string }[] | null) ?? [];
    const parsedStarts = sessions
      .map((s) => parseTstzRange(s.during)?.start)
      .filter((d): d is Date => Boolean(d))
      .sort((a, b) => a.getTime() - b.getTime());

    const total = Number(row.total_price ?? 0);
    const fin = finMap.get(row.id) ?? { paid: 0, remaining: total };

    return {
      ...row,
      shortCode: `#${row.code.slice(-6)}`,
      clientName: client?.name ?? "Khách lẻ",
      clientPhone: client?.phone ?? null,
      paid: fin.paid,
      remaining: fin.remaining,
      paidPercent: calcPaidPercent(fin.paid, total),
      nextSessionStart: parsedStarts[0]?.toISOString() ?? null,
    };
  });

  if (!searchLower) return mapped;

  return mapped.filter(
    (b) =>
      b.title.toLowerCase().includes(searchLower) ||
      b.shortCode.toLowerCase().includes(searchLower) ||
      b.code.toLowerCase().includes(searchLower) ||
      b.clientName.toLowerCase().includes(searchLower) ||
      (b.clientPhone ?? "").includes(searchLower)
  );
}

export interface BookingDetailData {
  booking: BookingRow;
  shortCode: string;
  client: { id: string; name: string; phone: string | null; link: string | null; source: string | null } | null;
  items: BookingItemRow[];
  sessions: (BookingSessionRow & { startIso: string | null; endIso: string | null })[];
  payments: PaymentRow[];
  financials: {
    total: number;
    paid: number;
    remaining: number;
    paidPercent: number;
  };
}

export async function getBookingDetail(id: string): Promise<BookingDetailData | null> {
  const supabase = await createClient();

  const [
    { data: booking, error: bErr },
    { data: items, error: iErr },
    { data: sessions, error: sErr },
    { data: payments, error: pErr },
    { data: finRow, error: fErr },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, clients(id, name, phone, link, source)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("booking_items").select("*").eq("booking_id", id).order("id", { ascending: true }),
    supabase.from("booking_sessions").select("*").eq("booking_id", id).order("during", { ascending: true }),
    supabase.from("payments").select("*").eq("booking_id", id).order("paid_at", { ascending: false }),
    supabase.from("v_booking_financials").select("*").eq("booking_id", id).maybeSingle(),
  ]);

  if (bErr) throw new Error(bErr.message);
  if (!booking) return null;
  if (iErr) throw new Error(iErr.message);
  if (sErr) throw new Error(sErr.message);
  if (pErr) throw new Error(pErr.message);
  if (fErr) throw new Error(fErr.message);

  const client = unwrapOne(
    booking.clients as {
      id: string;
      name: string;
      phone: string | null;
      link: string | null;
      source: string | null;
    } | null
  );

  const total = Number(booking.total_price ?? 0);
  const paid = Number(finRow?.paid ?? 0);
  const remaining = Number(finRow?.remaining ?? total - paid);

  return {
    booking,
    shortCode: `#${booking.code.slice(-6)}`,
    client,
    items: items ?? [],
    sessions: (sessions ?? []).map((s) => {
      const parsed = parseTstzRange(s.during);
      return {
        ...s,
        startIso: parsed?.start.toISOString() ?? null,
        endIso: parsed?.end.toISOString() ?? null,
      };
    }),
    payments: payments ?? [],
    financials: {
      total,
      paid,
      remaining,
      paidPercent: calcPaidPercent(paid, total),
    },
  };
}

export interface ScheduleSessionItem {
  id: string;
  bookingId: string;
  shortCode: string;
  bookingTitle: string;
  bookingStatus: BookingStatusValue;
  clientName: string;
  clientPhone: string | null;
  startIso: string;
  endIso: string;
  location: string | null;
  crewNote: string | null;
}

export async function listAllScheduleSessions(): Promise<ScheduleSessionItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_sessions")
    .select("*, bookings(id, code, title, status, clients(name, phone))")
    .order("during", { ascending: true });

  if (error) throw new Error(error.message);

  const result: ScheduleSessionItem[] = [];
  for (const row of data ?? []) {
    const parsed = parseTstzRange(row.during);
    if (!parsed) continue;

    const b = unwrapOne(
      row.bookings as {
        id: string;
        code: string;
        title: string;
        status: BookingStatusValue;
        clients: { name: string; phone: string | null } | null;
      } | null
    );
    if (!b || b.status === "cancelled") continue;

    const c = unwrapOne(b.clients);
    result.push({
      id: row.id,
      bookingId: b.id,
      shortCode: `#${b.code.slice(-6)}`,
      bookingTitle: b.title,
      bookingStatus: b.status,
      clientName: c?.name ?? "Khách lẻ",
      clientPhone: c?.phone ?? null,
      startIso: parsed.start.toISOString(),
      endIso: parsed.end.toISOString(),
      location: row.location,
      crewNote: row.crew_note,
    });
  }

  return result;
}
