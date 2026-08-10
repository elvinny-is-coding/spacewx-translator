import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      // If no preferences exist yet, return default values
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          email_alerts_enabled: false,
          email_verified: false,
        });
      }
      console.error("Supabase fetch error:", JSON.stringify(error));
      return NextResponse.json(
        { error: `Failed to fetch preferences: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("GET /api/user-preferences error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email_alerts_enabled = false, email_verified = false } = body;

    const { data, error } = await supabase
      .from("user_preferences")
      .insert({
        user_id: user.id,
        email_alerts_enabled,
        email_verified,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", JSON.stringify(error));
      return NextResponse.json(
        { error: `Failed to create preferences: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/user-preferences error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email_alerts_enabled, email_verified } = body;

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    if (email_alerts_enabled !== undefined) updateData.email_alerts_enabled = email_alerts_enabled;
    if (email_verified !== undefined) updateData.email_verified = email_verified;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // First check if preferences exist
    const { data: existing } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let result;
    if (!existing) {
      // Create if doesn't exist
      result = await supabase
        .from("user_preferences")
        .insert({
          user_id: user.id,
          ...updateData,
        })
        .select()
        .single();
    } else {
      // Update if exists
      result = await supabase
        .from("user_preferences")
        .update(updateData)
        .eq("user_id", user.id)
        .select()
        .single();
    }

    const { data, error } = result;

    if (error) {
      console.error("Supabase update error:", JSON.stringify(error));
      return NextResponse.json(
        { error: `Failed to update preferences: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("PUT /api/user-preferences error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
