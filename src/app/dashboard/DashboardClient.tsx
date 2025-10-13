"use client";

import React, { useEffect, useState } from "react";
import { AppProvider, useApp } from "../_state/AppState";
import useToast from "../_hooks/useToast";
import { getMe, listSets, spotifyStart } from "@/lib/api";
import CreateSetCard from "../_components/sets/CreateSetCard";
import SetCard from "../_components/sets/SetCard";
import SpotifyBanner from "../_components/shared/SpotifyBanner";
import { NeoBtn, NeoSurface } from "../_components/neo/Neo";
import type { Me } from "@/lib/types";

function DashboardInner({ initialUser }: { initialUser: Partial<Me> }) {
  const { state, dispatch } = useApp();
  const { ToastEl, setMsg } = useToast();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // seed minimal user from server (id/username/plan), then fetch full /me
    if (initialUser) {
      dispatch({ type: "SET_ME", me: { ...state.me, ...initialUser } as Me });
    }

    (async () => {
      try {
        const [me, sets] = await Promise.all([getMe(), listSets()]);
        dispatch({ type: "SET_ME", me });
        dispatch({ type: "SET_SETS", sets });
      } catch (e: any) {
        if (e?.response?.status === 401) window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectSpotify = async () => {
    setConnecting(true);
    try {
      const { authorizeUrl } = await spotifyStart();
      window.location.href = authorizeUrl;
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen app-auth-bg flex items-center justify-center p-6">
        <NeoSurface>Loading…</NeoSurface>
      </div>
    );
  }

  const me = state.me;

  return (
    <div className="min-h-screen app-auth-bg p-6">
      <header className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <NeoSurface>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-[var(--neo-muted)]">Manage your sets</p>
        </NeoSurface>
        <div className="flex items-center gap-2">
          {me?.plan && <NeoSurface className="px-3 py-2">Plan: {me.plan}</NeoSurface>}
          <a href="/logout" className="neo-btn">Log out</a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        {!me?.spotifyLinked && <SpotifyBanner onConnect={connectSpotify} />}

        <CreateSetCard onCreate={(s) => dispatch({ type: "ADD_SET", set: s })} />

        <section className="grid md:grid-cols-2 gap-6">
          {state.sets.length === 0 ? (
            <NeoSurface>
              <p className="text-sm text-[var(--neo-muted)]">
                You don’t have any sets yet. Create one above to get started.
              </p>
            </NeoSurface>
          ) : (
            state.sets.map((s) => (
              <SetCard
                key={s._id}
                me={me!}
                doc={s}
                onChanged={(next) => dispatch({ type: "UPDATE_SET", set: next })}
                onDeleted={(id) => dispatch({ type: "REMOVE_SET", id })}
                canAddSongs={!!me?.spotifyLinked}
                toast={setMsg}
              />
            ))
          )}
        </section>
      </main>

      {ToastEl}
    </div>
  );
}

export default function DashboardClient({ initialUser }: { initialUser: Partial<Me> }) {
  return (
    <AppProvider initial={{ me: initialUser as Me }}>
      <DashboardInner initialUser={initialUser} />
    </AppProvider>
  );
}
