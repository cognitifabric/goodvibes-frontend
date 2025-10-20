import { cookies } from "next/headers";

function tryUnwrap(token?: string | null) {
  if (!token) return null;
  let t = token;
  if (t.startsWith("s:")) t = t.slice(2);
  try { t = decodeURIComponent(t); } catch { }
  if (t.startsWith('"') && t.endsWith('"')) {
    try { t = JSON.parse(t); } catch { }
  }
  try {
    const maybe = JSON.parse(t);
    if (maybe && typeof maybe === "object" && (maybe.token || maybe.accessToken || maybe.value)) {
      return maybe.token ?? maybe.accessToken ?? maybe.value;
    }
  } catch { }
  return t;
}

export async function POST(req: Request) {
  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_BASE || process.env.BACKEND_URL || "http://localhost:3001/api";
  const backendUrl = `${backendBase.replace(/\/$/, "")}/user/auth/logout`;

  try {
    const body = await req.json().catch(() => ({}));
    const cookieHeader = req.headers.get("cookie") || "";

    // Prefer existing Authorization header if caller set one (useful in tests)
    let bearerToken: string | null = null;
    const incomingAuth = req.headers.get("authorization");
    if (incomingAuth && incomingAuth.toLowerCase().startsWith("bearer ")) {
      bearerToken = incomingAuth.slice(7).trim();
    } else {
      // server-side cookie read fallback
      try {
        const cookieStore = await cookies();
        const rawGv = cookieStore.get("gv_session")?.value;
        const rawGetUser = cookieStore.get("getUserSession")?.value;
        bearerToken = tryUnwrap(rawGetUser) ?? tryUnwrap(rawGv) ?? null;
        // eslint-disable-next-line no-console
        console.log("logout proxy cookies:", { rawGetUser: !!rawGetUser, rawGv: !!rawGv, parsedBearer: !!bearerToken });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("logout proxy: failed to read cookies", err);
      }
    }

    const forwardHeaders: Record<string, string> = {
      "content-type": "application/json",
      accept: "application/json",
    };
    if (cookieHeader) forwardHeaders["cookie"] = cookieHeader;
    if (bearerToken) forwardHeaders["authorization"] = `Bearer ${bearerToken}`;

    // eslint-disable-next-line no-console
    console.log("logout proxy -> backend headers:", Object.keys(forwardHeaders));

    const backendRes = await fetch(backendUrl, {
      method: "POST",
      headers: forwardHeaders,
      body: JSON.stringify(body),
    });

    // eslint-disable-next-line no-console
    console.log("logout proxy <- backend status:", backendRes.status);

    const text = await backendRes.text().catch(() => "");
    const contentType = backendRes.headers.get("content-type") || "application/json";
    const setCookie = backendRes.headers.get("set-cookie");

    const headers: Record<string, string> = { "content-type": contentType };
    if (setCookie) {
      // forward Set-Cookie so browser can clear the cookie
      headers["set-cookie"] = setCookie;
    }

    return new Response(text, { status: backendRes.status, headers });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("Proxy /api/user/auth/logout error:", err);
    return new Response(JSON.stringify({ error: "proxy error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}