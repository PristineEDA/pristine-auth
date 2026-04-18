import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles auth callback for email magic links / password reset (backup flow)
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirect_to") ?? "/auth-redirect";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(
        `${origin}${redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`}`
      );
    }
  }

  // If code exchange fails, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
