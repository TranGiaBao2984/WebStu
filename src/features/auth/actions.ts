"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginInput } from "./schema";
import { vi } from "@/i18n/vi";

export async function loginAction(input: LoginInput): Promise<{ error?: string }> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? vi.auth.invalidCredentials };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: vi.auth.invalidCredentials };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
