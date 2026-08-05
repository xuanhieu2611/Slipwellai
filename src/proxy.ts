import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  // `sw.js`, the manifest, and the offline shell are public and must never
  // depend on a session, so they skip the session refresh entirely.
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|sw.js|manifest.webmanifest|offline|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
