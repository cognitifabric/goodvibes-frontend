import axios from "axios";
import type { Me, SetDoc } from "./types";

// Use Next.js proxy (/api) by default so browser sends gv_session cookie to same origin.
// If you want to call backend directly (cross-origin), set NEXT_PUBLIC_BACKEND_BASE to a full backend URL
// and make sure backend CORS allows credentials and the cookie is set for that origin.
const API = process.env.NEXT_PUBLIC_BACKEND_BASE || "/api";
const http = axios.create({ withCredentials: true, baseURL: API });

export async function createSet(payload: {
  name: string;
  description?: string | null;
  tags?: string[];
  collaborators?: string[];
  // accept song objects now
  songs?: { id: string; title: string; artists?: string; image?: string }[];
  images?: string[];
}): Promise<SetDoc> {
  // force calling Next proxy to include session cookie
  const res = await axios.post("/api/sets/create", payload, { withCredentials: true });
  return res.data as SetDoc;
}

// Queue a single track (or small batch if you pass multiple). This posts to the Next proxy
// which forwards the session to the backend.
export async function queueTracks(trackIds: string[], deviceId?: string, playFirst?: boolean, replace?: boolean) {

  const res = await axios.post(
    "/api/spotify/queue",
    { trackIds, deviceId, playFirst, replace },
    { withCredentials: true }
  );
  return res.data as any;
}

// Play a single track immediately (wrapper for backend /account/spotify/play)
export async function playTrack(trackId: string, deviceId?: string) {
  const res = await axios.post("/api/spotify/play", { trackId, deviceId }, { withCredentials: true });
  return res.data as any;
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
  await http.post("/user/auth/logout");
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
