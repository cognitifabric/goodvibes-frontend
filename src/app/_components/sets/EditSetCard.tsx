"use client";
import React, { useEffect, useState } from "react";
import { NeoBtn, NeoInput, NeoSurface } from "../neo/Neo";
import type { SetDoc } from "@/lib/types";
import { updateSetFull, deleteSet, addSongs } from "@/lib/api";
import useToast from "../../_hooks/useToast";
import { spotifyStart } from "@/lib/api"; // reuse spotify connect helper
import { useApp } from "../../_state/DashboardState";

export default function EditSetCard({
  initialSet,
  onSave,
  onDelete,
  onCancel,
}: {
  initialSet: SetDoc;
  onSave: (s: SetDoc) => void;
  onDelete: (id: string) => void;
  onCancel?: () => void;
}) {
  const { setMsg, ToastEl } = useToast();
  const { state } = useApp();

  const [name, setName] = useState(initialSet.name || "");
  const [desc, setDesc] = useState(initialSet.description ?? "");
  const [tags, setTags] = useState((initialSet.tags || []).join(", "));
  const [pending, setPending] = useState<any[]>(initialSet.songs ? [...initialSet.songs] : []);
  const [results, setResults] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);

  // reorder state
  const [reorderMode, setReorderMode] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    // keep local pending synced if initialSet changes externally
    setPending(initialSet.songs ? [...initialSet.songs] : []);
    setName(initialSet.name || "");
    setDesc(initialSet.description ?? "");
    setTags((initialSet.tags || []).join(", "));
  }, [initialSet]);

  async function doSearch(q: string) {
    if (!q.trim() || !state.me?.spotifyUserId) return;
    setSearching(true);
    try {
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
      const tracks = body.tracks?.items ?? body.tracks?.tracks ?? body.items ?? body.tracks ?? [];
      const normalized = (tracks as any[]).map((t: any) => {
        const maybeTrack = t.track ?? t;
        const album = maybeTrack.album ?? null;
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
    console.log(t)
    if (!pending.find((p) => p.id === t.id)) setPending((p) => [...p, t]);
  }
  function removeTrack(id: string) {
    setPending((p) => p.filter((x) => x.id !== id));
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  }
  function handleDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
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

  async function connectSpotify() {
    const { authorizeUrl } = await spotifyStart();
    window.location.href = authorizeUrl;
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setMsg?.("Please enter a name.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        description: desc.trim() || null,
        tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
        // send full songs array (service will map/validate)
        songs: pending.map((s) => ({ id: s.id, title: s.title, artists: s.artists, image: s.image })),
      };

      // Use single atomic API to update metadata + songs
      const updated = await updateSetFull(initialSet._id, payload);

      // Build updated set doc for UI (server returns updated set)
      const pendingImages = pending.map((t) => t.image).filter(Boolean).slice(0, 5);
      const images =
        updated.images ??
        (pendingImages.length ? pendingImages : (initialSet.images ?? []));
      
      const updatedDoc: SetDoc = {
        ...initialSet,
        _id: updated._id ?? initialSet._id,
        name: updated.name ?? payload.name,
        description: typeof updated.description !== "undefined" ? updated.description : payload.description,
        tags: updated.tags ?? payload.tags,
        songs: updated.songs ?? payload.songs,
        images,
      };

      onSave?.(updatedDoc);
      setMsg?.("Set updated");
    } catch (err: unknown) {
      console.error("EditSetCard save", err);
      setMsg?.("Failed to save set");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this set? This action cannot be undone.")) return;
    setBusy(true);
    try {
      await deleteSet(initialSet._id);
      onDelete?.(initialSet._id);
    } catch (err) {
      console.error("EditSetCard delete", err);
      setMsg?.("Failed to delete set");
    } finally {
      setBusy(false);
    }
  }

  return (
    <NeoSurface className="p-0">
      {/* make form a column with a scrollable content area and a sticky footer */}
      <form onSubmit={handleSave} className="flex flex-col max-h-[calc(100vh-120px)] w-full">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Edit set</h3>
            <div className="flex items-center gap-2">
              <NeoBtn onClick={onCancel} className="text-sm px-3 py-1">Cancel</NeoBtn>
              <NeoBtn onClick={handleDelete} className="text-sm px-3 py-1 bg-rose-500 text-white!">Delete</NeoBtn>
            </div>
          </div>
        </div>

        {/* scrollable content */}
        <div className="p-4 overflow-auto flex-1 space-y-3">
          <NeoInput placeholder="Set name" value={name} onChange={(e: any) => setName(e.target.value)} />
          <NeoInput placeholder="Description (optional)" value={desc} onChange={(e: any) => setDesc(e.target.value)} />
          <NeoInput placeholder="Tags (comma separated)" value={tags} onChange={(e: any) => setTags(e.target.value)} />

          <div className="space-y-3">
            <div>
              <label className="text-sm block mb-2">Add songs</label>
              {!state.me?.spotifyUserId ? (
                <div className="space-y-2">
                  <p className="text-sm text-[var(--neo-muted)]">Connect Spotify to search and add tracks.</p>
                  <NeoBtn type="button" onClick={connectSpotify}>Connect Spotify</NeoBtn>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <NeoInput
                      placeholder="Search Spotify tracks"
                      value={query}
                      onChange={(e: any) => setQuery(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
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

                  {/* bounded, scrollable results so the modal never grows beyond viewport */}
                  {results.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-[40vh] overflow-y-auto">
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
                            <NeoBtn type="button" aria-label="Play track" className={`p-2`}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
                                <path d="M3 22v-20l18 10-18 10z" />
                              </svg>
                            </NeoBtn>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* pending area bounded as well */}
                  {pending.length > 0 && (
                    <div className="shadow-2xl p-3 border-t-2 border-t-gray-300">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-[var(--neo-muted)] mb-1">Pending tracks ({pending.length})</div>
                        <div className="flex gap-2">
                          <NeoBtn type="button" className="bg-[var(--color-fifth)]" onClick={() => setReorderMode(true)}>Reorder tracks</NeoBtn>
                        </div>
                      </div>
                      {!reorderMode && (
                        <div className="max-h-[30vh] overflow-y-auto">
                          <ul className="text-sm space-y-1">
                            {pending.map((t) => (
                              <li key={t.id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50">
                                <span className="flex flex-col">
                                  <span className="font-medium">{t.title}</span>
                                  <small className="text-[var(--neo-muted)]">{t.artists}</small>
                                </span>
                                <div className="flex items-center gap-2">
                                  <NeoBtn type="button" className="cursor-pointer" onClick={() => removeTrack(t.id)}>Remove</NeoBtn>
                                  <NeoBtn type="button" aria-label="Play track" className={`p-2`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
                                      <path d="M3 22v-20l18 10-18 10z" />
                                    </svg>
                                  </NeoBtn>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* reorder mode (bounded) */}
                      {reorderMode && (
                        <div className="border rounded p-2 bg-white">
                          <div className="text-sm text-[var(--neo-muted)] mb-2">Drag to reorder tracks</div>
                          <div className="max-h-[40vh] overflow-y-auto">
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
                                    <NeoBtn type="button" className={`p-2`} aria-label="Play track">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
                                        <path d="M3 22v-20l18 10-18 10z" />
                                      </svg>
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
          </div>
        </div>

        {/* sticky footer so action buttons are always reachable */}
        <div className="p-4 border-t flex gap-2">
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
            <span>{busy ? "Saving..." : "Save changes"}</span>
          </NeoBtn>
        </div>

        {ToastEl}
      </form>
    </NeoSurface>
  );
}