import axios from "axios";
import type { Me, SetDoc } from "./types";

const PROXY = "/api";

const http = axios.create({ withCredentials: true, baseURL: PROXY });

function proxyUrl(path: string) {
  if (!path.startsWith("/")) path = "/" + path;
  return PROXY + path;
}

http.interceptors.response.use(
  (r) => r,
  (error) => {
    try {
      const status = error?.response?.status;
      let msg = "Request failed";
      if (status === 401) msg = "Please sign in to continue.";
      else if (error?.response?.data?.error) msg = error.response.data.error;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("gv:toast", { detail: msg }));
      }
    } catch {}
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
  const res = await http.post("/sets/create", payload);
  return res.data as SetDoc;
}

export async function queueTracks(
  trackIds: string[],
  deviceId?: string,
  playFirst?: boolean,
  replace?: boolean
): Promise<any> {
  const resp = await fetch(proxyUrl("/spotify/queue"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ trackIds, deviceId, playFirst, replace }),
  });

  const body = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const msg = body?.error ?? `Status ${resp.status}`;
    const err = new Error(String(msg)) as any;
    err.response = body;
    throw err;
  }

  return body;
}

export async function playTrack(trackId: string, deviceId?: string): Promise<any> {
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
}

export async function updateSetFull(
  setId: string,
  payload: {
    name?: string;
    description?: string | null;
    tags?: string[];
    songs?: any[];
    images?: string[];
  }
) {
  const res = await fetch(proxyUrl(`/sets/${encodeURIComponent(setId)}/full`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body?.error?.message ?? body?.error ?? `Status ${res.status}`) as any;
    err.response = body;
    throw err;
  }
  return res.json();
}

export async function deleteSet(id: string) {
  const res = await fetch(proxyUrl(`/sets/${encodeURIComponent(id)}`), {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Delete failed: ${res.status}`);
  }
}

export async function spotifyStart(opts?: { showDialog?: boolean }) {
  const resp = await fetch(proxyUrl("/account/authorize/spotify"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ showDialog: opts?.showDialog ?? true }),
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

export async function getSpotifyStatus(): Promise<{
  profile?: any;
  tokenInfo?: { expiresAt?: number } | null;
} | null> {
  try {
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
    const res = await fetch(proxyUrl("/user/me"), {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as Me;
  } catch {
    return null;
  }
}

export async function getSets(): Promise<{ sets: SetDoc[]; tags: string[] }> {
  const res = await fetch(proxyUrl("/sets"), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return { sets: [], tags: [] };
  return res.json();
}
