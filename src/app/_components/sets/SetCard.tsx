"use client";
import React, { useState } from "react";
import { NeoSurface, NeoBtn } from "../neo/Neo";
import type { SetDoc } from "@/lib/types";
import EditSetCard from "./EditSetCard";

export default function SetCard({
  setDoc,
  onQueue,
  onUpdated,
}: {
  setDoc: SetDoc;
  onQueue?: (ids: string[]) => Promise<void>;
  onUpdated?: (next: SetDoc) => void;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const images = setDoc.images ?? [];
  const collage = images.slice(0, 4);

  return (
    <>
      <NeoSurface className="relative p-4">
        {/* top row: title + meta */}
        <div className="flex items-start gap-4">
          <div className="w-24 flex-shrink-0 grid grid-cols-2 gap-1">
            {collage.length ? (
              collage.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={`${setDoc.name}-img-${i}`} className="w-11 h-11 object-cover rounded" />
              ))
            ) : (
              <div className="w-24 h-24 rounded bg-slate-100 flex items-center justify-center text-xs text-[var(--neo-muted)]">No images</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold truncate">{setDoc.name}</h3>
                <div className="text-xs text-[var(--neo-muted)] mt-1 truncate">{setDoc.description ?? "No description"}</div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs text-[var(--neo-muted)] text-right">
                  <div>{(setDoc.lovedBy || []).length} ❤️</div>
                  <div>{(setDoc.collaborators || []).length} collaborators</div>
                </div>

                {/* play / queue - disabled if user not connected (handled in parent) */}
                <NeoBtn
                  title="Queue and play"
                  aria-label="Queue and play"
                  onClick={() => onQueue?.( (setDoc.songs || []).map(s => s.id) )}
                  className="p-3 rounded-md bg-white border border-slate-200 hover:bg-slate-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M5 3v18l15-9L5 3z" />
                  </svg>
                </NeoBtn>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {(setDoc.tags || []).slice(0, 6).map((t) => (
                  <span key={t} className="text-xs px-2 py-1 bg-slate-100 rounded">#{t}</span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--neo-muted)]">{new Date(setDoc.createdAt).toLocaleDateString()}</span>

                {/* Edit placed top-right visually (open modal) */}
                <NeoBtn
                  onClick={() => setShowEdit(true)}
                  className="p-2 rounded-md !bg-transparent !shadow-none"
                  title="Edit set"
                  aria-label="Edit set"
                  style={{ boxShadow: "none" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                </NeoBtn>
              </div>
            </div>
          </div>
        </div>
      </NeoSurface>

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEdit(false)} />
          <div className="relative w-full max-w-2xl max-h-[calc(100vh-72px)] overflow-auto">
            <EditSetCard
              initialSet={setDoc}
              onSave={(next) => {
                setShowEdit(false);
                onUpdated?.(next);
              }}
              onDelete={() => {
                setShowEdit(false);
                // parent can refresh list by listening to events; implement if needed
              }}
              onCancel={() => setShowEdit(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}