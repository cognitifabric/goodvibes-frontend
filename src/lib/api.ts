import axios from "axios";
import type { Me, SetDoc } from "./types";

// Use Next.js proxy (/api) by default so browser sends gv_session cookie to same origin.
// If you want to call backend directly (cross-origin), set NEXT_PUBLIC_BACKEND_BASE to a full backend URL
// and make sure backend CORS allows credentials and the cookie is set for that origin.
const API = process.env.NEXT_PUBLIC_BACKEND_BASE || "/api";
const http = axios.create({ withCredentials: true, baseURL: API });

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
  // accept song objects now
  songs?: { id: string; title: string; artists?: string; image?: string }[];
  images?: string[];
}) {
  // force calling Next proxy to include session cookie
  try {
    const res = await http.post("/sets/create", payload);
    return res.data as SetDoc;
  } catch (err: any) {
    console.log(err);
    throw err; // <<— ensure we rethrow so the function never implicitly returns undefined
  }
}

// Queue a single track (or small batch if you pass multiple). This posts to the Next proxy
// which forwards the session to the backend.
export async function queueTracks(trackIds: string[], deviceId?: string, playFirst?: boolean, replace?: boolean): Promise<any> {
  try {
    const resp = await fetch("/api/spotify/queue", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ trackIds, deviceId, playFirst, replace }),
    });

    const body = await resp.json().catch(() => ({}));

    // throw for non-2xx so the catch block below handles user messaging
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
    // rethrow so callers can still handle the error if needed
    throw err;
  }
}

// Play a single track immediately (wrapper for backend /account/spotify/play)
export async function playTrack(trackId: string, deviceId?: string): Promise<any> {
  try {
    const res = await http.post("/spotify/play", { trackId, deviceId }, { withCredentials: true });
    return res.data as any;
  } catch (err: any) {
    console.log(err);
    throw err;
  }
}

// Update set (wrapper expected by EditSetCard)
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

export async function updateSetBasic(id: string, patch: {
  name?: string; description?: string | null; tags?: string[];
}): Promise<SetDoc> {
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
  // call the Next proxy route which lives at /api/spotify/start (route.ts uses GET)
  const path = `/api/spotify/start${opts?.showDialog ? "?showDialog=true" : ""}`;

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
  const res = await fetch("/api/user/auth/logout", {
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
    const res = await fetch(`${API}/account/spotify/me`, {
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

// Fetch current user via Next proxy that forwards the session to backend
export async function getMe(): Promise<Me | null> {
  try {
    const res = await fetch(`/api/user/me`, {
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
  const res = await fetch(`/api/sets/${encodeURIComponent(setId)}/full`, {
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
