import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendThresholdAlertEmail } from "@/lib/email/alert-email";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Rate limiting: Store sent emails to prevent duplicates
const EMAIL_LOG_TABLE = "email_alert_log";

interface ThresholdBreach {
  thresholdId: string;
  thresholdLabel: string;
  parameter: string;
  operator: string;
  thresholdValue: number;
  currentValue: number;
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
    const breaches: ThresholdBreach[] = body.breaches || [];

    if (!Array.isArray(breaches) || breaches.length === 0) {
      return NextResponse.json(
        { error: "No breaches provided" },
        { status: 400 }
      );
    }

    // Get user's email preferences
    const { data: preferences, error: prefError } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (prefError || !preferences) {
      return NextResponse.json(
        { error: "User preferences not found" },
        { status: 404 }
      );
    }

    // Check if email alerts are enabled and email is verified
    if (!preferences.email_alerts_enabled || !preferences.email_verified) {
      return NextResponse.json(
        { message: "Email alerts not enabled or email not verified" },
        { status: 200 }
      );
    }

    // Get user's email from auth
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.admin.getUserById(user.id);
    
    if (authError || !authUser || !authUser.email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 404 }
      );
    }

    const userEmail = authUser.email;
    const results = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check each breach and send email if not recently sent
    for (const breach of breaches) {
      // Check if we recently sent an email for this threshold breach
      const { data: recentLog } = await supabase
        .from(EMAIL_LOG_TABLE)
        .select("*")
        .eq("user_id", user.id)
        .eq("threshold_id", breach.thresholdId)
        .gte("created_at", oneHourAgo.toISOString())
        .maybeSingle();

      if (recentLog) {
        results.push({
          thresholdId: breach.thresholdId,
          status: "skipped",
          reason: "Recently sent (rate limited)",
        });
        continue;
      }

      // Send email
      const emailResult = await sendThresholdAlertEmail({
        to: userEmail,
        thresholdLabel: breach.thresholdLabel,
        parameter: breach.parameter,
        operator: breach.operator,
        thresholdValue: breach.thresholdValue,
        currentValue: breach.currentValue,
        timestamp: now,
      });

      if (emailResult.success) {
        // Log the sent email
        await supabase
          .from(EMAIL_LOG_TABLE)
          .insert({
            user_id: user.id,
            threshold_id: breach.thresholdId,
            email: userEmail,
            created_at: now.toISOString(),
          });

        results.push({
          thresholdId: breach.thresholdId,
          status: "sent",
        });
      } else {
        results.push({
          thresholdId: breach.thresholdId,
          status: "failed",
          error: emailResult.error,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("POST /api/alerts/send-email error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
