import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.GV_BACKEND_URL ?? "https://goodvibes-backend-production.up.railway.app";

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  const body = await req.text();
  const resp = await fetch(`${BACKEND}/api/user/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body,
  });
  const data = await resp.json();
  const res = NextResponse.json(data, { status: resp.status });
  const setCookie = resp.headers.get("set-cookie");
  if (setCookie) res.headers.set("set-cookie", setCookie);
  return res;
}
