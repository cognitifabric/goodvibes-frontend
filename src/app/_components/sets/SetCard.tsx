"use client";
import React, { useEffect, useState } from "react";
import { NeoBtn, NeoInput, NeoSurface } from "../neo/Neo";
import SongsEditor from "./SongsEditor";
import { addSongs, deleteSet, replaceSongs, updateSetBasic } from "@/lib/api";
import { normTrackId, isSpotifyId } from "@/lib/utils";
import type { Me, SetDoc } from "@/lib/types";

export default function SetCard({
  me, doc, onChanged, onDeleted, canAddSongs, toast,
}: {
  me: Me | null;
  doc: SetDoc;
  onChanged: (s: SetDoc) => void;
  onDeleted: (id: string) => void;
  canAddSongs: boolean;
  toast: (m: string) => void;
}) {
  const [name, setName] = useState(doc.name);
  const [desc, setDesc] = useState(doc.description || "");
  const [songs, setSongs] = useState<string[]>(doc.songs || []);
  const [adding, setAdding] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(()=>{ setName(doc.name); setDesc(doc.description||""); setSongs(doc.songs||[]); }, [doc]);

  async function saveDetails() {
    setBusy(true);
    try {
      const updated = await updateSetBasic(doc._id, { name: name.trim()||doc.name, description: desc.trim() });
      onChanged(updated); toast("Saved");
    } finally { setBusy(false); }
  }

  async function saveOrder() {
    setBusy(true);
    try {
      const out = await replaceSongs(doc._id, songs);
      setSongs(out.songs);
      onChanged({ ...doc, songs: out.songs });
      toast(out.orderChanged ? "Order updated." : "No change.");
    } finally { setBusy(false); }
  }

  async function add() {
    if (!canAddSongs) { toast("Connect Spotify first."); return; }
    const ids = adding.split(/[,\s]+/).map(normTrackId).filter(isSpotifyId);
    if (!ids.length) { toast("Enter valid Spotify track IDs or URIs."); return; }
    setBusy(true);
    try {
      const out = await addSongs(doc._id, ids);
      setSongs(out.songs);
      onChanged({ ...doc, songs: out.songs });
      toast(out.skipped?.length ? `Added ${out.added}, skipped ${out.skipped.length}.` : `Added ${out.added}.`);
      setAdding("");
    } finally { setBusy(false); }
  }

  async function destroy() {
    if (!confirm("Delete this set?")) return;
    setBusy(true);
    try { await deleteSet(doc._id); onDeleted(doc._id); toast("Set deleted."); }
    finally { setBusy(false); }
  }

  return (
    <NeoSurface>
      <div className="flex items-start justify-between gap-3">
        <div className="w-full">
          <NeoInput value={name} onChange={e=>setName(e.target.value)} className="mb-2" />
          <NeoInput value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description" />
        </div>
        <NeoBtn onClick={destroy} className={busy ? "opacity-60" : ""}>Delete</NeoBtn>
      </div>

      <div className="divider"><span>songs</span></div>

      <SongsEditor songs={songs} onChange={setSongs} />

      <div className="mt-3 flex gap-2">
        <NeoBtn onClick={saveOrder} className={busy ? "opacity-60" : ""}>Save order</NeoBtn>
        <NeoBtn onClick={saveDetails} className={busy ? "opacity-60" : ""}>Save details</NeoBtn>
      </div>

      <div className="mt-4 flex gap-2">
        <NeoInput
          className="flex-1"
          placeholder="Paste Spotify track IDs or URIs (comma/space separated)"
          value={adding}
          onChange={e=>setAdding(e.target.value)}
        />
        <NeoBtn onClick={add} className={busy ? "opacity-60" : ""}>Add</NeoBtn>
      </div>
    </NeoSurface>
  );
}
