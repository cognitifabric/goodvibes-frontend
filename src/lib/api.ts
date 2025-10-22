import axios from "axios";
import type { Me, SetDoc } from "./types";

// explicit distinction:
// - BACKEND is the absolute backend host when set (e.g. "https://api.auraandvibes.com/api" or "http://localhost:3001/api")
// - PROXY is the Next.js app-route prefix (same-origin) used from the browser: "/api"
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_BASE || "";
const PROXY = "/api";

// axios instance should target the Next proxy by default so axios calls use same-origin cookies
const http = axios.create({ withCredentials: true, baseURL: PROXY });

// helper to build backend absolute URL when you intentionally want to call the backend host
function backendUrl(path: string) {
  if (!path.startsWith("/")) path = "/" + path;
  if (BACKEND && (BACKEND.startsWith("http://") || BACKEND.startsWith("https://"))) {
    return BACKEND.replace(/\/$/, "") + path;
  }
  // fallback: call proxy path if no BACKEND configured
  return PROXY + path;
}

// helper to build proxy (Next API) URL (always same-origin)
function proxyUrl(path: string) {
  if (!path.startsWith("/")) path = "/" + path;
  return PROXY + path;
}

// emit a friendly toast event on any axios error (non-blocking)
http.interceptors.response.use(
  (r) => r,
  (error) => {
    try {
      const status = error?.response?.status;
      let msg = "Request failed";
      if (status === 401) msg = "Please sign in to continue.";
      else if (error?.response?.data?.error) msg = error.response.data.error;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("queuevibes:toast", { detail: msg }));
      }
    } catch (e) {
      // ignore
    }
    return Promise.reject(error);
  }
);


export async function createSet(payload: {
  name: string;
  description?: string | null;
  tags?: string[];
  collaborators?: string[];
  songs?: { id: string; title?: string; artists?: string; image?: string }[];
  images?: string[];
}) {
  try {
    // use Next proxy to include session cookie
    const res = await http.post("/sets/create", payload);
    return res.data as SetDoc;
  } catch (err: any) {
    console.log(err);
    throw err;
  }
}

export async function queueTracks(trackIds: string[], deviceId?: string, playFirst?: boolean, replace?: boolean): Promise<any> {
  try {
    // MUST call Next proxy so same-origin cookie/session is sent
    const resp = await fetch(proxyUrl("/spotify/queue"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ trackIds, deviceId, playFirst, replace }),
    });

    const body = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const msg = body?.error ?? `Status ${resp.status}`;
      const err = new Error(String(msg));
      (err as any).response = body;
      throw err;
    }

    return body;
  } catch (err: any) {
    const msg = err?.message ?? "Failed to queue tracks";
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("queuevibes:toast", { detail: String(msg) }));
      }
    } catch (e) {
      /* ignore toast failure */
    }
    throw err;
  }
}

export async function playTrack(trackId: string, deviceId?: string): Promise<any> {
  try {
    // call Next proxy so session cookie is included
    const res = await fetch(proxyUrl("/spotify/play"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ trackId, deviceId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error ?? `Status ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.log(err);
    throw err;
  }
}

export async function updateSet(payload: {
  _id: string;
  name?: string;
  description?: string | null;
  tags?: string[];
}): Promise<SetDoc> {
  const id = payload._id;
  const patch: { name?: string; description?: string | null; tags?: string[] } = {};
  if (typeof payload.name !== "undefined") patch.name = payload.name;
  if (typeof payload.description !== "undefined") patch.description = payload.description;
  if (typeof payload.tags !== "undefined") patch.tags = payload.tags;
  const { data } = await http.patch(`/sets/${encodeURIComponent(id)}`, patch);
  return data as SetDoc;
}

export async function updateSetBasic(id: string, patch: { name?: string; description?: string | null; tags?: string[] }): Promise<SetDoc> {
  const { data } = await http.patch(`/sets/${id}`, patch);
  return data;
}

export async function addSongs(id: string, trackIds: string[]) {
  const { data } = await http.post(`/sets/${id}/songs/add`, { trackIds });
  return data as { songs: string[]; added: number; skipped: string[] };
}

export async function replaceSongs(id: string, finalOrder: string[]) {
  const { data } = await http.post(`/sets/${id}/songs/replace`, { finalOrder });
  return data as { songs: string[]; orderChanged: boolean };
}

export async function deleteSet(id: string) {
  await http.delete(`/sets/${id}`);
}

export async function spotifyStart(opts?: { showDialog?: boolean }) {
  const path = proxyUrl(`/spotify/start${opts?.showDialog ? "?showDialog=true" : ""}`);
  const resp = await fetch(path, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`spotifyStart failed: ${resp.status} ${txt}`);
  }
  return resp.json();
}

export async function logout(): Promise<void> {
  const res = await fetch(proxyUrl("/user/auth/logout"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Logout failed: ${res.status}`);
  }
}

export async function getSpotifyStatus(): Promise<{ profile?: any; tokenInfo?: { expiresAt?: number } | null } | null> {
  try {
    // check via Next proxy so session is forwarded and backend can validate tokens
    const res = await fetch(proxyUrl("/account/spotify/me"), {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getMe(): Promise<Me | null> {
  try {
    // ALWAYS call Next proxy /api/user/me from the browser so cookies are sent to Next server
    const res = await fetch(proxyUrl("/user/me"), {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as Me;
  } catch (err) {
    return null;
  }
}

export async function updateSetFull(setId: string, payload: { name?: string; description?: string | null; tags?: string[]; songs?: any[] }) {
  const res = await fetch(proxyUrl(`/sets/${encodeURIComponent(setId)}/full`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body?.error?.message ?? body?.error ?? `Status ${res.status}`);
    (err as any).response = body;
    throw err;
  }
  return res.json();
}
