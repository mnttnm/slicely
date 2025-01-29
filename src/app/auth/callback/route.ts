/* eslint-disable n/no-process-env */
import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/server/services/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
      const baseUrl = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
      
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth/auth-code-error`);
}