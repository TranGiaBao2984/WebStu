import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type BookingDocumentRow = Database["public"]["Tables"]["booking_documents"]["Row"];

export interface DocumentSnapshot {
  studio: {
    name: string;
    phone: string | null;
    doc_footer: string | null;
  };
  booking: {
    id: string;
    code: string;
    shortCode: string;
    title: string;
    status: string;
    note: string | null;
  };
  client: {
    name: string;
    phone: string | null;
  };
  items: {
    kind: string;
    name: string;
    amount: number;
  }[];
  sessions: {
    startIso: string | null;
    endIso: string | null;
    location: string | null;
    crew_note: string | null;
  }[];
  financials: {
    total: number;
    paid: number;
    remaining: number;
  };
  generated_at: string;
}

export async function listBookingDocuments(): Promise<BookingDocumentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listBookingDocumentsByBookingId(
  bookingId: string
): Promise<BookingDocumentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_documents")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}