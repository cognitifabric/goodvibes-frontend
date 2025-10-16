// middleware.ts
import { NextResponse, NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "gv_session"; // change to "gv_token" if you prefer
const secret = new TextEncoder().encode(process.env.AUTH_JWT_SECRET);

// Which routes are protected
export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    // add more protected roots here e.g. "/sets/:path*", "/account/:path*"
  ],
};

async function verifyJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { sub?: string; username?: string; plan?: string; exp?: number };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const payload = await verifyJwt(token);
  if (!payload) {
    // Invalid/expired: clear cookie (optional) and redirect
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    const resp = NextResponse.redirect(url);
    resp.cookies.set({
      name: COOKIE_NAME,
      value: "",
      path: "/",
      maxAge: 0,
    });
    return resp;
  }

  // Attach user info to request headers so server components can read it (optional)
  const resp = NextResponse.next();
  resp.headers.set("x-user-id", String(payload.sub || ""));
  resp.headers.set("x-user-name", String(payload.username || ""));
  resp.headers.set("x-user-plan", String(payload.plan || ""));
  return resp;

}
