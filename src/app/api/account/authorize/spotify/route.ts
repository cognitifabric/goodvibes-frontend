export async function POST(request: Request) {
  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_BASE || process.env.BACKEND_URL || "http://localhost:3001/api";
  const backendUrl = `${backendBase.replace(/\/$/, "")}/account/authorize/spotify`;

  // helper to unwrap signed/encoded cookie values
  function unwrapToken(raw?: string | null) {
    if (!raw) return null;
    let t = raw;
    if (t.startsWith("s:")) t = t.slice(2);
    try { t = decodeURIComponent(t); } catch {}
    if (t.startsWith('"') && t.endsWith('"')) {
      try { t = JSON.parse(t); } catch {}
    }
    // token might be a JSON object { token: "..." }
    try {
      const maybe = JSON.parse(String(t));
      if (maybe && typeof maybe === "object" && (maybe.token || maybe.accessToken || maybe.value)) {
        return maybe.token ?? maybe.accessToken ?? maybe.value;
      }
    } catch {}
    return t;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const cookieHeader = request.headers.get("cookie") || "";

    // server-side cookie read (next/headers)
    let bearer: string | null = null;
    try {
      const { cookies } = await import("next/headers");
      const store = await cookies();
      const rawGetUser = store.get("getUserSession")?.value ?? null;
      const rawGv = store.get("gv_session")?.value ?? null;
      bearer = unwrapToken(rawGetUser) ?? unwrapToken(rawGv) ?? null;
    } catch (e) {
      // fallback: try to parse cookie header
      const kv = cookieHeader.split(";").map(s => s.trim());
      const getUserKv = kv.find(p => p.startsWith("getUserSession="));
      const gvKv = kv.find(p => p.startsWith("gv_session="));
      bearer = unwrapToken(getUserKv ? decodeURIComponent(getUserKv.split("=")[1] || "") : null) ??
               unwrapToken(gvKv ? decodeURIComponent(gvKv.split("=")[1] || "") : null) ??
               null;
    }

    const headers: Record<string, string> = {
      "content-type": "application/json",
      accept: "application/json",
    };
    if (cookieHeader) headers["cookie"] = cookieHeader;
    if (bearer) headers["authorization"] = `Bearer ${bearer}`;

    const res = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      redirect: "manual",
    });

    const text = await res.text().catch(() => "");
    const contentType = res.headers.get("content-type") || "application/json";
    const location = res.headers.get("location");
    const setCookie = res.headers.get("set-cookie");

    const outHeaders: Record<string, string> = { "content-type": contentType };
    if (location) outHeaders["location"] = location;
    if (setCookie) outHeaders["set-cookie"] = setCookie;

    return new Response(text, { status: res.status, headers: outHeaders });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: "proxy error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}