import axios from "axios";
import type { Me, SetDoc } from "./types";

const API = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:3001/api";
const http = axios.create({ withCredentials: true, baseURL: API });

export async function getMe(): Promise<Me> {
  const { data } = await http.get("/user/me");
  return data;
}

export async function listSets(): Promise<SetDoc[]> {
  const { data } = await http.get("/sets");
  return data?.items || [];
}

export async function createSet(payload: {
  name: string; description?: string | null; tags?: string[]; collaborators?: string[]; songs?: string[];
}): Promise<SetDoc> {
  const { data } = await http.post("/sets", payload);
  return data;
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

export async function spotifyStart(): Promise<{ authorizeUrl: string }> {
  const { data } = await http.post("/user/auth/spotify/start", {
    redirect: typeof window !== "undefined"
      ? window.location.origin + "/oauth/spotify/callback"
      : "",
  });
  return data;
}
