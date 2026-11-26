"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBookingDetail } from "@/features/bookings/queries";
import { getStudioSettings } from "@/features/settings/queries";
import type { Json } from "@/types/database";
import type { BookingDocumentRow, DocumentSnapshot } from "./queries";

async function buildSnapshotPayload(bookingId: string): Promise<DocumentSnapshot | null> {
  const [detail, studio] = await Promise.all([
    getBookingDetail(bookingId),
    getStudioSettings(),
  ]);

  if (!detail) return null;

  return {
    studio: {
      name: studio?.studio_name ?? "Studio của tôi",
      phone: studio?.phone ?? null,
      doc_footer: studio?.doc_footer ?? null,
    },
    booking: {
      id: detail.booking.id,
      code: detail.booking.code,
      shortCode: detail.shortCode,
      title: detail.booking.title,
      status: detail.booking.status,
      note: detail.booking.note,
    },
    client: {
      name: detail.client?.name ?? "Khách lẻ",
      phone: detail.client?.phone ?? null,
    },
    items: detail.items.map((it) => ({
      kind: it.kind,
      name: it.name,
      amount: Number(it.amount),
    })),
    sessions: detail.sessions.map((s) => ({
      startIso: s.startIso,
      endIso: s.endIso,
      location: s.location,
      crew_note: s.crew_note,
    })),
    financials: {
      total: detail.financials.total,
      paid: detail.financials.paid,
      remaining: detail.financials.remaining,
    },
    generated_at: new Date().toISOString(),
  };
}

export async function openOrCreateBookingDocumentAction(
  bookingId: string
): Promise<{ error?: string; document?: BookingDocumentRow }> {
  if (!bookingId) return { error: "Không xác định được lịch hẹn." };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("booking_documents")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { document: existing };
  }

  const snapshot = await buildSnapshotPayload(bookingId);
  if (!snapshot) return { error: "Không tìm thấy dữ liệu lịch hẹn." };

  const docCode = `PXN-${snapshot.booking.code.slice(-6)}-${Date.now().toString().slice(-4)}`;

  const { data: created, error } = await supabase
    .from("booking_documents")
    .insert({
      code: docCode,
      booking_id: bookingId,
      snapshot: snapshot as unknown as Json,
      synced_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  return { document: created };
}

export async function createBookingDocumentAction(
  bookingId: string
): Promise<{ error?: string; document?: BookingDocumentRow }> {
  if (!bookingId) return { error: "Vui lòng chọn lịch hẹn cần xuất phiếu." };

  const snapshot = await buildSnapshotPayload(bookingId);
  if (!snapshot) return { error: "Không tìm thấy dữ liệu lịch hẹn." };

  const supabase = await createClient();
  const docCode = `PXN-${snapshot.booking.code.slice(-6)}-${Date.now().toString().slice(-4)}`;

  const { data: created, error } = await supabase
    .from("booking_documents")
    .insert({
      code: docCode,
      booking_id: bookingId,
      snapshot: snapshot as unknown as Json,
      synced_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  return { document: created };
}

export async function syncBookingDocumentAction(
  docId: string,
  bookingId: string
): Promise<{ error?: string; document?: BookingDocumentRow }> {
  const snapshot = await buildSnapshotPayload(bookingId);
  if (!snapshot) return { error: "Lịch hẹn gốc đã bị xóa nên không thể đồng bộ." };

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("booking_documents")
    .update({
      snapshot: snapshot as unknown as Json,
      synced_at: new Date().toISOString(),
    })
    .eq("id", docId)
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  return { document: updated };
}

export async function deleteBookingDocumentAction(docId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("booking_documents").delete().eq("id", docId);
  if (error) return { error: error.message };

  revalidatePath("/bookings");
  return {};
}