"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Search,
  Plus,
  ChevronUp,
  ChevronDown,
  X,
  Save,
  Play,
  Loader2,
  ArrowLeft,
  Music,
} from "lucide-react";
import { useApp } from "@/app/_state/AppContext";
import { updateSetFull, queueTracks } from "@/lib/api";
import { useDebounce } from "@/app/_hooks/useDebounce";  // named export
import type { SetDoc, SongObject } from "@/lib/types";

// ─── Song Row ──────────────────────────────────────────────────────────────

function SongRow({
  song,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  song: SongObject;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 group transition-colors">
      {/* Artwork */}
      <div className="w-10 h-10 rounded-lg bg-white/5 flex-shrink-0 overflow-hidden">
        {song.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={song.image} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-4 h-4 text-gray-600" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{song.title}</p>
        {song.artists && <p className="text-gray-500 text-xs truncate">{song.artists}</p>}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          title="Move up"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          title="Move down"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRemove}
          title="Remove"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Search Result Row ──────────────────────────────────────────────────────

function SearchResultRow({
  track,
  onAdd,
  added,
}: {
  track: SongObject;
  onAdd: () => void;
  added: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 group transition-colors">
      <div className="w-10 h-10 rounded-lg bg-white/5 flex-shrink-0 overflow-hidden">
        {track.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.image} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-4 h-4 text-gray-600" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{track.title}</p>
        {track.artists && <p className="text-gray-500 text-xs truncate">{track.artists}</p>}
      </div>
      <button
        onClick={onAdd}
        disabled={added}
        className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
          added
            ? "bg-green-500/20 text-green-400 cursor-default"
            : "text-gray-500 hover:text-white hover:bg-white/10"
        }`}
        title={added ? "Already added" : "Add to set"}
      >
        {added ? (
          <span className="text-xs font-bold">✓</span>
        ) : (
          <Plus className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

// ─── Set Detail Page ────────────────────────────────────────────────────────

export default function SetDetailPage() {
  const params = useParams();
  const setId = params?.setId as string;

  const { state, dispatch } = useApp();
  const setDoc = state.sets.find((s) => s._id === setId) ?? null;

  // Editable fields
  const [name, setName] = useState(setDoc?.name ?? "");
  const [description, setDescription] = useState(setDoc?.description ?? "");
  const [tagsInput, setTagsInput] = useState(setDoc?.tags?.join(", ") ?? "");
  const [songs, setSongs] = useState<SongObject[]>(setDoc?.songs ?? []);

  // State flags
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [queueing, setQueueing] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SongObject[]>([]);
  const [searching, setSearching] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 450);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Sync from context if set arrives later
  useEffect(() => {
    if (setDoc && !dirty) {
      setName(setDoc.name);
      setDescription(setDoc.description ?? "");
      setTagsInput(setDoc.tags?.join(", ") ?? "");
      setSongs(setDoc.songs ?? []);
    }
  }, [setDoc?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Spotify search
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    searchAbortRef.current?.abort();
    searchAbortRef.current = controller;

    setSearching(true);
    fetch("/api/spotify/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ query: debouncedSearch }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (!controller.signal.aborted) {
          const tracks: SongObject[] = Array.isArray(data?.tracks)
            ? data.tracks
            : Array.isArray(data)
            ? data
            : [];
          setSearchResults(tracks);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setSearching(false);
      });

    return () => controller.abort();
  }, [debouncedSearch]);

  function moveSong(index: number, direction: -1 | 1) {
    const newSongs = [...songs];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= newSongs.length) return;
    [newSongs[index], newSongs[swapIndex]] = [newSongs[swapIndex], newSongs[index]];
    setSongs(newSongs);
    setDirty(true);
  }

  function removeSong(index: number) {
    setSongs(songs.filter((_, i) => i !== index));
    setDirty(true);
  }

  function addSong(track: SongObject) {
    if (songs.some((s) => s.id === track.id)) return;
    setSongs([...songs, track]);
    setDirty(true);
  }

  async function handleSave() {
    if (!setId) return;
    setSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const updated = await updateSetFull(setId, {
        name: name.trim(),
        description: description.trim() || null,
        tags,
        songs,
      });
      dispatch({ type: "UPDATE_SET", set: updated });
      setDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent("gv:toast", { detail: err?.message ?? "Failed to save set" })
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleQueueAndPlay() {
    if (!setId || songs.length === 0) return;
    setQueueing(true);
    try {
      const trackIds = songs.map((s) => s.id);
      await queueTracks(trackIds, undefined, true, true);
      window.dispatchEvent(
        new CustomEvent("gv:toast", { detail: "✅ Set queued on Spotify!" })
      );
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent("gv:toast", {
          detail: err?.message ?? "Failed to queue. Is Spotify open?",
        })
      );
    } finally {
      setQueueing(false);
    }
  }

  const addedIds = new Set(songs.map((s) => s.id));

  if (!setDoc && state.sets.length > 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <div className="glass rounded-2xl p-12">
          <p className="text-gray-400">Set not found.</p>
          <a href="/dashboard" className="text-green-400 hover:text-green-300 text-sm mt-4 inline-block">
            ← Back to dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
      {/* Back */}
      <a
        href="/dashboard"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </a>

      {/* Set meta */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
            Set Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setDirty(true); }}
            placeholder="Set name"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors text-base font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setDirty(true); }}
            rows={2}
            placeholder="Describe the vibe…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
            Tags
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => { setTagsInput(e.target.value); setDirty(true); }}
            placeholder="chill, house, evening (comma separated)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors text-sm"
          />
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl px-5 py-2.5 text-sm transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : saveSuccess ? (
              <>
                <span>✓</span>
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Songs list */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold">
            Songs{" "}
            <span className="text-gray-500 font-normal text-sm">({songs.length})</span>
          </h2>
        </div>

        {songs.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Music className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No songs yet. Search below to add some.</p>
          </div>
        ) : (
          <div className="p-2">
            {songs.map((song, i) => (
              <SongRow
                key={song.id}
                song={song}
                index={i}
                total={songs.length}
                onMoveUp={() => moveSong(i, -1)}
                onMoveDown={() => moveSong(i, 1)}
                onRemove={() => removeSong(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Spotify Search */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold mb-3">Search Spotify</h2>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for songs, artists…"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors text-sm"
            />
            {searching && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin" />
            )}
          </div>
        </div>

        {searchResults.length > 0 ? (
          <div className="p-2 max-h-80 overflow-y-auto">
            {searchResults.map((track) => (
              <SearchResultRow
                key={track.id}
                track={track}
                added={addedIds.has(track.id)}
                onAdd={() => addSong(track)}
              />
            ))}
          </div>
        ) : searchQuery && !searching ? (
          <div className="px-5 py-8 text-center text-gray-500 text-sm">
            No results for &ldquo;{searchQuery}&rdquo;
          </div>
        ) : !searchQuery ? (
          <div className="px-5 py-8 text-center text-gray-600 text-sm">
            Type to search songs
          </div>
        ) : null}
      </div>

      {/* Queue & Play */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl px-5 py-3 text-sm transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={handleQueueAndPlay}
          disabled={queueing || songs.length === 0}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-5 py-3 text-sm transition-colors"
        >
          {queueing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Queueing…
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              Queue &amp; Play on Spotify
            </>
          )}
        </button>
      </div>
    </div>
  );
}
