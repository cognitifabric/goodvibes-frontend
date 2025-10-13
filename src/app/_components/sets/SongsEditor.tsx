"use client";
import React from "react";

export default function SongsEditor({
  songs, onChange,
}: { songs: string[]; onChange: (next: string[]) => void }) {

  const move = (i: number, dir: -1|1) => {
    const j = i + dir; if (j<0 || j>=songs.length) return;
    const next = songs.slice(); [next[i], next[j]] = [next[j], next[i]]; onChange(next);
  };
  const removeAt = (i: number) => {
    const next = songs.slice(); next.splice(i,1); onChange(next);
  };

  if (!songs.length) return <p className="text-sm text-[var(--neo-muted)]">No songs yet.</p>;

  return (
    <ul className="space-y-2">
      {songs.map((id, i) => (
        <li key={`${id}-${i}`} className="neo-inset input flex items-center justify-between">
          <div className="truncate">{id}</div>
          <div className="flex gap-2">
            <button className="neo-btn px-3" onClick={()=>move(i,-1)}>↑</button>
            <button className="neo-btn px-3" onClick={()=>move(i, 1)}>↓</button>
            <button className="neo-btn px-3" onClick={()=>removeAt(i)}>✕</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
