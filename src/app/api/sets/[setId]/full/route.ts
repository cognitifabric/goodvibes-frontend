export async function PATCH(req: Request, context: any) {
  // Accept any for the route context to handle Next versions/type differences.
  const params = (context && (context.params ?? (context as any).params)) || {};
  const { setId } = (params as { setId?: string }) || {};
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
    const cookieHeader = req.headers.get("cookie") || "";

    // extract gv_session cookie value (if present) and use it as Bearer token
    let bearerToken: string | null = null;
    if (cookieHeader) {
      const parts = cookieHeader.split(";").map((p) => p.trim());
      const kv = parts.find((p) => p.startsWith("gv_session="));
      if (kv) {
        bearerToken = decodeURIComponent(kv.split("=")[1] || "");
      }
    }

    const forwardHeaders: Record<string, string> = {
      "content-type": "application/json",
      accept: "application/json",
    };

    // forward cookie as well (best-effort)
    if (cookieHeader) forwardHeaders["cookie"] = cookieHeader;
    // pass gv_session as Authorization Bearer so backend AuthMiddleware can validate
    if (bearerToken) forwardHeaders["authorization"] = `Bearer ${bearerToken}`;

    const backendRes = await fetch(backendUrl, {
      method: "PATCH",
      headers: forwardHeaders,
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