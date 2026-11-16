import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { PortfolioAlbumMeta, PortfolioPhoto } from "./types";

function createPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) return null;

  return createSupabaseClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// Dùng cho trang khách hàng (/customer): Không gọi cookies() để Next.js build Static ISR (< 50ms)
export async function listPublicPortfolioPhotos(): Promise<PortfolioPhoto[]> {
  const publicClient = createPublicSupabaseClient();
  const supabase = publicClient ?? (await createClient());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("portfolio_photos")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PortfolioPhoto[];
}

// Dùng cho trang quản trị Admin (/portfolio): Có phiên đăng nhập & cookies
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

  return (data ?? []) as PortfolioPhoto[];
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