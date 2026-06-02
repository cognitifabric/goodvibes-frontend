import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "gv_session";

/**
 * GET /auth/callback?token=JWT&next=/dashboard
 *
 * Called by the backend after Spotify/Google OAuth to hand off the session token.
 * Sets the httpOnly cookie from the frontend domain so Next.js middleware can read it.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const next = req.nextUrl.searchParams.get("next") || "/dashboard";

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", req.url));
  }

  const res = NextResponse.redirect(new URL(next, req.url));

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return res;
}
