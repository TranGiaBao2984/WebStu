import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    const supabase = await createClient();
    // Truy vấn nhẹ để giữ kết nối PostgreSQL hoạt động (tránh auto-pause gói Free)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("portfolio_photos")
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: "degraded",
          database: "error",
          message: error.message,
          latency_ms: Date.now() - startedAt,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "ok",
      database: "connected",
      latency_ms: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}