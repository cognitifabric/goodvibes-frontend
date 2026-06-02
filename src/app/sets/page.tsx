"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Play, Music, Heart, Clock, User, Tag, Loader2, X } from "lucide-react";
import type { SetDoc } from "@/lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────
interface PlayState {
  setId: string;
  status: "creating" | "playing" | "error";
  error?: string;
}

// ─── Spotify Login Modal ─────────────────────────────────────────────────────
function SpotifyLoginModal({ setName, onClose, onLogin }: {
  setName: string;
  onClose: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-green-400">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Connect Spotify to play</h3>
            <p className="text-gray-400 text-sm mt-1">
              Sign in with Spotify to play <span className="text-white font-medium">"{setName}"</span> — it'll be created as a temporary playlist in your account.
            </p>
          </div>
          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-xl px-5 py-3 text-sm transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black flex-shrink-0">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Continue with Spotify
          </button>
          <p className="text-gray-600 text-xs">
            Already have an account?{" "}
            <a href="/login" className="text-green-400 hover:text-green-300 transition-colors">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Set Card ────────────────────────────────────────────────────────────────
function SetCard({
  set,
  onPlay,
  playState,
}: {
  set: SetDoc;
  onPlay: (set: SetDoc) => void;
  playState: PlayState | null;
}) {
  const creator = typeof set.createdBy === "object" ? set.createdBy : null;
  const creatorName = creator
    ? creator.firstName
      ? `${creator.firstName} ${creator.lastName || ""}`.trim()
      : creator.username
    : "Unknown";

  const coverImage = set.images?.[0] || set.songs?.[0]?.image || null;
  const isPlaying = playState?.setId === set._id;
  const songCount = set.songs?.length ?? 0;

  return (
    <div className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-200">
      {/* Cover art */}
      <div className="relative aspect-square bg-gradient-to-br from-green-900/30 to-purple-900/30">
        {coverImage ? (
          <img
            src={coverImage}
            alt={set.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-12 h-12 text-white/20" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={() => onPlay(set)}
            disabled={isPlaying && playState?.status === "creating"}
            className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 disabled:opacity-70 flex items-center justify-center shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all duration-200"
          >
            {isPlaying && playState?.status === "creating" ? (
              <Loader2 className="w-6 h-6 text-black animate-spin" />
            ) : (
              <Play className="w-6 h-6 text-black fill-black ml-0.5" />
            )}
          </button>
        </div>

        {/* Status badge */}
        {isPlaying && playState?.status === "playing" && (
          <div className="absolute bottom-2 left-2 bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
            </span>
            Now playing
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm truncate">{set.name}</h3>
        {set.description && (
          <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{set.description}</p>
        )}

        <div className="flex items-center gap-3 mt-3 text-gray-600 text-xs">
          <span className="flex items-center gap-1">
            <Music className="w-3 h-3" />
            {songCount} track{songCount !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {creatorName}
          </span>
          {(set.lovedBy?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {set.lovedBy!.length}
            </span>
          )}
        </div>

        {set.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {set.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-white/5 text-gray-500 text-xs px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {isPlaying && playState?.status === "error" && (
          <p className="text-red-400 text-xs mt-2">{playState.error}</p>
        )}

        {/* Play button (visible always on mobile) */}
        <button
          onClick={() => onPlay(set)}
          disabled={isPlaying && playState?.status === "creating"}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-60 text-black font-semibold rounded-xl py-2 text-xs transition-colors sm:hidden"
        >
          {isPlaying && playState?.status === "creating" ? (
            <><Loader2 className="w-3 h-3 animate-spin" />Creating playlist…</>
          ) : (
            <><Play className="w-3 h-3 fill-black" />Play on Spotify</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function SetsPage() {
  const [sets, setSets] = useState<SetDoc[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("recent");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [playState, setPlayState] = useState<PlayState | null>(null);
  const [loginModal, setLoginModal] = useState<{ setDoc: SetDoc } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // Check auth status
  useEffect(() => {
    fetch("/api/user/me", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((u) => setIsLoggedIn(!!u?._id))
      .catch(() => setIsLoggedIn(false));
  }, []);

  // Load sets
  const loadSets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (activeTag) params.set("tag", activeTag);
      const res = await fetch(`/api/sets?${params}`);
      const data = await res.json();
      setSets(data.sets ?? []);
      setTags(data.tags ?? []);
    } catch {
      setSets([]);
    } finally {
      setLoading(false);
    }
  }, [sort, activeTag]);

  useEffect(() => { loadSets(); }, [loadSets]);

  async function handlePlay(set: SetDoc) {
    if (!isLoggedIn) {
      setLoginModal({ setDoc: set });
      return;
    }

    const trackIds = set.songs?.map((s) => s.id).filter(Boolean) ?? [];
    if (!trackIds.length) {
      setPlayState({ setId: set._id, status: "error", error: "This set has no tracks." });
      return;
    }

    setPlayState({ setId: set._id, status: "creating" });

    try {
      const res = await fetch("/api/spotify/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ trackIds, playNow: true, name: set.name }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          // Spotify not connected — redirect to Spotify connect
          setPlayState(null);
          setLoginModal({ setDoc: set });
          return;
        }
        throw new Error(data?.error ?? `Error ${res.status}`);
      }

      setPlayState({ setId: set._id, status: "playing" });
      // Clear "now playing" badge after 30s
      setTimeout(() => setPlayState(null), 30_000);
    } catch (e: any) {
      setPlayState({ setId: set._id, status: "error", error: e.message });
    }
  }

  function handleSpotifyLogin() {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    // Store intended set play in session storage so we can resume after login
    if (loginModal) {
      sessionStorage.setItem("gv_play_after_login", loginModal.setDoc._id);
    }
    window.location.href = `${backend}/api/user/auth/spotify/start`;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/5"
        style={{ background: "rgba(10,10,15,0.85)", backdropFilter: "blur(12px)" }}>
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
            <Music className="w-4 h-4 text-black" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">GoodVibes</span>
        </a>
        <div className="flex items-center gap-3">
          <a href="/sets" className="text-green-400 text-sm font-medium">Sets</a>
          {isLoggedIn ? (
            <a href="/dashboard" className="bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl px-4 py-2 text-sm transition-colors">
              Dashboard
            </a>
          ) : (
            <a href="/login" className="bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl px-4 py-2 text-sm transition-colors">
              Sign in
            </a>
          )}
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Public Sets</h1>
          <p className="text-gray-400 mt-2">
            Curated playlists from the community. Click play to listen on Spotify.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {/* Sort */}
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {[
              { value: "recent", label: "Recent" },
              { value: "loved", label: "Popular" },
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => setSort(s.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sort === s.value
                    ? "bg-green-500 text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Tag filters */}
          {tags.slice(0, 12).map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                activeTag === tag
                  ? "bg-green-500/20 border-green-500/50 text-green-400"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
              }`}
            >
              <Tag className="w-3 h-3" />
              {tag}
            </button>
          ))}

          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          </div>
        ) : sets.length === 0 ? (
          <div className="text-center py-24">
            <Music className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-gray-500">
              {activeTag ? `No sets tagged "${activeTag}"` : "No sets yet. Be the first to create one!"}
            </p>
            {isLoggedIn && (
              <a
                href="/dashboard"
                className="inline-block mt-4 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors"
              >
                Create a Set
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {sets.map((set) => (
              <SetCard
                key={set._id}
                set={set}
                onPlay={handlePlay}
                playState={playState?.setId === set._id ? playState : null}
              />
            ))}
          </div>
        )}
      </div>

      {/* Spotify login modal */}
      {loginModal && (
        <SpotifyLoginModal
          setName={loginModal.setDoc.name}
          onClose={() => setLoginModal(null)}
          onLogin={handleSpotifyLogin}
        />
      )}
    </div>
  );
}
