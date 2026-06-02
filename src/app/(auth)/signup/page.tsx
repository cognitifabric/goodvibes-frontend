"use client";
import React, { useState, FormEvent } from "react";
import { Music, CheckCircle, Check, X } from "lucide-react";
import GoogleOAuthButton from "@/app/_components/shared/GoogleOAuthButton";
import SpotifyLoginButton from "@/app/_components/shared/SpotifyLoginButton";

function PasswordStrength({ password }: { password: string }) {
  const rules = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "One lowercase letter", ok: /[a-z]/.test(password) },
    { label: "One number", ok: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1">
      {rules.map((r) => (
        <li key={r.label} className={`flex items-center gap-1.5 text-xs ${r.ok ? "text-green-400" : "text-gray-500"}`}>
          {r.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          {r.label}
        </li>
      ))}
    </ul>
  );
}

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/user/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName, lastName, username, email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 201 || res.ok) {
        setSuccessMsg(data?.next || "Account created!");
        setSuccess(true);
        return;
      }

      // Parse Zod validation issues into per-field errors
      if (data?.error === "ValidationError" && Array.isArray(data.issues)) {
        const errs: Record<string, string> = {};
        data.issues.forEach((issue: { path: string; message: string }) => {
          if (!errs[issue.path]) errs[issue.path] = issue.message;
        });
        setFieldErrors(errs);
        setError("Please fix the errors below.");
      } else {
        setError(data?.error ?? data?.message ?? "Signup failed. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    const isAutoVerified = successMsg === "Account created! You can sign in now.";
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "var(--background)" }}
      >
        <div className="relative w-full max-w-sm text-center">
          <div className="glass rounded-2xl p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              {isAutoVerified ? "You're all set!" : "Check your email"}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              {isAutoVerified
                ? "Your account has been created. Sign in to start curating."
                : <>We sent a verification link to{" "}<span className="text-white font-medium">{email}</span>. Click the link to activate your account.</>}
            </p>
            <a
              href="/login"
              className="inline-block w-full bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors mt-2"
            >
              {isAutoVerified ? "Sign in now" : "Back to sign in"}
            </a>
          </div>
        </div>
      </div>
    );
  }

  const fe = fieldErrors;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
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
          <h1 className="text-2xl font-bold text-white mt-4">Create your account</h1>
          <p className="text-gray-400 text-sm mt-1">Start curating music like a pro</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 space-y-4">
          {error && !Object.keys(fieldErrors).length && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Social login */}
          <SpotifyLoginButton label="Sign up with Spotify" />
          <GoogleOAuthButton onError={setError} />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-600 text-xs">or sign up with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">First name</label>
                <input
                  type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  required placeholder="Jane" autoComplete="given-name"
                  className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none transition-colors text-sm ${fe.firstName ? "border-red-500/50" : "border-white/10 focus:border-green-500/50"}`}
                />
                {fe.firstName && <p className="text-red-400 text-xs mt-1">{fe.firstName}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Last name</label>
                <input
                  type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  required placeholder="Doe" autoComplete="family-name"
                  className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none transition-colors text-sm ${fe.lastName ? "border-red-500/50" : "border-white/10 focus:border-green-500/50"}`}
                />
                {fe.lastName && <p className="text-red-400 text-xs mt-1">{fe.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Username</label>
              <input
                type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                required placeholder="janedoe" autoComplete="username"
                className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none transition-colors text-sm ${fe.username ? "border-red-500/50" : "border-white/10 focus:border-green-500/50"}`}
              />
              {fe.username
                ? <p className="text-red-400 text-xs mt-1">{fe.username}</p>
                : <p className="text-gray-600 text-xs mt-1">Letters, numbers, . _ - only</p>}
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="you@example.com" autoComplete="email"
                className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none transition-colors text-sm ${fe.email ? "border-red-500/50" : "border-white/10 focus:border-green-500/50"}`}
              />
              {fe.email && <p className="text-red-400 text-xs mt-1">{fe.email}</p>}
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={8} placeholder="Min. 8 chars, uppercase, number"
                autoComplete="new-password"
                className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none transition-colors text-sm ${fe.password ? "border-red-500/50" : "border-white/10 focus:border-green-500/50"}`}
              />
              <PasswordStrength password={password} />
              {fe.password && <p className="text-red-400 text-xs mt-1">{fe.password}</p>}
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creating account…
                </>
              ) : "Create account"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-600">
            By signing up, you agree to our terms of service.
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <a href="/login" className="text-green-400 hover:text-green-300 transition-colors">Sign in</a>
        </p>
      </div>
    </div>
  );
}
