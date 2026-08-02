import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateThreshold } from "@/lib/thresholds";
import type { Threshold } from "@/types/threshold";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_id, parameter, operator, value, label } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );
    }

    // Build partial threshold for validation
    const partial: Threshold = {
      id,
      parameter: parameter ?? "",
      operator: operator ?? ">",
      value: Number(value ?? 0),
      label: label?.trim() || undefined,
    };

    if (parameter || operator || value != null) {
      const validationError = validateThreshold(partial);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    // Update only provided fields
    const updateData: Record<string, any> = {};
    if (parameter !== undefined) updateData.parameter = parameter;
    if (operator !== undefined) updateData.operator = operator;
    if (value !== undefined) updateData.value = Number(value);
    if (label !== undefined) updateData.label = label?.trim() || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    // Verify ownership before update
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("user_thresholds")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Threshold not found" },
        { status: 404 },
      );
    }
    if (existing.user_id !== user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from("user_thresholds")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { error: "Failed to update threshold" },
        { status: 500 },
      );
    }

    return NextResponse.json({ threshold: data });
  } catch (err: any) {
    console.error("PUT /api/thresholds error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("user_thresholds")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Threshold not found" },
        { status: 404 },
      );
    }
    if (existing.user_id !== user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from("user_thresholds")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete threshold" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/thresholds error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
