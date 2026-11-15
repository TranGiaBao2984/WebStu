"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AlbumStatusValue } from "./queries";

function generateShareToken(): string {
  return randomBytes(12).toString("hex");
}

export async function createAlbumAction(input: {
  booking_id?: string;
  title: string;
  source_ref: string;
  max_selectable?: number | null;
  due_date?: string;
}): Promise<{ error?: string }> {
  const title = input.title.trim();
  const sourceRef = input.source_ref.trim();

  if (!title) return { error: "Vui lòng nhập tên Album." };
  if (!sourceRef) return { error: "Vui lòng dán link thư mục Google Drive / ảnh gốc." };

  const supabase = await createClient();
  const token = generateShareToken();

  const { error } = await supabase.from("albums").insert({
    booking_id: input.booking_id || null,
    title,
    source_ref: sourceRef,
    max_selectable:
      input.max_selectable && input.max_selectable > 0 ? Math.floor(input.max_selectable) : null,
    due_date: input.due_date || null,
    status: "awaiting_client",
    share_token: token,
    selected_files: [],
  });

  if (error) return { error: error.message };

  if (input.booking_id) {
    await supabase
      .from("bookings")
      .update({ status: "selecting" })
      .eq("id", input.booking_id)
      .in("status", ["pending", "confirmed", "shooting"]);
  }

  revalidatePath("/albums");
  revalidatePath("/bookings");
  return {};
}

export async function updateAlbumStatusAction(
  id: string,
  status: AlbumStatusValue
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("albums").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/albums");
  return {};
}

export async function regenerateAlbumTokenAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("albums")
    .update({ share_token: generateShareToken(), status: "awaiting_client" })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/albums");
  return {};
}

export async function deleteAlbumAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("albums").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/albums");
  return {};
}

export async function submitPublicSelectionAction(input: {
  token: string;
  selectedFiles: string[];
  clientNote: string;
  finalize: boolean;
}): Promise<{ error?: string }> {
  const cleanFiles = Array.from(
    new Set(input.selectedFiles.map((f) => f.trim()).filter(Boolean))
  );

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_public_album_selection", {
    p_token: input.token,
    p_selected_files: cleanFiles,
    p_client_note: input.clientNote,
    p_finalize: input.finalize,
  });

  if (error) return { error: error.message };
  if (!data) {
    return { error: "Album này đã khóa chỉnh sửa hoặc đường dẫn không còn hiệu lực." };
  }

  revalidatePath(`/album/${input.token}`);
  revalidatePath("/albums");
  revalidatePath("/bookings");
  return {};
}