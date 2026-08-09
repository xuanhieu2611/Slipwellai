import { NextRequest, NextResponse } from "next/server";
import { authErrorUrl, configuredAppOrigin, safeReturnPath } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = configuredAppOrigin(url.origin);
  if (!origin)
    return new NextResponse("Authentication is not configured for this environment.", {
      status: 500,
    });
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(authErrorUrl(origin, "invalid_link"));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(authErrorUrl(origin, "invalid_link"));

  return NextResponse.redirect(new URL(safeReturnPath(url.searchParams.get("next")), origin));
}
