import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
export type FinanceMonthReport =
  Database["public"]["Functions"]["finance_month"]["Returns"][number];

export interface ExpenseWithBooking extends ExpenseRow {
  bookingTitle?: string | null;
  bookingShortCode?: string | null;
}

export async function getMonthlyFinanceReport(
  monthStart: string
): Promise<FinanceMonthReport | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("finance_month", {
    p_month: monthStart,
  });

  if (error) throw new Error(error.message);
  return data?.[0] ?? null;
}

export async function listExpenses(): Promise<ExpenseWithBooking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, bookings(code, title)")
    .order("paid_at", { ascending: false, nullsFirst: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const b = Array.isArray(row.bookings) ? row.bookings[0] : row.bookings;
    return {
      ...row,
      bookingTitle: b?.title ?? null,
      bookingShortCode: b?.code ? `#${b.code.slice(-6)}` : null,
    };
  });
}