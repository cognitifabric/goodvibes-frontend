"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:3001/api";

/* ------------ Tiny toast hook (uses .toast and .neo-surface classes) ------------ */
function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3200);
    return () => clearTimeout(t);
  }, [msg]);

  return {
    setMsg,
    Toast: msg ? (
      <div className="toast">
        <div className="neo-surface">{msg}</div>
      </div>
    ) : null,
  } as const;
}

export default function SignupPage() {
  const { Toast, setMsg } = useToast();

  const [form, setForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    rememberMe: true,
    marketingOptIn: false,
    acceptTerms: false,
  });
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.acceptTerms) {
      setMsg("Please accept the Terms to continue.");
      return;
    }

    try {
      setBusy(true);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const payload = {
        username: form.username,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password,
        rememberMe: form.rememberMe,
        marketingOptIn: form.marketingOptIn,
        acceptedTermsAt: new Date(),
        timezone,
      };

      const { data } = await axios.post(
        `${BACKEND_BASE}/user/auth/signup`,
        payload,
        { withCredentials: true }
      );

      setMsg(data?.next || "Check your email to verify your account.");
      // Optionally redirect after a pause:
      // setTimeout(() => (window.location.href = "/login"), 1200);
    } catch (err: any) {
      const issues =
        (err?.response?.data?.issues as
          | { path: string; message: string }[]
          | undefined) || [];
      if (issues.length) {
        setMsg(issues[0].message || "Validation error");
      } else {
        setMsg(err?.response?.data?.error || "Sign up failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full app-auth-bg text-slate-800 flex items-center justify-center p-6">
      <div className="neo-surface max-w-md w-full">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Create Account
        </h1>
        <p className="text-sm text-[var(--neo-muted)] mb-8">
          Join Goood Vibez and start creating sets
        </p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <label className="text-sm text-slate-600">Username</label>
            <input
              type="text"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="input neo-inset"
              autoComplete="username"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-600">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input neo-inset"
              autoComplete="email"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-600">First name</label>
            <input
              type="text"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="input neo-inset"
              autoComplete="given-name"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-600">Last name</label>
            <input
              type="text"
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="input neo-inset"
              autoComplete="family-name"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-600">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input neo-inset"
              autoComplete="new-password"
            />
            <p className="text-xs text-[var(--neo-muted)]">
              8+ chars, include upper, lower, and number.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="rememberMe"
              type="checkbox"
              checked={form.rememberMe}
              onChange={(e) =>
                setForm({ ...form, rememberMe: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
            />
            <label htmlFor="rememberMe" className="text-sm text-slate-600">
              Remember me
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="marketingOptIn"
              type="checkbox"
              checked={form.marketingOptIn}
              onChange={(e) =>
                setForm({ ...form, marketingOptIn: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
            />
            <label htmlFor="marketingOptIn" className="text-sm text-slate-600">
              I’d like to receive updates and tips
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="acceptTerms"
              type="checkbox"
              checked={form.acceptTerms}
              onChange={(e) =>
                setForm({ ...form, acceptTerms: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
            />
            <label htmlFor="acceptTerms" className="text-sm text-slate-600">
              I accept the{" "}
              <a className="underline" href="/terms">
                Terms
              </a>{" "}
              and{" "}
              <a className="underline" href="/privacy">
                Privacy Policy
              </a>
              .
            </label>
          </div>

          <button
            type="submit"
            disabled={busy}
            className={`neo-btn w-full ${
              busy ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {busy ? "Signing up..." : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--neo-muted)]">
          Already have an account?{" "}
          <a href="/login" className="underline">
            Sign in
          </a>
        </p>
      </div>

      {Toast}
    </div>
  );
}
