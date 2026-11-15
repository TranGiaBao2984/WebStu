"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createExpenseAction(input: {
  scope: "booking" | "general" | "capex";
  booking_id?: string;
  category: string;
  amount: number;
  is_paid: boolean;
  paid_at?: string;
}): Promise<{ error?: string }> {
  const category = input.category.trim();
  if (!category) return { error: "Vui lòng nhập hạng mục chi phí." };
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    return { error: "Số tiền chi phí phải lớn hơn 0." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    scope: input.scope,
    booking_id: input.scope === "booking" && input.booking_id ? input.booking_id : null,
    category,
    amount: input.amount,
    is_paid: input.is_paid,
    paid_at: input.is_paid
      ? input.paid_at
        ? new Date(input.paid_at).toISOString()
        : new Date().toISOString()
      : null,
  });

  if (error) return { error: error.message };

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return {};
}

export async function toggleExpensePaidAction(
  id: string,
  nextPaid: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("expenses")
    .update({
      is_paid: nextPaid,
      paid_at: nextPaid ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/finance");
  return {};
}

export async function deleteExpenseAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/finance");
  return {};
}