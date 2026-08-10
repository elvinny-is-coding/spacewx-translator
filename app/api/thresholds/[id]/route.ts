import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateThreshold } from "@/lib/thresholds";
import type { Threshold } from "@/types/threshold";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { parameter, operator, value, label } = body;

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

    const { data, error } = await supabase
      .from("user_thresholds")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", String(user.id)) // Ensure ownership with string conversion
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
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const { error } = await supabase
      .from("user_thresholds")
      .delete()
      .eq("id", id)
      .eq("user_id", String(user.id)); // Ensure ownership with string conversion

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
