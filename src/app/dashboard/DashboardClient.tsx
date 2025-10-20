"use client";

import React, { useEffect, useState } from "react";
import { AppProvider, useApp } from "../_state/DashboardState";
import useToast from "../_hooks/useToast";
import { getMe, spotifyStart, getSpotifyStatus } from "@/lib/api";
import CreateSetCard from "../_components/sets/CreateSetCard";
import SetRow from "../_components/sets/SetRow";
import SpotifyBanner from "../_components/shared/SpotifyBanner";
import { NeoBtn, NeoSurface } from "../_components/neo/Neo";
import type { Me } from "@/lib/types";

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function DashboardInner({ initialUser }: { initialUser: Partial<Me> }) {

  const { state, dispatch } = useApp();
  const { ToastEl, setMsg } = useToast();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (initialUser) {
      dispatch({ type: "SET_ME", me: { ...(state.me ?? {}), ...initialUser } as Me });
    }

    (async () => {
      const meFromApi = await getMe().catch(() => null);
      if (meFromApi) {
        dispatch({ type: "SET_ME", me: meFromApi });
        if (Array.isArray(meFromApi.sets)) dispatch({ type: "SET_SETS", sets: meFromApi.sets });
      }

      // Immediately query token status and update me.spotifyUserId accordingly
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connectSpotify(options?: { showDialog?: boolean }) {
    try {
      const res = await fetch("/api/account/authorize/spotify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ showDialog: options?.showDialog ?? true }),
      });

      // If backend returned JSON (isXhr path) it'll include authorizeUrl
      const json = await res.json().catch(() => ({} as any));
      if (json && json.authorizeUrl) {
        // client-side redirect to Spotify authorize page
        window.location.href = json.authorizeUrl;
        return;
      }

      // Fallback: if backend did a redirect (rare for XHR) try to read Location header
      const location = res.headers?.get?.("location");
      if (location) {
        window.location.href = location;
        return;
      }

      // Show friendly error toast
      const errMsg = json?.error ?? `Spotify authorize failed (status ${res.status})`;
      window.dispatchEvent(new CustomEvent("queuevibes:toast", { detail: errMsg }));
    } catch (err: any) {
      console.error("connectSpotify error", err);
      window.dispatchEvent(new CustomEvent("queuevibes:toast", { detail: err?.message ?? "Connect failed" }));
    }
  }

  const me = state.me;

  return (
    <div className="min-h-screen app-auth-bg px-4 pt-10 sm:px-6 lg:px-8">
      <header className="mx-auto mb-6 w-full max-w-5xl md:max-w-6xl">
        <div className="neo-surface p-4 md:p-5 flex items-center flex-wrap gap-4 justify-between">
          {/* left: logo + title (allow truncation) */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-500 text-white shadow flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 12a9 9 0 0118 0" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="2.2" />
              </svg>
            </div>
            <div className="leading-tight min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold truncate">Dashboard</h1>
              <p className="text-xs sm:text-sm text-[var(--neo-muted)] truncate">Manage your sets & Spotify integration</p>
              <div className="flex text-xs md:text-sm text-[var(--neo-muted)] bg-slate-50 px-3 py-1 rounded shadow-sm items-center gap-2 min-w-0 mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="truncate">{me?.spotifyUserId ? "Spotify connected" : "Not connected to Spotify"}</span>
              </div>
            </div>
          </div>

          {/* right: controls - prevent shrinking so they stay visible */}
          <div className="flex items-center gap-3 order-2 md:order-3 flex-shrink-0">
             {/* unified small control style for plan / reconnect / member - consistent sizes */}
             {me?.plan && (
              <div className="flex items-center gap-2 h-10 px-3 rounded-md bg-white/95 shadow-sm text-sm min-w-[120px] text-slate-800">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                   <path d="M12 2v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
                   <path d="M6 12v7a1 1 0 001 1h10a1 1 0 001-1v-7" strokeLinecap="round" strokeLinejoin="round" />
                 </svg>
                 <span className="truncate font-medium">Plan: {me.plan}</span>
               </div>
             )}
 
             {me?.spotifyUserId && (
               <button
                 onClick={async () => {
                   try {
                     setConnecting(true);
                     await connectSpotify({ showDialog: true }); // force re-consent
                   } finally {
                     setConnecting(false);
                   }
                 }}
                className="neo-btn h-10 flex items-center gap-2 px-3 text-slate-800 cursor-pointer"
                 title="Reconnect / reauthorize Spotify"
                 aria-label="Reconnect Spotify"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-spotify-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                   <path d="M20 12a8 8 0 10-8 8" strokeLinecap="round" strokeLinejoin="round" />
                   <path d="M23 4v6h-6" strokeLinecap="round" strokeLinejoin="round" />
                 </svg>
                 <span 
                  className="hidden sm:inline font-medium"
                  onClick={async () => {
                    try {
                      setConnecting(true);
                      await connectSpotify({ showDialog: true }); // force re-consent
                    } finally {
                      setConnecting(false);
                    }
                  }}
                 >Reconnect
                 </span>
               </button>
             )}
 
             <div className="flex items-center gap-2 h-10">
               <div className="flex items-center gap-3 h-10 px-3 rounded-md bg-white/95 shadow-sm">
                 <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm text-[var(--neo-muted)]">
                   {me?.username?.charAt(0).toUpperCase() ?? "U"}
                 </div>
                 <div className="hidden md:flex flex-col leading-tight">
                   <div className="text-sm font-medium truncate">{me?.username ?? "User"}</div>
                   <div className="text-xs text-[var(--neo-muted)] truncate">Member</div>
                 </div>
               </div>
 
               
             </div>
           </div>
         </div>
       </header>
      <main className="mx-auto w-full max-w-5xl md:max-w-6xl space-y-6 pb-8">
        {!me?.spotifyUserId && <SpotifyBanner onConnect={connectSpotify} />}

        <div className="flex items-center justify-between gap-4">
          <CreateSetCard onCreate={(s) => dispatch({ type: "ADD_SET", set: s })} connectSpotify={connectSpotify} />
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-xs text-[var(--neo-muted)]">Tip: click play on a set to replace Spotify playback</div>
            <button className="neo-btn px-3 py-1 text-sm hidden md:inline-flex items-center gap-2 cursor-pointer" aria-label="Quick actions" title="Quick actions">
              {/* use same icon/size/color as the Plan icon for better visibility */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M12 2v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 12v7a1 1 0 001 1h10a1 1 0 001-1v-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="hidden lg:inline">Quick actions</span>
            </button>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.sets.length === 0 ? (
            <NeoSurface>
              <p className="text-sm text-[var(--neo-muted)]">
                You don’t have any sets yet. Create one above to get started.
              </p>
            </NeoSurface>
          ) : (
            state.sets.map((s) => (
              <SetRow
                key={s._id}
                doc={s}
                onChanged={(next) => dispatch({ type: "UPDATE_SET", set: next })}
                onDeleted={(id) => dispatch({ type: "REMOVE_SET", id })}
                toast={setMsg}
                onConnect={connectSpotify}
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
