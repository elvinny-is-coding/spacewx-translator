import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Auth error:", userError);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { parameter, operator, value, label } = body;

    if (!parameter || !operator || value == null) {
      return NextResponse.json(
        {
          error: "Missing required fields: parameter, operator, value",
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

    console.log("Inserting threshold:", {
      user_id: user.id,
      user_id_string: String(user.id),
      parameter,
      operator,
      value: numVal,
      label
    });

    const { data, error } = await supabase
      .from("user_thresholds")
      .insert({
        user_id: String(user.id), // Convert UUID to string to match existing TEXT schema
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
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("user_thresholds")
      .select("*")
      .eq("user_id", String(user.id)) // Convert UUID to string to match existing TEXT schema
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
