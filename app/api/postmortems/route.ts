// app/api/postmortems/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("postmortems")
      .select("*")
      .order("storm_start", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Failed to fetch postmortems:", error);
      return NextResponse.json(
        { error: "Failed to fetch reports" },
        { status: 500 },
      );
    }

    return NextResponse.json({ reports: data ?? [] });
  } catch (err: any) {
    console.error("GET /api/postmortems error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
