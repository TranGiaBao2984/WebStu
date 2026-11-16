"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function exportClientPersonalDataAction(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Phiên đăng nhập không hợp lệ.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: client, error: clientError } = await db
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (clientError || !client) {
    throw new Error("Không tìm thấy hồ sơ khách hàng.");
  }

  const { data: bookings } = await db
    .from("bookings")
    .select("id, code, title, status, total_price, created_at, albums(id, title, status, selected_files)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  await db.from("privacy_audit_logs").insert({
    actor_user_id: user.id,
    action_type: "EXPORT_CLIENT_DATA",
    target_client_id: clientId,
  });

  return {
    compliance_standard: "Nghị định 13/2023/NĐ-CP - Điều 14 (Cung cấp dữ liệu cá nhân)",
    exported_at_utc: new Date().toISOString(),
    data_controller: "Ni Studio",
    personal_profile: client,
    service_history: bookings ?? [],
  };
}

export async function anonymizeClientDataAction(clientId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Phiên đăng nhập không hợp lệ.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const anonymizedPhone = `DEL-${clientId.replace(/-/g, "").slice(0, 10)}`;
  const complianceStamp = `[Đã xóa & ẩn danh dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP vào ${new Date().toLocaleDateString("vi-VN")}]`;

  const { error } = await db
    .from("clients")
    .update({
      name: "Khách hàng đã ẩn danh",
      phone: anonymizedPhone,
      link: null,
      note: complianceStamp,
    })
    .eq("id", clientId);

  if (error) {
    // Fallback nếu cột link trong DB đặt NOT NULL
    const { error: retryError } = await db
      .from("clients")
      .update({
        name: "Khách hàng đã ẩn danh",
        phone: anonymizedPhone,
        link: "",
        note: complianceStamp,
      })
      .eq("id", clientId);

    if (retryError) {
      throw new Error(`Không thể ẩn danh dữ liệu: ${retryError.message}`);
    }
  }

  await db.from("privacy_audit_logs").insert({
    actor_user_id: user.id,
    action_type: "ANONYMIZE_CLIENT_DATA",
    target_client_id: clientId,
  });

  revalidatePath("/clients");
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
}