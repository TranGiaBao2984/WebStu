import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type AlbumRow = Database["public"]["Tables"]["albums"]["Row"];
export type AlbumStatusValue = Database["public"]["Enums"]["album_status"];
export type PublicAlbumData =
  Database["public"]["Functions"]["get_public_album"]["Returns"][number];

export interface AlbumWithBooking extends AlbumRow {
  bookingTitle: string | null;
  bookingShortCode: string | null;
  clientName: string | null;
  selectedList: string[];
}

function normalizeSelectedFiles(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x).trim()).filter(Boolean);
}

export async function listAlbums(): Promise<AlbumWithBooking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("albums")
    .select("*, bookings(code, title, clients(name))")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const b = Array.isArray(row.bookings) ? row.bookings[0] : row.bookings;
    const c = b ? (Array.isArray(b.clients) ? b.clients[0] : b.clients) : null;
    return {
      ...row,
      bookingTitle: b?.title ?? null,
      bookingShortCode: b?.code ? `#${b.code.slice(-6)}` : null,
      clientName: c?.name ?? null,
      selectedList: normalizeSelectedFiles(row.selected_files),
    };
  });
}

export async function getPublicAlbumByToken(token: string): Promise<PublicAlbumData | null> {
  if (!token) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_album", {
    p_token: token,
  });

  if (error) return null;
  return data?.[0] ?? null;
}