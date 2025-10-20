import { NextRequest } from "next/server";

export async function PATCH(req: Request, context: any) {
  // Accept a flexible route context to satisfy Next's typing differences across versions.
  const params = (context && (context.params ?? (context as any).params)) || {};
  const setId = String((params as { setId?: string }).setId ?? "");
  if (!setId) {
    return new Response(JSON.stringify({ error: "Missing setId parameter" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_BASE || process.env.BACKEND_URL || "http://localhost:3001/api";
  const backendUrl = `${backendBase.replace(/\/$/, "")}/sets/${encodeURIComponent(setId)}/full`;

  try {
    const body = await req.json().catch(() => ({}));

    // forward incoming request cookies so backend can authenticate
    const cookieHeader = req.headers.get("cookie") || "";

    const backendRes = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        cookie: cookieHeader,
      },
      body: JSON.stringify(body),
    });

    const text = await backendRes.text().catch(() => "");
    const contentType = backendRes.headers.get("content-type") || "application/json";

    return new Response(text, {
      status: backendRes.status,
      headers: { "content-type": contentType },
    });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("Proxy /api/sets/[setId]/full error:", err);
    return new Response(JSON.stringify({ error: "proxy error" }), { status: 500, headers: { "content-type": "application/json" } });
  }
}