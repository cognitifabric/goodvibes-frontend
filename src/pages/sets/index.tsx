import React from "react";
import Nav from "../../app/_components/layout/Nav";
import Footer from "../../app/_components/layout/Footer";
import SetRow from "../../app/_components/sets/SetRowClient";
import { jwtVerify } from "jose";
import { parseSessionToken } from "@/lib/auth.server";

type SetSong = { id: string; title: string; artists?: string; image?: string };
type SetDoc = {
  _id: string;
  name: string;
  description?: string;
  songs?: SetSong[];
  images?: string[];
  tags?: string[];
  lovedBy?: any[];
  collaborators?: any[];
  createdAt?: string;
};

export default function SetsPage({
  initialSets,
  initialTags,
  initialAuthenticated = false,
}: {
  initialSets: SetDoc[];
  initialTags: string[];
  initialAuthenticated?: boolean;
}) {
  // simple derived sections
  const byLoved = [...initialSets].sort((a, b) => (b.lovedBy?.length || 0) - (a.lovedBy?.length || 0)).slice(0, 8);
  const byCollab = [...initialSets].sort((a, b) => (b.collaborators?.length || 0) - (a.collaborators?.length || 0)).slice(0, 8);
  const recent = [...initialSets].sort((a, b) => (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())).slice(0, 12);

  return (
    <div style={{ background: "var(--neo-bg)" }} className="min-h-screen">
      <Nav initialAuthenticated={initialAuthenticated} />

      <main className="max-w-7xl mx-auto px-6 py-28">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold" style={{ color: "var(--neo-text)" }}>Sets</h1>
          <p className="mt-2 text-sm text-[var(--neo-muted)]">Browse popular, collaborative and recent song sets. Link your Spotify account to enable play/queue actions.</p>
        </header>

        {/* Tags / Filters */}
        <section className="mb-6">
          <div className="flex flex-wrap gap-2">
            {(initialTags || []).slice(0, 20).map((t) => (
              <button key={t} className="text-xs px-3 py-1 bg-slate-100 rounded cursor-pointer" style={{ color: "var(--neo-tertiary)" }}>
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Sections */}
        <section className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--neo-text)" }}>Most Loved</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {byLoved.map((s) => (
                <SetRow key={s._id} doc={s as any} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--neo-text)" }}>Most Collaborators</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {byCollab.map((s) => (
                <SetRow key={s._id} doc={s as any} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--neo-text)" }}>Recently Created</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((s) => (
                <SetRow key={s._id} doc={s as any} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Run per-request so we can read HttpOnly cookies
export async function getServerSideProps(context: any) {
  // fetch sets from backend
  const backendBase: string = (process.env.NEXT_PUBLIC_BACKEND_BASE as string) || "http://localhost:3001/api";
  const endpoint = `${backendBase.replace(/\/$/, "")}/sets`;

  let sets: any[] = [];
  let tags: string[] = [];

  try {
    const res = await fetch(endpoint);
    if (res.ok) {
      const body = await res.json();
      sets = body.sets ?? body;
      tags = body.tags ?? [];
    } else {
      // eslint-disable-next-line no-console
      console.warn("getServerSideProps: backend returned", res.status, endpoint);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("getServerSideProps fetch error:", err);
  }

  // detect session from incoming cookies
  const cookieHeader = context.req?.headers?.cookie || "";
  const getCookieValue = (name: string) =>
    cookieHeader
      .split(";")
      .map((c: string) => c.trim())
      .find((c: string) => c.startsWith(name + "="))
      ?.split("=")[1];

  const token = getCookieValue("gv_session") || null;
  const sessionUser = await parseSessionToken(token);
  const initialAuthenticated = Boolean(sessionUser?.id);

  return {
    props: {
      initialSets: sets,
      initialTags: tags,
      initialAuthenticated,
    },
  };
}
