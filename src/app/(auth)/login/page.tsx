"use client";
import React, { useState, FormEvent } from "react";
import { Music } from "lucide-react";
import GoogleOAuthButton from "@/app/_components/shared/GoogleOAuthButton";
import SpotifyLoginButton from "@/app/_components/shared/SpotifyLoginButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const e = params.get("error");
    if (!e) return null;
    const msgs: Record<string, string> = {
      missing_params: "OAuth failed: missing parameters.",
      invalid_state: "OAuth session expired. Please try again.",
      token_exchange_failed: "Could not connect to Spotify. Please try again.",
      profile_fetch_failed: "Could not load Spotify profile. Please try again.",
      login_failed: "Login failed. Please try again.",
    };
    return msgs[e] ?? decodeURIComponent(e);
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/user/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          setError("Invalid credentials. Please check your email and password.");
        } else {
          setError(data?.error ?? data?.message ?? "Login failed. Please try again.");
        }
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/dashboard";
      window.location.href = next;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--background)" }}
    >
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: "var(--color-primary)" }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <a href="/" className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
              <Music className="w-5 h-5 text-black" />
            </div>
            <span className="text-white font-semibold text-xl tracking-tight">GoodVibes</span>
          </a>
          <h1 className="text-2xl font-bold text-white mt-4">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Spotify login */}
          <SpotifyLoginButton />

          {/* Google OAuth */}
          <GoogleOAuthButton onError={setError} />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-600 text-xs">or continue with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 accent-green-500 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-400 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Signing in…
                </>
              ) : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-green-400 hover:text-green-300 transition-colors">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
