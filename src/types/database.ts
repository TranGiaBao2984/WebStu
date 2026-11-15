export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      studio_settings: {
        Row: {
          owner_id: string;
          studio_name: string;
          timezone: string;
          phone: string | null;
          logo_path: string | null;
          doc_footer: string | null;
        };
        Insert: {
          owner_id?: string;
          studio_name?: string;
          timezone?: string;
          phone?: string | null;
          logo_path?: string | null;
          doc_footer?: string | null;
        };
        Update: {
          owner_id?: string;
          studio_name?: string;
          timezone?: string;
          phone?: string | null;
          logo_path?: string | null;
          doc_footer?: string | null;
        };
        Relationships: [];
      };
      service_packages: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          price: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          name: string;
          price: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          price?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          phone: string | null;
          link: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          name: string;
          phone?: string | null;
          link?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          phone?: string | null;
          link?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          code: string;
          owner_id: string;
          client_id: string;
          title: string;
          status: Database["public"]["Enums"]["booking_status"];
          total_price: number;
          note: string | null;
          created_at: string;
          completed_at: string | null;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          code?: string;
          owner_id?: string;
          client_id: string;
          title: string;
          status?: Database["public"]["Enums"]["booking_status"];
          total_price?: number;
          note?: string | null;
          created_at?: string;
          completed_at?: string | null;
          cancelled_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          owner_id?: string;
          client_id?: string;
          title?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          total_price?: number;
          note?: string | null;
          created_at?: string;
          completed_at?: string | null;
          cancelled_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_items: {
        Row: {
          id: string;
          owner_id: string;
          booking_id: string;
          kind: string;
          package_id: string | null;
          name: string;
          amount: number;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          booking_id: string;
          kind: string;
          package_id?: string | null;
          name: string;
          amount: number;
        };
        Update: {
          id?: string;
          owner_id?: string;
          booking_id?: string;
          kind?: string;
          package_id?: string | null;
          name?: string;
          amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_items_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "service_packages";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_sessions: {
        Row: {
          id: string;
          owner_id: string;
          booking_id: string;
          during: string;
          location: string | null;
          crew_note: string | null;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          booking_id: string;
          during: string;
          location?: string | null;
          crew_note?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          booking_id?: string;
          during?: string;
          location?: string | null;
          crew_note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "booking_sessions_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          owner_id: string;
          booking_id: string;
          kind: Database["public"]["Enums"]["payment_kind"];
          amount: number;
          paid_at: string;
          method: string | null;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          booking_id: string;
          kind: Database["public"]["Enums"]["payment_kind"];
          amount: number;
          paid_at?: string;
          method?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          booking_id?: string;
          kind?: Database["public"]["Enums"]["payment_kind"];
          amount?: number;
          paid_at?: string;
          method?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          owner_id: string;
          booking_id: string | null;
          scope: Database["public"]["Enums"]["expense_scope"];
          category: string | null;
          amount: number;
          is_paid: boolean;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          booking_id?: string | null;
          scope: Database["public"]["Enums"]["expense_scope"];
          category?: string | null;
          amount: number;
          is_paid?: boolean;
          paid_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          booking_id?: string | null;
          scope?: Database["public"]["Enums"]["expense_scope"];
          category?: string | null;
          amount?: number;
          is_paid?: boolean;
          paid_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_documents: {
        Row: {
          id: string;
          owner_id: string;
          code: string;
          booking_id: string;
          snapshot: Json;
          synced_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          code: string;
          booking_id: string;
          snapshot: Json;
          synced_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          code?: string;
          booking_id?: string;
          snapshot?: Json;
          synced_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_documents_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      albums: {
        Row: {
          id: string;
          owner_id: string;
          booking_id: string | null;
          title: string;
          source_ref: string;
          max_selectable: number | null;
          due_date: string | null;
          status: Database["public"]["Enums"]["album_status"];
          share_token: string | null;
          selected_files: Json;
          client_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          booking_id?: string | null;
          title: string;
          source_ref: string;
          max_selectable?: number | null;
          due_date?: string | null;
          status?: Database["public"]["Enums"]["album_status"];
          share_token?: string | null;
          selected_files?: Json;
          client_note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          booking_id?: string | null;
          title?: string;
          source_ref?: string;
          max_selectable?: number | null;
          due_date?: string | null;
          status?: Database["public"]["Enums"]["album_status"];
          share_token?: string | null;
          selected_files?: Json;
          client_note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "albums_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      v_booking_financials: {
        Row: {
          booking_id: string | null;
          status: Database["public"]["Enums"]["booking_status"] | null;
          total_price: number | null;
          paid: number | null;
          remaining: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      finance_month: {
        Args: {
          p_month: string;
        };
        Returns: {
          month_start: string;
          signed_revenue: number;
          held_deposit: number;
          delivered_sales: number;
          cash_in: number;
          deposit_in: number;
          balance_in: number;
          refund_out: number;
          cash_out: number;
          cash_out_booking: number;
          cash_out_general: number;
          cogs_delivered: number;
          gross_profit: number | null;
          net_profit: number | null;
          customer_debt: number;
        }[];
      };
      get_public_album: {
        Args: {
          p_token: string;
        };
        Returns: {
          id: string;
          title: string;
          source_ref: string;
          max_selectable: number | null;
          due_date: string | null;
          status: Database["public"]["Enums"]["album_status"];
          selected_files: Json;
          client_note: string | null;
          studio_name: string;
          studio_phone: string | null;
          booking_title: string | null;
          client_name: string | null;
        }[];
      };
      submit_public_album_selection: {
        Args: {
          p_token: string;
          p_selected_files: Json;
          p_client_note: string;
          p_finalize?: boolean;
        };
        Returns: boolean;
      };
    };
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "shooting"
        | "selecting"
        | "selected"
        | "retouching"
        | "retouched"
        | "completed"
        | "cancelled";
      payment_kind: "deposit" | "balance" | "refund";
      expense_scope: "booking" | "general" | "capex";
      album_status:
        | "draft"
        | "awaiting_client"
        | "client_selecting"
        | "client_done"
        | "retouching"
        | "ready"
        | "delivered";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};