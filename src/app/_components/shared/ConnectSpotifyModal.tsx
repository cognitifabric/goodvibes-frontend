"use client";
import React from "react";

export default function ConnectSpotifyModal({
  open,
  onClose,
  onConnect,
  message = "Connect your Spotify account to play sets.",
}: {
  open: boolean;
  onClose: () => void;
  onConnect: () => void;
  message?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Connect Spotify</h3>
        <p className="text-sm text-[var(--neo-muted)] mb-4">{message}</p>
        <div className="flex gap-3 justify-end">
          <button className="px-3 py-1 rounded bg-slate-100" onClick={onClose}>Cancel</button>
          <button
            className="px-4 py-1 rounded bg-spotify-green text-white"
            onClick={() => {
              try { onConnect(); } finally { onClose(); }
            }}
          >
            Connect now
          </button>
        </div>
      </div>
    </div>
  );
}