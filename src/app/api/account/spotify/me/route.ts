import { cookies } from "next/headers";

function unwrapToken(raw?: string | null) {
  if (!raw) return null;
  let t = String(raw);
  if (t.startsWith("s:")) t = t.slice(2);
  try { t = decodeURIComponent(t); } catch { }
  if (t.startsWith('"') && t.endsWith('"')) {
    try { t = JSON.parse(t); } catch { }
  }
  try {
    const maybe = JSON.parse(String(t));
    if (maybe && typeof maybe === "object" && (maybe.token || maybe.accessToken || maybe.value)) {
      return maybe.token ?? maybe.accessToken ?? maybe.value;
    }
  } catch { }
  return t;
}

export async function GET(request: Request) {
  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_BASE || process.env.BACKEND_URL || "http://localhost:3001/api";
  const backendUrl = `${backendBase.replace(/\/$/, "")}/account/spotify/me`;

  try {
    const cookieHeader = request.headers.get("cookie") || "";

    // try server-side cookie store first
    let bearer: string | null = null;
    try {
      const store = await cookies();
      const rawGetUser = store.get("getUserSession")?.value ?? null;
      const rawGv = store.get("gv_session")?.value ?? null;
      bearer = unwrapToken(rawGetUser) ?? unwrapToken(rawGv) ?? null;
    } catch {
      // ignore and fall back to cookie header parsing below
    }

    if (!bearer && cookieHeader) {
      const kv = cookieHeader.split(";").map((s) => s.trim());
      const getUserKv = kv.find((p) => p.startsWith("getUserSession="));
      const gvKv = kv.find((p) => p.startsWith("gv_session="));
      bearer =
        unwrapToken(getUserKv ? decodeURIComponent(getUserKv.split("=")[1] || "") : null) ??
        unwrapToken(gvKv ? decodeURIComponent(gvKv.split("=")[1] || "") : null) ??
        null;
    }

    const headers: Record<string, string> = { accept: "application/json" };
    if (cookieHeader) headers["cookie"] = cookieHeader;
    if (bearer) headers["authorization"] = `Bearer ${bearer}`;

    const backendRes = await fetch(backendUrl, {
      method: "GET",
      headers,
      redirect: "manual",
    });

    const text = await backendRes.text().catch(() => "");
    const contentType = backendRes.headers.get("content-type") || "application/json";
    const setCookie = backendRes.headers.get("set-cookie");

    const outHeaders: Record<string, string> = { "content-type": contentType };
    if (setCookie) outHeaders["set-cookie"] = setCookie;

    return new Response(text, { status: backendRes.status, headers: outHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: "proxy error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}