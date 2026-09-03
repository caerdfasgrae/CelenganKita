import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/v1/webhook (biarkan webhook diproses tanpa cookie session)
     * - icons/ (PWA icons)
     * - manifest.json (PWA manifest)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/v1/webhook|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
