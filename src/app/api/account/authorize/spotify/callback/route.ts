import { NextRequest, NextResponse } from "next/server";

import { BACKEND } from "@/lib/backend";

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const backendUrl = `${BACKEND}/api/account/authorize/spotify/callback${qs ? `?${qs}` : ""}`;

  const resp = await fetch(backendUrl, {
    method: "GET",
    headers: { Cookie: cookieHeader },
    redirect: "manual",
  });

  // If backend redirects (302/301), forward it
  const location = resp.headers.get("location");
  if (location) {
    const res = NextResponse.redirect(location, { status: resp.status });
    const setCookie = resp.headers.get("set-cookie");
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  }

  // Otherwise proxy the response body
  const data = await resp.json().catch(() => ({}));
  const res = NextResponse.json(data, { status: resp.status });
  const setCookie = resp.headers.get("set-cookie");
  if (setCookie) res.headers.set("set-cookie", setCookie);
  return res;
}
