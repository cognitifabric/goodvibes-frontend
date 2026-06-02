"use client";
import React, { useState } from "react";
import { Plus, Music, Calendar, Tag, ChevronRight, Trash2, Loader2 } from "lucide-react";
import { useApp } from "@/app/_state/AppContext";
import SpotifyConnect from "@/app/_components/shared/SpotifyConnect";
import Modal from "@/app/_components/ui/Modal";
import { createSet, deleteSet } from "@/lib/api";
import type { SetDoc } from "@/lib/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SetCard({
  set,
  onDelete,
}: {
  set: SetDoc;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${set.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteSet(set._id);
      onDelete(set._id);
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent("gv:toast", { detail: err?.message ?? "Failed to delete set" })
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4 group hover:bg-white/[0.07] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-base truncate">{set.name}</h3>
          {set.description && (
            <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{set.description}</p>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete set"
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
        >
          {deleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Music className="w-3.5 h-3.5" />
          {set.songs.length} {set.songs.length === 1 ? "song" : "songs"}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(set.createdAt)}
        </span>
      </div>

      {/* Tags */}
      {set.tags && set.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {set.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 text-xs rounded-lg px-2 py-0.5"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
          {set.tags.length > 4 && (
            <span className="text-gray-600 text-xs px-1">+{set.tags.length - 4} more</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1">
        <a
          href={`/dashboard/sets/${set._id}`}
          className="flex-1 bg-white/10 hover:bg-white/15 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors text-center"
        >
          Edit
        </a>
        <a
          href={`/dashboard/sets/${set._id}?action=queue`}
          className="flex-1 bg-green-500 hover:bg-green-400 text-black rounded-xl px-4 py-2 text-sm font-semibold transition-colors text-center flex items-center justify-center gap-1.5"
        >
          Queue &amp; Play
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

function CreateSetModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (set: SetDoc) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const set = await createSet({ name: name.trim(), description: description.trim() || null, tags });
      onCreated(set);
      setName("");
      setDescription("");
      setTagsInput("");
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? "Failed to create set");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Set">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Set name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Late Night Vibes"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What's the vibe?"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Tags</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="chill, house, evening (comma separated)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors text-sm"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-white/10 hover:bg-white/15 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create Set"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function DashboardPage() {
  const { state, dispatch } = useApp();
  const { me, sets } = state;
  const [showCreate, setShowCreate] = useState(false);

  function handleCreated(set: SetDoc) {
    dispatch({ type: "ADD_SET", set });
  }

  function handleDeleted(id: string) {
    dispatch({ type: "REMOVE_SET", id });
  }

  const displayName = me?.firstName || me?.username || "there";

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Hey, {displayName} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {sets.length > 0
              ? `You have ${sets.length} ${sets.length === 1 ? "set" : "sets"}`
              : "Start by creating your first set"}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl px-4 md:px-5 py-2.5 text-sm transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Set</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Spotify Connect Banner */}
      {me && !me.spotifyConnected && (
        <SpotifyConnect />
      )}

      {/* Sets grid */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">My Sets</h2>

        {sets.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">No sets yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Create your first set to start organizing your music and queueing tracks to Spotify.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl px-6 py-2.5 text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first set
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sets.map((set) => (
              <SetCard key={set._id} set={set} onDelete={handleDeleted} />
            ))}
          </div>
        )}
      </section>

      <CreateSetModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
