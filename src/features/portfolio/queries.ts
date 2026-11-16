import type { PortfolioAlbumMeta } from "./types";
import { createClient } from "@/lib/supabase/server";
import type { MainGroup, PortfolioPhoto } from "./types";

function normalizeRow(row: Record<string, unknown>): PortfolioPhoto {
  const rawGroup = String(row.group_name ?? "Concept").normalize("NFC");
  return {
    id: String(row.id ?? ""),
    group_name: (rawGroup === "Ngoại cảnh" ? "Ngoại cảnh" : "Concept") as MainGroup,
    album_name: String(row.album_name ?? "").normalize("NFC"),
    title: String(row.title ?? "").normalize("NFC"),
    image_url: String(row.image_url ?? ""),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ""),
  };
}

export async function listPortfolioPhotos(): Promise<PortfolioPhoto[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("portfolio_photos")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data as Record<string, unknown>[]) ?? []).map(normalizeRow);
}

export async function listAlbumPhotos(
  albumName: string,
  groupName?: string | null
): Promise<PortfolioPhoto[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("portfolio_photos")
    .select("*")
    .eq("album_name", albumName.normalize("NFC"))
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (groupName) {
    query = query.eq("group_name", groupName.normalize("NFC"));
  }

  const { data, error } = await query;
  if (error) {
    return [];
  }

  return ((data as Record<string, unknown>[]) ?? []).map(normalizeRow);
}

export async function listPortfolioAlbumMeta(): Promise<PortfolioAlbumMeta[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("portfolio_albums")
    .select("id, group_name, album_name, external_url");

  if (error) {
    return [];
  }
  return (data ?? []) as PortfolioAlbumMeta[];
}