"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MainGroup } from "./types";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function hasValidImageSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (bytes.length < 12) return false;
  // JPEG: FF D8 FF
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }
  // WEBP: "RIFF" .... "WEBP"
  if (mimeType === "image/webp") {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  // AVIF: .... "ftyp"
  if (mimeType === "image/avif") {
    return (
      bytes[4] === 0x66 &&
      bytes[5] === 0x74 &&
      bytes[6] === 0x79 &&
      bytes[7] === 0x70
    );
  }
  return false;
}

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

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Dung lượng ảnh vượt quá giới hạn 5MB.");
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Chỉ chấp nhận định dạng ảnh JPG, PNG, WEBP hoặc AVIF.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const headerBytes = new Uint8Array(arrayBuffer.slice(0, 16));
  if (!hasValidImageSignature(headerBytes, file.type)) {
    throw new Error("Nội dung tệp không khớp với định dạng ảnh hợp lệ.");
  }

  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
  };
  const ext = extMap[file.type] || "jpg";
  const filePath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("portfolio")
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: "31536000",
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

  const cleanUrl = input.image_url.trim();
  if (!cleanUrl.startsWith("https://")) {
    throw new Error("Đường dẫn ảnh phải sử dụng giao thức bảo mật HTTPS.");
  }

  const payload = {
    group_name: input.group_name,
    album_name: input.album_name.trim().normalize("NFC"),
    title: input.title.trim().normalize("NFC"),
    image_url: cleanUrl,
  };

  if (!payload.album_name || !payload.title) {
    throw new Error("Vui lòng điền đầy đủ thông tin Album và Tên tác phẩm.");
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