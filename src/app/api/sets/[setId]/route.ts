import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:3001";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  const { setId } = await params;
  const cookieHeader = req.headers.get("cookie") || "";
  const body = await req.text();
  const resp = await fetch(`${BACKEND}/api/sets/${encodeURIComponent(setId)}/full`, {
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  const { setId } = await params;
  const cookieHeader = req.headers.get("cookie") || "";
  const resp = await fetch(`${BACKEND}/api/sets/${encodeURIComponent(setId)}`, {
    method: "DELETE",
    headers: { Accept: "application/json", Cookie: cookieHeader },
  });
  const data = await resp.json().catch(() => ({}));
  const res = NextResponse.json(data, { status: resp.status });
  const setCookie = resp.headers.get("set-cookie");
  if (setCookie) res.headers.set("set-cookie", setCookie);
  return res;
}
