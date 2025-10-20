import type { NextApiRequest, NextApiResponse } from "next";

export async function GET(req: Request) {
  const backend =
    process.env.NEXT_PUBLIC_BACKEND_BASE ||
    "http://localhost:3001/api";

  try {
    const url = new URL("/sets", backend).toString();
    const backendRes = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
    });

    if (!backendRes.ok) {
      const text = await backendRes.text().catch(() => "");
      return new Response(JSON.stringify({ error: text || "backend error" }), {
        status: backendRes.status,
        headers: { "content-type": "application/json" },
      });
    }

    const body = await backendRes.json().catch(() => ({}));
    const sets = body.sets ?? body;
    const tags = body.tags ?? [];
    return new Response(JSON.stringify({ sets, tags }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("API proxy /api/sets error:", err);
    return new Response(JSON.stringify({ error: "proxy error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}