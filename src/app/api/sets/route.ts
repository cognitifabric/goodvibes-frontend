import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "https://goodvibes-backend-production.up.railway.app";

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const url = `${BACKEND}/api/sets?${req.nextUrl.searchParams.toString()}`;
    const resp = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json", Cookie: cookieHeader },
    });
    const data = await resp.json().catch(() => ({}));
    const res = NextResponse.json(data, { status: resp.status });
    const setCookie = resp.headers.get("set-cookie");
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "proxy error", backend: BACKEND }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const body = await req.text();
    const resp = await fetch(`${BACKEND}/api/sets/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body,
    });
    const data = await resp.json().catch(() => ({}));
    const res = NextResponse.json(data, { status: resp.status });
    const setCookie = resp.headers.get("set-cookie");
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "proxy error", backend: BACKEND }, { status: 500 });
  }
}
