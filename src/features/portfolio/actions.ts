"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MainGroup } from "./types";

function extractStoragePath(publicUrl: string): string | null {
  const marker = "/storage/v1/object/public/portfolio/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

export async function uploadPortfolioImageAction(
  formData: FormData
): Promise<{ url: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    throw new Error("Không tìm thấy file ảnh hợp lệ.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("portfolio")
    .upload(filePath, arrayBuffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload ảnh thất bại: ${uploadError.message}`);
  }

  const { data: publicData } = supabase.storage
    .from("portfolio")
    .getPublicUrl(filePath);

  return { url: publicData.publicUrl };
}

export async function savePortfolioPhotoAction(input: {
  id?: string;
  group_name: MainGroup;
  album_name: string;
  title: string;
  image_url: string;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Bạn không có quyền thực hiện thao tác này.");
  }

  const payload = {
    group_name: input.group_name,
    album_name: input.album_name.trim().normalize("NFC"),
    title: input.title.trim().normalize("NFC"),
    image_url: input.image_url.trim(),
  };

  if (!payload.album_name || !payload.title || !payload.image_url) {
    throw new Error("Vui lòng điền đầy đủ thông tin Album, Tên ảnh và Hình ảnh.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  if (input.id) {
    const { error } = await db
      .from("portfolio_photos")
      .update(payload)
      .eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await db.from("portfolio_photos").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/customer");
  revalidatePath("/portfolio");
}

export async function deletePortfolioPhotoAction(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Bạn không có quyền thực hiện thao tác này.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: existing } = await db
    .from("portfolio_photos")
    .select("image_url")
    .eq("id", id)
    .single();

  const { error } = await db.from("portfolio_photos").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (existing?.image_url) {
    const storagePath = extractStoragePath(String(existing.image_url));
    if (storagePath) {
      await supabase.storage.from("portfolio").remove([storagePath]);
    }
  }

  revalidatePath("/customer");
  revalidatePath("/portfolio");
}

export async function renamePortfolioAlbumAction(
  groupName: MainGroup,
  oldAlbumName: string,
  newAlbumName: string
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Bạn không có quyền thực hiện thao tác này.");
  }

  const cleanNewName = newAlbumName.trim().normalize("NFC");
  if (!cleanNewName) {
    throw new Error("Tên album mới không được để trống.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("portfolio_photos")
    .update({ album_name: cleanNewName })
    .eq("group_name", groupName)
    .eq("album_name", oldAlbumName.normalize("NFC"));

  if (error) throw new Error(error.message);

  revalidatePath("/customer");
  revalidatePath("/portfolio");
}

export async function deletePortfolioAlbumAction(
  groupName: MainGroup,
  albumName: string
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Bạn không có quyền thực hiện thao tác này.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const normalizedAlbum = albumName.normalize("NFC");

  const { data: existingRows } = await db
    .from("portfolio_photos")
    .select("image_url")
    .eq("group_name", groupName)
    .eq("album_name", normalizedAlbum);

  const { error } = await db
    .from("portfolio_photos")
    .delete()
    .eq("group_name", groupName)
    .eq("album_name", normalizedAlbum);

  if (error) throw new Error(error.message);

  const pathsToRemove = ((existingRows as { image_url: string }[]) ?? [])
    .map((r) => extractStoragePath(r.image_url))
    .filter((p): p is string => Boolean(p));

  if (pathsToRemove.length > 0) {
    await supabase.storage.from("portfolio").remove(pathsToRemove);
  }

  revalidatePath("/customer");
  revalidatePath("/portfolio");
}
