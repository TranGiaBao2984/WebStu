"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { clientSchema, type ClientInput } from "./schema";
import { vi } from "@/i18n/vi";

export async function createClientAction(
  input: ClientInput
): Promise<{ error?: string; clientId?: string }> {
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? vi.common.errorGeneric };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      link: parsed.data.link || null,
      source: parsed.data.source || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: vi.clients.duplicatePhone };
    }
    return { error: error.message };
  }

  revalidatePath("/clients");
  revalidatePath("/bookings/new");
  return { clientId: data.id };
}

export async function updateClientAction(
  id: string,
  input: ClientInput
): Promise<{ error?: string }> {
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? vi.common.errorGeneric };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      link: parsed.data.link || null,
      source: parsed.data.source || null,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: vi.clients.duplicatePhone };
    }
    return { error: error.message };
  }

  revalidatePath("/clients");
  return {};
}

export async function deleteClientAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { error: vi.clients.deleteHasBookings };
    }
    return { error: error.message };
  }

  revalidatePath("/clients");
  return {};
}
