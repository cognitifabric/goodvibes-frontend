"use client";
import React, { useState } from "react";
import { NeoSurface, NeoBtn } from "../neo/Neo";
import type { SetDoc } from "@/lib/types";
import { queueTracks, playTrack } from "@/lib/api";
import { flushSync } from "react-dom";
import EditSetCard from "./EditSetCard";
import ConnectSpotifyModal from "../shared/ConnectSpotifyModal";

export default function SetRow({
  doc,
  onChanged,
  onDeleted,
  toast,
  onConnect,
}: {
  doc: SetDoc;
  onChanged?: (next: SetDoc) => void;
  onDeleted?: (id: string) => void;
  toast?: (msg: string) => void;
  // optional connect callback (dashboard will pass its connectSpotify)
  onConnect?: () => void;
}) {
  const images = doc.images ?? [];
  const collage = images.slice(0, 5);

  const [queuing, setQueuing] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [showEdit, setShowEdit] = useState(false);
  const [showConnect, setShowConnect] = useState(false);

  // server-checked auth call (caches result during component lifetime)
  let _authCache: boolean | null = null;
  async function isAuthenticated(): Promise<boolean> {
    if (_authCache !== null) return _authCache;
    try {
      const res = await fetch("/api/user/me", { credentials: "include" });
      _authCache = res.ok;
      return _authCache;
    } catch {
      _authCache = false;
      return false;
    }
  }

  // check spotify tokens exist by calling backend proxy /api/account/spotify/me
  async function hasSpotifyTokens(): Promise<boolean> {
    try {
      console.log("has spotify")
      const res = await fetch("/api/account/spotify/me", { credentials: "include" });
      if (!res.ok) return false;
      const body = await res.json().catch(() => ({}));
      // backend returns { tokenInfo: null } when no tokens
      return Boolean(body?.tokenInfo);
    } catch {
      return false;
    }
  }

  async function handleQueueAll() {
    // ensure authenticated first
    const authed = await isAuthenticated();

    console.log("auth", authed)
    
    if (!authed) {
      const msg = "Please sign in to play sets";
      if (typeof toast === "function") toast(msg);
      else window.dispatchEvent(new CustomEvent("queuevibes:toast", { detail: msg }));
      setTimeout(() => (window.location.href = "/login"), 300);
      return;
    }

    // ensure Spotify tokens exist before making queue request
    const hasTokens = await hasSpotifyTokens();

    console.log('tokens', hasTokens)
    
    if (!hasTokens) {
      // show modal to prompt connect
      setShowConnect(true);
      return;
    }

    if (!doc.songs || !doc.songs.length) {
      toast?.("No songs to queue");
      return;
    }

    flushSync(() => {
      setQueuing(true);
      setQueuedCount(0);
    });

    try {
      const ids = doc.songs.map((s) => s.id);
      const resp = await queueTracks(ids, undefined, true, true);
      if (resp?.ok) {
        setQueuedCount(ids.length);
        toast?.("Queue replaced and playback started");
      } else {
        const fallbackMsg = "Failed to replace queue";
        if (typeof toast === "function") {
          toast(fallbackMsg);
        } else {
          try {
            window.dispatchEvent(new CustomEvent("queuevibes:toast", { detail: fallbackMsg }));
          } catch {}
        }
      }
    } catch (err: any) {
      console.error("queueTracks error", err);
      const msg = err?.message ?? "Failed to queue tracks";

      // Prefer the provided toast prop, otherwise emit the global event so pages without a toast callback still show UI
      if (typeof toast === "function") {
        toast(msg);
      } else {
        try {
          window.dispatchEvent(new CustomEvent("queuevibes:toast", { detail: String(msg) }));
        } catch {}
      }

      if (/(not authenticated|unauthori[sz]ed|401)/i.test(msg)) {
        setTimeout(() => (window.location.href = "/login"), 250);
      }
      return;
    } finally {
      setQueuing(false);
      setTimeout(() => setQueuedCount(0), 1000);
    }
  }

  const doConnect = () => {
    if (typeof onConnect === "function") {
      onConnect();
    } else {
      // default: go to dashboard where user can connect
      window.location.href = "/dashboard";
    }
  };

  return (
    <>
      <ConnectSpotifyModal open={showConnect} onClose={() => setShowConnect(false)} onConnect={doConnect} />

      {/* make surface relative so we can absolutely position the edit control */}
      <NeoSurface className="relative flex items-center gap-4 p-3">
        <div className="w-20 flex-shrink-0 grid grid-cols-2 gap-1">
          {collage.length ? (
            collage.map((src, i) => (
              // small square tiles
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt={`${doc.name}-img-${i}`} className="w-9 h-9 object-cover rounded" />
            ))
          ) : (
            <div className="w-20 h-20 rounded bg-slate-100 flex items-center justify-center text-xs text-[var(--neo-muted)]">
              No images
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold truncate">{doc.name}</h4>
            <div className="flex items-center gap-3">
              <div className="relative">
                <NeoBtn
                  onClick={() => void handleQueueAll()}
                  className={`p-2 h-12 w-12 flex items-center justify-center bg-white border border-slate-200 shadow-sm rounded-md ${queuing ? "opacity-80 cursor-wait" : "hover:bg-slate-50"}`}
                  aria-label="Queue set to Spotify"
                  disabled={queuing}
                  title="Queue set to Spotify"
                >
                  {queuing ? (
                    <svg className="animate-spin h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                      <path className="opacity-75" stroke="currentColor" strokeWidth="2" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M5 3v18l15-9L5 3z" />
                    </svg>
                  )}
                </NeoBtn>
                {queuedCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full text-[11px] px-1.5 py-[3px] min-w-[20px] text-center">
                    {queuedCount}
                  </div>
                )}
              </div>
              <div className="text-xs text-[var(--neo-muted)]">{doc.songs?.length ?? 0} songs</div>
            </div>
          </div>
          {doc.description ? (
            <p className="text-xs text-[var(--neo-muted)] truncate mt-1">{doc.description}</p>
          ) : (
            <p className="text-xs text-[var(--neo-muted)] truncate mt-1">No description</p>
          )}
          <div className="mt-2 flex gap-2 flex-wrap">
            {(doc.tags || []).slice(0, 5).map((t) => (
              <span key={t} className="text-[10px] px-2 py-1 bg-slate-100 rounded">{t}</span>
            ))}
          </div>
        </div>
      </NeoSurface>
    </>
  );
}