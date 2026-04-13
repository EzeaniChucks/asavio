// proxy.ts  (Next.js 16+ replaces middleware.ts)
// Runs on the Vercel edge on every page request.
// Reads the Vercel geo IP header and writes it to a short-lived cookie
// so client components can read it without an extra API call.

import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Only set the cookie if it isn't already present (avoid re-writing on every request)
  if (!request.cookies.has("asavio_country")) {
    // Vercel sets x-vercel-ip-country automatically on the edge network.
    // In local dev this header is absent — we treat that as Nigeria (NGN default).
    const country = request.headers.get("x-vercel-ip-country") ?? "NG";

    response.cookies.set("asavio_country", country, {
      path: "/",
      maxAge: 60 * 60 * 24, // refresh once per day
      sameSite: "lax",
      httpOnly: false,       // readable by client-side JS
    });
  }

  return response;
}

export const config = {
  // Run on all page routes; skip static files, images, and API routes
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)",
  ],
};
