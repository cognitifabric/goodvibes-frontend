"use client";
import React, { useState } from "react";
import { NeoSurface, NeoBtn } from "../neo/Neo";
import type { SetDoc } from "@/lib/types";
import { queueTracks, playTrack } from "@/lib/api";
import { flushSync } from "react-dom";
import EditSetCard from "./EditSetCard";

export default function SetRow({
  doc,
  onChanged,
  onDeleted,
  toast,
}: {
  doc: SetDoc;
  onChanged?: (next: SetDoc) => void;
  onDeleted?: (id: string) => void;
  toast?: (msg: string) => void;
}) {
  const images = doc.images ?? [];
  const collage = images.slice(0, 5);

  const [queuing, setQueuing] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [showEdit, setShowEdit] = useState(false);

  async function handleQueueAll() {
    if (!doc.songs || !doc.songs.length) {
      toast?.("No songs to queue");
      return;
    }
    // prevent concurrent operations (already handled by state disabled button)
    flushSync(() => {
      setQueuing(true);
      setQueuedCount(0);
    });

    try {
      const ids = doc.songs.map((s) => s.id);
      // Replace existing queue atomically and start playback of the list:
      const resp = await queueTracks(ids, undefined, true, true /* replace */);
      if (resp?.ok) {
        setQueuedCount(ids.length);
        toast?.("Queue replaced and playback started");
      } else {
        toast?.("Failed to replace queue");
      }
    } catch (err: any) {
      console.error("queue all failed", err);
      toast?.(err?.message ?? "Failed to queue tracks");
    } finally {
      setQueuing(false);
      setTimeout(() => setQueuedCount(0), 1000);
    }
  }

  return (
    <>
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
              {/* keep other controls compact on the right (edit moved to top-right absolute) */}
              <div className="relative">
                {/* larger, high-contrast button + bigger icon */}
                <NeoBtn
                  onClick={handleQueueAll}
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
        {/* Edit button with accessible tooltip (shows on hover & focus) */}
        <div className="absolute top-2 right-2 z-20">
          <div className="relative group inline-block">
            <NeoBtn
              onClick={() => setShowEdit(true)}
              className="flex items-center justify-center h-12 w-12 rounded-full transform-gpu transition-all !bg-transparent !shadow-none"
              title="Edit set"
              aria-label="Edit set"
              aria-describedby={`edit-tooltip-${doc._id}`}
              style={{ boxShadow: "none" }}
            >
              {/* stroked pencil icon, colored for contrast without a background */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
            </NeoBtn>

            {/* tooltip: appears on hover and when the button receives focus */}
            <div
              id={`edit-tooltip-${doc._id}`}
              role="tooltip"
              className="pointer-events-none absolute -top-10 right-0 hidden group-hover:flex group-focus-within:flex items-center justify-center bg-slate-900 text-white text-xs px-2 py-1 rounded-md shadow-sm whitespace-nowrap"
            >
              Edit set
              <span className="absolute -bottom-1 right-3 w-2 h-2 bg-slate-900 rotate-45" aria-hidden="true" />
            </div>
          </div>
        </div>
      </NeoSurface>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEdit(false)} />
          <div className="relative w-full max-w-2xl max-h-[calc(100vh-72px)] overflow-auto">
            <EditSetCard
              initialSet={doc}
              onSave={(updated: SetDoc) => {
                setShowEdit(false);
                onChanged?.(updated);
              }}
              onDelete={(id: string) => {
                setShowEdit(false);
                onDeleted?.(id);
              }}
              onCancel={() => setShowEdit(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}