"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildTstzRangeHCM } from "@/lib/date";
import { vi } from "@/i18n/vi";
import {
  createBookingSchema,
  bookingStatusSchema,
  bookingItemSchema,
  bookingSessionSchema,
  paymentSchema,
  type CreateBookingInput,
  type BookingStatusValue,
  type BookingItemInput,
  type BookingSessionInput,
  type PaymentInput,
} from "./schema";

async function syncBookingTotalPrice(bookingId: string) {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("booking_items")
    .select("amount")
    .eq("booking_id", bookingId);

  const sum = (items ?? []).reduce((acc, item) => acc + Number(item.amount ?? 0), 0);
  await supabase.from("bookings").update({ total_price: Math.max(0, sum) }).eq("id", bookingId);
}

export async function createBookingAction(
  input: CreateBookingInput
): Promise<{ error?: string; bookingId?: string }> {
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? vi.common.errorGeneric };
  }

  const supabase = await createClient();
  const d = parsed.data;
  let clientId = d.client_id || "";

  // 1. Tạo khách hàng mới nếu chọn chế độ tạo nhanh
  if (d.client_mode === "new") {
    const { data: newClient, error: clientErr } = await supabase
      .from("clients")
      .insert({
        name: d.new_client_name!,
        phone: d.new_client_phone || null,
        source: d.new_client_source || null,
      })
      .select("id")
      .single();

    if (clientErr) {
      if (clientErr.code === "23505") {
        return { error: vi.clients.duplicatePhone };
      }
      return { error: clientErr.message };
    }
    clientId = newClient.id;
  }

  // 2. Xác định hạng mục dịch vụ ban đầu
  let initialItem: { kind: "package" | "custom"; package_id: string | null; name: string; amount: number } | null =
    null;

  if (d.package_id) {
    const { data: pkg } = await supabase
      .from("service_packages")
      .select("id, name, price")
      .eq("id", d.package_id)
      .maybeSingle();

    if (pkg) {
      initialItem = {
        kind: "package",
        package_id: pkg.id,
        name: pkg.name,
        amount: Number(pkg.price),
      };
    }
  } else if (d.custom_item_name || d.custom_item_amount > 0) {
    initialItem = {
      kind: "custom",
      package_id: null,
      name: d.custom_item_name || d.title,
      amount: d.custom_item_amount,
    };
  }

  const initialTotal = initialItem ? initialItem.amount : 0;

  // 3. Tạo booking
  const { data: booking, error: bookErr } = await supabase
    .from("bookings")
    .insert({
      client_id: clientId,
      title: d.title,
      note: d.note || null,
      status: d.deposit_amount > 0 ? "confirmed" : "pending",
      total_price: initialTotal,
    })
    .select("id")
    .single();

  if (bookErr) {
    return { error: bookErr.message };
  }

  // 4. Tạo ca chụp (nếu có) — kiểm tra trùng giờ ngay tại Postgres
  if (d.session_date && d.start_time && d.end_time) {
    const during = buildTstzRangeHCM(d.session_date, d.start_time, d.end_time);
    const { error: sessErr } = await supabase.from("booking_sessions").insert({
      booking_id: booking.id,
      during,
      location: d.location || null,
      crew_note: d.crew_note || null,
    });

    if (sessErr) {
      // Dọn booking vừa tạo để tránh rác khi bị trùng giờ
      await supabase.from("bookings").delete().eq("id", booking.id);
      if (sessErr.code === "23P01") {
        return { error: vi.bookings.detail.overlapError };
      }
      return { error: sessErr.message };
    }
  }

  // 5. Thêm hạng mục dịch vụ
  if (initialItem) {
    await supabase.from("booking_items").insert({
      booking_id: booking.id,
      kind: initialItem.kind,
      package_id: initialItem.package_id,
      name: initialItem.name,
      amount: initialItem.amount,
    });
  }

  // 6. Ghi nhận tiền cọc (nếu có)
  if (d.deposit_amount > 0) {
    await supabase.from("payments").insert({
      booking_id: booking.id,
      kind: "deposit",
      amount: d.deposit_amount,
      method: d.deposit_method || "Chuyển khoản",
    });
  }

  revalidatePath("/bookings");
  revalidatePath("/bookings/schedule");
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  return { bookingId: booking.id };
}

export async function deleteBookingAction(bookingId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  // Dọn các bảng con liên quan (nếu chưa cấu hình ON DELETE CASCADE)
  await supabase.from("payments").delete().eq("booking_id", bookingId);
  await supabase.from("booking_sessions").delete().eq("booking_id", bookingId);
  await supabase.from("booking_items").delete().eq("booking_id", bookingId);

  const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/bookings");
  revalidatePath("/bookings/schedule");
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath("/finance");
  return {};
}

export async function updateBookingStatusAction(
  bookingId: string,
  status: BookingStatusValue
): Promise<{ error?: string }> {
  const parsed = bookingStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { error: "Trạng thái không hợp lệ" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status: parsed.data })
    .eq("id", bookingId);

  if (error) return { error: error.message };

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  return {};
}

export async function updateBookingInfoAction(
  bookingId: string,
  input: { title: string; note?: string }
): Promise<{ error?: string }> {
  const title = input.title.trim();
  if (!title) return { error: "Vui lòng nhập tên buổi chụp" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ title, note: input.note?.trim() || null })
    .eq("id", bookingId);

  if (error) return { error: error.message };

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  return {};
}

export async function addBookingItemAction(
  bookingId: string,
  input: BookingItemInput
): Promise<{ error?: string }> {
  const parsed = bookingItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? vi.common.errorGeneric };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("booking_items").insert({
    booking_id: bookingId,
    kind: parsed.data.kind,
    package_id: parsed.data.package_id || null,
    name: parsed.data.name,
    amount: parsed.data.amount,
  });

  if (error) return { error: error.message };

  await syncBookingTotalPrice(bookingId);
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteBookingItemAction(
  bookingId: string,
  itemId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("booking_items").delete().eq("id", itemId);
  if (error) return { error: error.message };

  await syncBookingTotalPrice(bookingId);
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  return {};
}

export async function addBookingSessionAction(
  bookingId: string,
  input: BookingSessionInput
): Promise<{ error?: string }> {
  const parsed = bookingSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? vi.common.errorGeneric };
  }

  const supabase = await createClient();
  const during = buildTstzRangeHCM(
    parsed.data.session_date,
    parsed.data.start_time,
    parsed.data.end_time
  );

  const { error } = await supabase.from("booking_sessions").insert({
    booking_id: bookingId,
    during,
    location: parsed.data.location || null,
    crew_note: parsed.data.crew_note || null,
  });

  if (error) {
    if (error.code === "23P01") {
      return { error: vi.bookings.detail.overlapError };
    }
    return { error: error.message };
  }

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings/schedule");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteBookingSessionAction(
  bookingId: string,
  sessionId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("booking_sessions").delete().eq("id", sessionId);
  if (error) return { error: error.message };

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings/schedule");
  revalidatePath("/dashboard");
  return {};
}

export async function addPaymentAction(
  bookingId: string,
  input: PaymentInput
): Promise<{ error?: string }> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? vi.common.errorGeneric };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    booking_id: bookingId,
    kind: parsed.data.kind,
    amount: parsed.data.amount,
    paid_at: parsed.data.paid_at ? new Date(parsed.data.paid_at).toISOString() : new Date().toISOString(),
    method: parsed.data.method || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  return {};
}

export async function deletePaymentAction(
  bookingId: string,
  paymentId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  if (error) return { error: error.message };

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  return {};
}