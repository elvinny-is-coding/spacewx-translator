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
        // Create or update user preferences with email_verified = true
        const { error: prefError } = await supabase
          .from("user_preferences")
          .upsert({
            user_id: user.id,
            email_verified: true,
            email_alerts_enabled: false,
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          });
        
        if (prefError) {
          console.error("Failed to update user preferences:", prefError);
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
