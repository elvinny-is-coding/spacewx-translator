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
