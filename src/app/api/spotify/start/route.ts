import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {

    const user = await getSessionUser();
    const c = await cookies();
    const token = c.get("gv_session")?.value;

    if (!token || !user) {
      console.log("spotify/start POST: not authenticated");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:3001/api";

    try {
      const resp = await fetch(`${BACKEND}/account/authorize/spotify`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(user || {}),
      });

      const respBody = await resp.json().catch(() => ({}));
      return NextResponse.json(respBody, { status: resp.status });

    } catch (err: any) {
      console.error("Error proxying POST to backend:", BACKEND, err?.message ?? err);
      return NextResponse.json(
        { error: "Failed to contact backend", details: err?.message ?? String(err) },
        { status: 502 }
      );
    }
  } catch (err: any) {
    console.error("Unexpected error in /api/spotify/start POST:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}