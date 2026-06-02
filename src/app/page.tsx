"use client";
import React from "react";
import { Music, Users, Zap, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 flex items-center justify-between border-b border-white/5 backdrop-blur-sm bg-black/20">
        <a href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
            <Music className="w-4 h-4 text-black" />
          </div>
          <span className="text-white font-semibold text-base sm:text-lg">GoodVibes</span>
        </a>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/sets"
            className="hidden sm:block text-gray-400 hover:text-white text-sm transition-colors"
          >
            Browse Sets
          </a>
          <a
            href="/login"
            className="hidden sm:block text-gray-400 hover:text-white text-sm transition-colors"
          >
            Sign in
          </a>
          <a
            href="/sets"
            className="sm:hidden text-gray-400 hover:text-white text-sm transition-colors"
          >
            Sets
          </a>
          <a
            href="/signup"
            className="bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl px-3 sm:px-4 py-2 text-sm transition-colors whitespace-nowrap"
          >
            Get started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-24 px-6 text-center overflow-hidden">
        {/* Ambient glows */}
        <div
          className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: "var(--color-primary)" }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: "var(--color-secondary)" }}
        />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-gray-400 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Integrated with Spotify
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Curate music{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-purple-500">
              like a pro
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Create stunning song sets, discover what others are vibing to, and queue
            directly to Spotify with one click.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="/signup"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl px-8 py-4 text-lg transition-colors"
            >
              Start creating
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="/login"
              className="inline-flex items-center gap-2 glass hover:bg-white/10 text-white rounded-xl px-8 py-4 text-lg transition-colors"
            >
              Sign in
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Music,
              title: "Build Sets",
              description:
                "Search Spotify, add tracks, reorder with drag-and-drop. Create your perfect playlist.",
              color: "#1BC47F",
            },
            {
              icon: Users,
              title: "Community Feed",
              description:
                "Discover sets from others. See what's trending in the community right now.",
              color: "#8B5CF6",
            },
            {
              icon: Zap,
              title: "Play Instantly",
              description:
                "Queue any set directly to your Spotify with a single tap. No friction.",
              color: "#1BC47F",
            },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="glass p-6 rounded-2xl">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center glass p-12 rounded-3xl">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to start vibing?
          </h2>
          <p className="text-gray-400 mb-8">
            Join the community. It&apos;s free.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl px-8 py-4 text-lg transition-colors"
          >
            Create account
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      <footer className="py-8 px-6 text-center text-gray-600 text-sm border-t border-white/5">
        © {new Date().getFullYear()} GoodVibes — Built with Spotify
      </footer>
    </div>
  );
}
