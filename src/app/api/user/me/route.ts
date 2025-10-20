import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const c = await cookies();
    const token = c.get("gv_session")?.value;

    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:3001";

    try {
      const resp = await fetch(`${BACKEND}/user/by-id`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const body = await resp.json().catch(() => null);

      // If we successfully fetched the user, also check backend Spotify token status.
      // If tokens are missing/invalid, clear spotifyUserId so frontend shows "not connected".
      if (resp.ok && body) {
        try {
          const spotifyRes = await fetch(`${BACKEND}/account/spotify/me`, {
            method: "GET",
            headers: {
              Accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const spotifyBody = await spotifyRes.json().catch(() => null);
          // If spotify endpoint returns tokenInfo, mark connected and ensure spotifyUserId is set.
          if (spotifyRes.ok && spotifyBody && spotifyBody.tokenInfo) {
            body.spotifyConnected = true;
            body.spotifyUserId = spotifyBody.profile?.id ?? body.spotifyUserId;
          } else {
            // no tokens => not connected
            body.spotifyConnected = false;
            body.spotifyUserId = undefined;
          }
        } catch (e) {
          // on error, be conservative: treat as not connected
          body.spotifyConnected = false;
          body.spotifyUserId = undefined;
        }
      }

      return NextResponse.json(body, { status: resp.status });
    } catch (err: any) {
      console.error("Error proxying to backend /user/by-id:", err);
      return NextResponse.json({ error: "Failed to contact backend" }, { status: 502 });
    }
  } catch (err: any) {
    console.error("/api/user/me unexpected error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}