"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  studioSettingsSchema,
  servicePackageSchema,
  type StudioSettingsInput,
  type ServicePackageInput,
} from "./schema";

export async function updateStudioSettingsAction(
  input: StudioSettingsInput
): Promise<{ error?: string }> {
  const parsed = studioSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Phiên đăng nhập đã hết hạn" };
  }

  const { error } = await supabase.from("studio_settings").upsert({
    owner_id: user.id,
    studio_name: parsed.data.studio_name,
    phone: parsed.data.phone || null,
    timezone: parsed.data.timezone,
    doc_footer: parsed.data.doc_footer || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return {};
}

export async function createServicePackageAction(
  input: ServicePackageInput
): Promise<{ error?: string }> {
  const parsed = servicePackageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("service_packages").insert({
    name: parsed.data.name,
    price: parsed.data.price,
    is_active: parsed.data.is_active,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return {};
}

export async function toggleServicePackageActiveAction(
  id: string,
  isActive: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_packages")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return {};
}

export async function deleteServicePackageAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("service_packages").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return {};
}
