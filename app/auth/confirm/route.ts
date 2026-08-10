import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/alerts";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the user and mark email as verified
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Try to create user preferences with email_verified = true
        const { error: prefError } = await supabase
          .from("user_preferences")
          .insert({
            user_id: user.id,
            email_verified: true,
            email_alerts_enabled: false,
          });
        
        // If insert fails (already exists), try to update
        if (prefError) {
          await supabase
            .from("user_preferences")
            .update({ email_verified: true })
            .eq("user_id", user.id);
        }
      }

      // Get the base URL from the request or environment
      const baseUrl = request.nextUrl.origin;
      return NextResponse.redirect(`${baseUrl}${next}`);
    } else {
      console.error("Auth error:", error);
    }
  }

  // Return the user to an error page with instructions
  const baseUrl = request.nextUrl.origin;
  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`);
}
