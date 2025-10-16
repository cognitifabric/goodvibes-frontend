import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const c = await cookies();
    const token = c.get("gv_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:3001/api";

    const body = await request.json().catch(() => ({}));

    const resp = await fetch(`${BACKEND}/sets/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const respBody = await resp.json().catch(() => ({}));
    return NextResponse.json(respBody, { status: resp.status });
  } catch (err: any) {
    console.error("Proxy /api/sets/create error:", err?.message ?? err);
    return NextResponse.json({ error: "Failed to contact backend", details: String(err?.message ?? err) }, { status: 502 });
  }
}