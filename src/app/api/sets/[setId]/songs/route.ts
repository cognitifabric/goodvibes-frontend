import { NextRequest, NextResponse } from "next/server";

import { BACKEND } from "@/lib/backend";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  const { setId } = await params;
  const cookieHeader = req.headers.get("cookie") || "";
  const body = await req.text();
  const resp = await fetch(`${BACKEND}/api/sets/${encodeURIComponent(setId)}/songs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body,
  });
  const data = await resp.json().catch(() => ({}));
  const res = NextResponse.json(data, { status: resp.status });
  const setCookie = resp.headers.get("set-cookie");
  if (setCookie) res.headers.set("set-cookie", setCookie);
  return res;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  const { setId } = await params;
  const cookieHeader = req.headers.get("cookie") || "";
  const body = await req.text();
  const resp = await fetch(`${BACKEND}/api/sets/${encodeURIComponent(setId)}/songs`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body,
  });
  const data = await resp.json().catch(() => ({}));
  const res = NextResponse.json(data, { status: resp.status });
  const setCookie = resp.headers.get("set-cookie");
  if (setCookie) res.headers.set("set-cookie", setCookie);
  return res;
}
