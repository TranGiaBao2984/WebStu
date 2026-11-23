import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type StudioSettingsRow = Database["public"]["Tables"]["studio_settings"]["Row"];
export type ServicePackageRow = Database["public"]["Tables"]["service_packages"]["Row"];

export const getStudioSettings = cache(async (): Promise<StudioSettingsRow | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("studio_settings")
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
});

export const listServicePackages = cache(async (): Promise<ServicePackageRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_packages")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
});