import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { trackIds, deviceId, playFirst } = body as {
      trackIds?: string[]; deviceId?: string; playFirst?: boolean;
    };

    if (!Array.isArray(trackIds) || trackIds.length === 0) {
      return NextResponse.json({ error: "Missing trackIds" }, { status: 400 });
    }

    const user = await getSessionUser();
    const c = await cookies();
    const token = c.get("gv_session")?.value;

    if (!user?.id || !token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:3001";

    try {
      const resp = await fetch(`${BACKEND}/sets/spotify/queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trackIds, deviceId, playFirst }),
      });

      const data = await resp.json().catch(() => ({}));
      return NextResponse.json(data, { status: resp.status });
    } catch (err: any) {
      console.error("Error proxying to backend /account/spotify/queue:", err);
      return NextResponse.json({ error: "Failed to contact backend" }, { status: 502 });
    }
  } catch (err: any) {
    console.error("/api/account/spotify/queue unexpected error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}