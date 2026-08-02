import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("latest_alerts")
      .select("alerts")
      .eq("id", 1)
      .single();

    if (error || !data) {
      return NextResponse.json({ alerts: [] });
    }

    return NextResponse.json({ alerts: data.alerts ?? [] });
  } catch (err: any) {
    console.error("GET /api/alerts error:", err);
    return NextResponse.json({ alerts: [] });
  }
}
