"use client";
import React, { useState } from "react";
import { NeoBtn, NeoInput, NeoSurface } from "../neo/Neo";
import { createSet } from "@/lib/api";
import type { SetDoc } from "@/lib/types";

export default function CreateSetCard({ onCreate }: { onCreate: (s: SetDoc) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const doc = await createSet({
        name: name.trim(),
        description: desc.trim() || null,
        tags: tags.split(",").map(s => s.trim()).filter(Boolean),
      });
      onCreate(doc);
      setName(""); setDesc(""); setTags("");
    } finally { setBusy(false); }
  }

  return (
    <NeoSurface>
      <h3 className="text-lg font-semibold mb-3">Create a new set</h3>
      <form onSubmit={submit} className="space-y-3">
        <NeoInput placeholder="Set name" value={name} onChange={e=>setName(e.target.value)} />
        <NeoInput placeholder="Description (optional)" value={desc} onChange={e=>setDesc(e.target.value)} />
        <NeoInput placeholder="Tags (comma separated)" value={tags} onChange={e=>setTags(e.target.value)} />
        <NeoBtn disabled={busy} className="w-full">{busy ? "Creating..." : "Create set"}</NeoBtn>
      </form>
    </NeoSurface>
  );
}
