import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

export interface ClientWithStats extends ClientRow {
  sessionsCount: number;
  totalSpent: number;
  isReturning: boolean;
}

export async function listClientsWithStats(search?: string): Promise<ClientWithStats[]> {
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  const cleanSearch = search?.trim();
  if (cleanSearch) {
    query = query.or(`name.ilike.%${cleanSearch}%,phone.eq.${cleanSearch}`);
  }

  const [{ data: clients, error: clientErr }, { data: bookings, error: bookErr }] =
    await Promise.all([
      query,
      supabase.from("bookings").select("client_id, status, total_price"),
    ]);

  if (clientErr) throw new Error(clientErr.message);
  if (bookErr) throw new Error(bookErr.message);

  const statsMap = new Map<string, { sessionsCount: number; totalSpent: number }>();
  for (const b of bookings ?? []) {
    if (b.status === "cancelled") continue;
    const prev = statsMap.get(b.client_id) ?? { sessionsCount: 0, totalSpent: 0 };
    prev.sessionsCount += 1;
    if (b.status === "completed") {
      prev.totalSpent += Number(b.total_price ?? 0);
    }
    statsMap.set(b.client_id, prev);
  }

  return (clients ?? []).map((c) => {
    const st = statsMap.get(c.id) ?? { sessionsCount: 0, totalSpent: 0 };
    return {
      ...c,
      sessionsCount: st.sessionsCount,
      totalSpent: st.totalSpent,
      isReturning: st.sessionsCount >= 2,
    };
  });
}

export async function listSimpleClients(): Promise<Pick<ClientRow, "id" | "name" | "phone">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, phone")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
