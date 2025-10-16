"use client";
import React, { useEffect, useState } from "react";
import { NeoBtn, NeoInput, NeoSurface } from "../neo/Neo";
import { createSet, spotifyStart } from "@/lib/api";
import { useApp } from "../../_state/DashboardState";
import type { SetDoc } from "@/lib/types";
import useToast from "../../_hooks/useToast";

export default function CreateSetCard({ onCreate }: { onCreate: (s: SetDoc) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const { state } = useApp();

  const { setMsg, ToastEl } = useToast();

  // spotify search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const spotifyLinked = !!state.me?.spotifyUserId;

  // track-level loading state for play buttons
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  // reorder UI state
  const [reorderMode, setReorderMode] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  // placeholder play handler — replace with player integration
  async function playTrack(t: any) {
    try {
      const trackId = t?.id || t;
      // set loading for this track row
      setLoadingTrackId(trackId);
      console.log("Play track request:", trackId);
      const res = await fetch("/api/spotify/play", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ trackId }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const message =
          errBody?.error?.message ||
          errBody?.error ||
          errBody?.details ||
          `Status ${res.status}`;
        // show toast to user
        try { setMsg?.(typeof message === "string" ? message : JSON.stringify(message)); } catch {}
        console.warn("Play request failed", res.status, errBody);
        // clear per-row loading when request failed
        setLoadingTrackId(null);
        return;
      }
      const body = await res.json().catch(() => ({}));
      console.log("Play started:", body);
      // success - clear loading
      setLoadingTrackId(null);
    } catch (err: unknown) {
      // safely extract a useful message from unknown, prefer `error` property if present
      const extractMessage = (e: unknown) => {
        if (!e) return String(e);
        if (typeof e === "string") return e;
        if (e instanceof Error) return e.message;
        try {
          const anyErr = e as any;
          // prefer `error` (could be string or object with message)
          if (anyErr?.error) {
            if (typeof anyErr.error === "string") return anyErr.error;
            if (typeof anyErr.error?.message === "string") return anyErr.error.message;
          }
          if (typeof anyErr?.message === "string") return anyErr.message;
          return JSON.stringify(anyErr);
        } catch {
          return String(e);
        }
      };

      const msg = extractMessage(err);
      console.error("playTrack error", msg);
      try { setMsg?.(`Play request failed: ${msg}`); } catch {}
      // ensure loading cleared on error
      setLoadingTrackId(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    // quick client-side validation to avoid noisy server 400 and provide immediate UX
    if (!name.trim()) {
      try { setMsg?.("Please enter a name for the set."); } catch {}
      return;
    }
    if (pending.length < 1) {
      try { setMsg?.("Please add at least one song to the set."); } catch {}
      return;
    }

    // ensure we have a logged-in user in client state
    if (!state.me?._id) {
      console.error("No logged-in user in state. Aborting createSet.");
      // optional: redirect to login or refresh session
      window.location.href = "/login";
      return;
    }

    setBusy(true);
    try {
      // build images array from pending tracks (use at most 5 images, preserve order,
      // prefer entries that have an image URL). This mirrors doSearch's image extraction.
      const images = pending
        .map((t) => t.image)
        .filter(Boolean) // remove falsy
        .slice(0, 5);

      // ensure at least one image if pending has tracks and at least one image was found
      // (if you must guarantee at least one, you could fallback to a placeholder here)
      const payload = {
        name: name.trim(),
        description: desc.trim() || null,
        tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
        songs: pending,
        ...(images.length ? { images } : {}),
      };

      // send only non-sensitive data; backend uses session to determine creator
      const doc = await createSet(payload);

      // server returns full created set (including songs)
      onCreate(doc);

      // reset local form state
      setName(""); setDesc(""); setTags("");
      setPending([]); setResults([]); setQuery("");

    } catch (err: unknown) {
      console.error("createSet failed", err);

      // friendly field labels
      const FIELD_LABELS: Record<string, string> = {
        name: "Name",
        description: "Description",
        tags: "Tags",
        songs: "Songs",
        images: "Images",
      };

      // Prefer showing backend validation issues if present (axios error shape)
      try {
        const anyErr = err as any;
        const resp = anyErr?.response?.data ?? anyErr;

        if (resp?.error === "ValidationError" && Array.isArray(resp.issues)) {
          // resp.issues: [{ path: "name", message: "Too small..." }, ...]
          const messages = resp.issues.map((i: any) => {
            const path = i.path ?? "(field)";
            const label = FIELD_LABELS[path] || path;
            return `${label}: ${i.message}`;
          });
          setMsg?.(messages.join(" • "));
        } else if (resp?.message) {
          // generic error with message (string)
          setMsg?.(typeof resp.message === "string" ? resp.message : JSON.stringify(resp.message));
        } else if (resp?.error) {
          setMsg?.(typeof resp.error === "string" ? resp.error : JSON.stringify(resp.error));
        } else {
          setMsg?.("Failed to create set");
        }
      } catch {
        try { setMsg?.("Failed to create set"); } catch {}
      }
    } finally {
      setBusy(false);
    }
  }

  async function doSearch(q: string) {
    if (!q.trim() || !spotifyLinked) return;
    setSearching(true);

    try {
      // call the Next proxy so server can forward gv_session as auth
      const res = await fetch(`/api/spotify/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        setResults([]);
        return;
      }
      const body = await res.json();

      console.log("Spotify search results:", body);
      // expect body.items or body.tracks; normalize to array of { id, title, artists }
      const tracks = body.tracks?.items ?? body.tracks?.tracks ?? body.tracks?.results ?? body.items ?? [];
      const normalized = tracks.map((t: any) => {
        const maybeTrack = t.track ?? t;
        const album = maybeTrack.album ?? maybeTrack.albums ?? null;
        const image = album?.images?.[0]?.url ?? maybeTrack.images?.[0]?.url ?? null;
        return {
          id: maybeTrack.id || maybeTrack.uri,
          title: maybeTrack.name,
          artists: (maybeTrack.artists || []).map((a: any) => a.name).join(", "),
          image,
        };
      });
      setResults(normalized.filter(Boolean));
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function addTrack(t: any) {
    // maintain pending as oldest -> newest: append new tracks to the end
    if (!pending.find((p) => p.id === t.id)) setPending((p) => [...p, t]);
  }
  function removeTrack(id: string) {
    setPending((p) => p.filter((x) => x.id !== id));
  }

  async function connectSpotify() {
    // reuse existing api helper
    const { authorizeUrl } = await spotifyStart();
    window.location.href = authorizeUrl;
  }

  // drag handlers for reorder mode (simple HTML5 DnD)
  function handleDragStart(e: React.DragEvent, id: string) {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    // compute new order by moving dragId before overId
    setPending((prev) => {
      const fromIdx = prev.findIndex((x) => x.id === dragId);
      const toIdx = prev.findIndex((x) => x.id === overId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      return next;
    });
  }

  function handleDropEnd() {
    setDragId(null);
  }

  function saveOrderAndClose() {
    setReorderMode(false);
  }

  return (
    <NeoSurface>
      <h3 className="text-lg font-semibold mb-3">Create a new set</h3>
      <form onSubmit={submit} className="space-y-3">
        <NeoInput placeholder="Set name" value={name} onChange={e=>setName(e.target.value)} />
        <NeoInput placeholder="Description (optional)" value={desc} onChange={e=>setDesc(e.target.value)} />
        <NeoInput placeholder="Tags (comma separated)" value={tags} onChange={e=>setTags(e.target.value)} />
        <div className="space-y-3">
          <div>
            <label className="text-sm block mb-2">Add songs</label>
            {!spotifyLinked ? (
              <div className="space-y-2">
                <p className="text-sm text-[var(--neo-muted)]">Connect Spotify to search and add tracks.</p>
                <NeoBtn type="button" onClick={connectSpotify}>Connect Spotify</NeoBtn>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2 max-sm:flex-col max-sm:gap-y-2">
                  <NeoInput
                    placeholder="Search Spotify tracks"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        // trigger search on Enter and keep focus
                        doSearch(query);
                      }
                    }}
                  />
                  <NeoBtn
                    type="button"
                    onClick={() => doSearch(query)}
                    disabled={searching}
                    className="flex items-center gap-2 px-3"
                    aria-busy={searching}
                  >
                    {searching ? (
                      <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="11" cy="11" r="7"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <span>Search</span>
                      </>
                    )}
                  </NeoBtn>
                </div>

                {results.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-80 overflow-y-auto">
                    {results.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50"
                      >
                         <div className="flex items-center gap-3">
                          {r.image ? (
                            <img src={r.image} alt={r.title} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-xs text-[var(--neo-muted)]">No</div>
                          )}
                          <div className="text-sm">
                            <div className="font-medium">{r.title}</div>
                            <div className="text-[var(--neo-muted)] text-xs">{r.artists}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {pending.find((p) => p.id === r.id) ? (
                            <NeoBtn type="button" className="cursor-pointer" onClick={() => removeTrack(r.id)}>Remove</NeoBtn>
                          ) : (
                            <NeoBtn type="button" className="cursor-pointer" onClick={() => addTrack(r)}>Add</NeoBtn>
                          )}
                          <NeoBtn
                            type="button"
                            onClick={() => playTrack(r)}
                            aria-label="Play track"
                            className={`p-2 ${loadingTrackId === r.id ? "opacity-70 cursor-wait" : ""}`}
                            disabled={loadingTrackId === r.id}
                          >
                            {loadingTrackId === r.id ? (
                              <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
                                <path d="M3 22v-20l18 10-18 10z"/>
                              </svg>
                            )}
                          </NeoBtn>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {pending.length > 0 && (
                  <div className="shadow-2xl p-3 border-t-2 border-t-gray-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-[var(--neo-muted)] mb-1">Pending tracks ({pending.length})</div>
                      <div className="flex gap-2">
                        <NeoBtn type="button" className="bg-[var(--color-fifth)]" onClick={() => setReorderMode(true)}>Reorder tracks</NeoBtn>
                      </div>
                    </div>
                    {!reorderMode && (
                      <div className="max-h-40 overflow-y-auto">
                        <ul className="text-sm space-y-1">
                          {pending.map((t) => (
                            <li key={t.id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50">
                              <span className="flex flex-col">
                                <span className="font-medium">{t.title}</span>
                                <small className="text-[var(--neo-muted)]">{t.artists}</small>
                              </span>
                              <div className="flex items-center gap-2">
                                <NeoBtn type="button" className="cursor-pointer" onClick={() => removeTrack(t.id)}>Remove</NeoBtn>
                                <NeoBtn
                                  type="button"
                                  onClick={() => playTrack(t)}
                                  aria-label="Play track"
                                  className={`p-2 ${loadingTrackId === t.id ? "opacity-70 cursor-wait" : ""}`}
                                  disabled={loadingTrackId === t.id}
                                >
                                  {loadingTrackId === t.id ? (
                                    <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
                                      <path d="M3 22v-20l18 10-18 10z"/>
                                    </svg>
                                  )}
                                </NeoBtn>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {reorderMode && (
                      <div className="border rounded p-2 bg-white">
                        <div className="text-sm text-[var(--neo-muted)] mb-2">Drag to reorder tracks</div>
                        <div className="max-h-64 overflow-y-auto">
                          <ul className="space-y-1">
                            {pending.map((t) => (
                              <li
                                key={t.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, t.id)}
                                onDragOver={(e) => handleDragOver(e, t.id)}
                                onDragEnd={handleDropEnd}
                                className="flex items-center justify-between px-2 py-2 rounded bg-slate-50/50 hover:bg-slate-100 cursor-grab"
                              >
                                <div className="flex items-center gap-3">
                                  {t.image ? (
                                    <img src={t.image} alt={t.title} className="w-10 h-10 rounded object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-xs text-[var(--neo-muted)]">No</div>
                                  )}
                                  <div>
                                    <div className="font-medium">{t.title}</div>
                                    <div className="text-[var(--neo-muted)] text-xs">{t.artists}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-xs text-[var(--neo-muted)]">drag</div>
                                  <NeoBtn
                                    type="button"
                                    onClick={() => playTrack(t)}
                                    aria-label="Play track"
                                    className={`p-2 ${loadingTrackId === t.id ? "opacity-70 cursor-wait" : ""}`}
                                    disabled={loadingTrackId === t.id}
                                  >
                                    {loadingTrackId === t.id ? (
                                      <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
                                        <path d="M3 22v-20l18 10-18 10z"/>
                                      </svg>
                                    )}
                                  </NeoBtn>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <NeoBtn type="button" onClick={saveOrderAndClose}>Save order</NeoBtn>
                          <NeoBtn type="button" onClick={() => { setReorderMode(false); }}>Cancel</NeoBtn>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <NeoBtn
              disabled={busy}
              className="flex-1 cursor-pointer flex items-center justify-center gap-2"
              type="submit"
              aria-busy={busy}
            >
              {busy ? (
                <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                </svg>
              )}
              <span>{busy ? "Creating..." : "Create set"}</span>
            </NeoBtn>
          </div>
        </div>
      </form>
      {/* render toast from this component's hook instance */}
      {ToastEl}
    </NeoSurface>
  );
}
