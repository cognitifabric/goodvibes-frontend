import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.GV_BACKEND_URL ?? "https://goodvibes-backend-production.up.railway.app";

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
