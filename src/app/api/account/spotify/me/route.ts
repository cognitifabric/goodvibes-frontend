import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  const resp = await fetch(`${BACKEND}/api/account/spotify/me`, {
    method: "GET",
    headers: { Accept: "application/json", Cookie: cookieHeader },
  });
  const data = await resp.json().catch(() => ({}));
  const res = NextResponse.json(data, { status: resp.status });
  const setCookie = resp.headers.get("set-cookie");
  if (setCookie) res.headers.set("set-cookie", setCookie);
  return res;
}
