import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, parameter, operator, value, label } = body;

    if (!user_id || !parameter || !operator || value == null) {
      return NextResponse.json(
        {
          error: "Missing required fields: user_id, parameter, operator, value",
        },
        { status: 400 },
      );
    }

    const numVal = Number(value);
    if (!Number.isFinite(numVal)) {
      return NextResponse.json(
        { error: "Value must be a finite number" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("user_thresholds")
      .insert({
        user_id,
        parameter,
        operator,
        value: numVal,
        label: label?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", JSON.stringify(error));
      return NextResponse.json(
        { error: `Failed to create threshold: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ threshold: data }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/thresholds error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("user_thresholds")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", JSON.stringify(error));
      return NextResponse.json(
        { error: `Failed to fetch thresholds: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ thresholds: data ?? [] });
  } catch (err: any) {
    console.error("GET /api/thresholds error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
