"use client";
import React, { useCallback, useEffect, useState } from "react";
import Script from "next/script";
import axios from "axios";
import { GoogleOAuthProvider } from "@react-oauth/google";

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:3001/api";

type UserDTO = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  plan: "free" | "pro";
  emailVerified?: boolean;
};

type OAuthOk = { ok: true; user: UserDTO };

type OAuthPending = {
  needsEmailVerification: true;
  needsEmailCollection?: boolean;
  next?: string;
  user?: UserDTO;
};

type PasswordOk = { ok: true; user: UserDTO };

/* ------------ Tiny toast hook ------------ */
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

/* ------------ API helpers ------------ */
async function postOAuth(body: {
  provider: "google" | "apple" | "x";
  idToken?: string;
  accessToken?: string;
  timezone?: string;
}) {
  const url = `${BACKEND_BASE}/user/auth/oauth`;
  const { data } = await axios.post(url, body, { withCredentials: true });
  return data as OAuthOk | OAuthPending;
}

async function postPasswordLogin(email: string, password: string) {
  const url = `${BACKEND_BASE}/user/auth/login`;
  const { data } = await axios.post(
    url,
    { email, password },
    { withCredentials: true }
  );
  return data as PasswordOk;
}

/* ------------ Google Identity Services button ------------ */
function GoogleButtonGIS() {
  const { setMsg, Toast } = useToast();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

  useEffect(() => {
    const id = "google-identity-script";
    if (document.getElementById(id)) return;
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.id = id;
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    const render = () => {
      // @ts-ignore
      const google = (window as any).google;
      if (!google?.accounts?.id) return;

      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp: { credential?: string }) => {
          try {
            const idToken = resp?.credential;
            if (!idToken) throw new Error("No credential returned by Google");
            const out = await postOAuth({
              provider: "google",
              idToken,
              timezone,
            });
            if ("ok" in out && out.ok) {
              window.location.href = "/dashboard";
            } else if ("needsEmailVerification" in out) {
              setMsg(out.next || "Please verify your email.");
            } else {
              setMsg("Sign-in failed");
            }
          } catch (e: any) {
            setMsg(e?.message || "Google sign-in failed");
          }
        },
        ux_mode: "popup",
        auto_select: false,
      });

      const slot = document.getElementById("google-btn-slot");
      if (slot) {
        google.accounts.id.renderButton(slot, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "left",
          width: 320,
        });
      }
    };

    const poll = setInterval(() => {
      // @ts-ignore
      if ((window as any).google?.accounts?.id) {
        clearInterval(poll);
        render();
      }
    }, 50);
    return () => clearInterval(poll);
  }, [clientId, setMsg, timezone]);

  return (
    <>
      {Toast}
      <div id="google-btn-slot" className="neo-btn w-full flex justify-center" />
    </>
  );
}

/* ------------ Apple (Sign in with Apple JS) ------------ */
function AppleButton() {
  const { setMsg, Toast } = useToast();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const handleApple = useCallback(async () => {
    try {
      // @ts-ignore
      const AppleID = (window as any).AppleID;
      if (!AppleID?.auth) throw new Error("AppleID SDK not loaded");

      AppleID.auth.init({
        clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID,
        scope: "name email",
        redirectURI: process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI,
        usePopup: true,
      });

      const resp = await AppleID.auth.signIn();
      const idToken = resp?.authorization?.id_token as string | undefined;
      if (!idToken) throw new Error("No id_token from Apple");

      /* NOTE: fixed provider from "google" -> "apple" */
      const out = await postOAuth({ provider: "apple", idToken, timezone });
      if ("ok" in out && out.ok) {
        window.location.href = "/dashboard";
      } else if ("needsEmailVerification" in out) {
        setMsg(out.next || "Please verify your email.");
      } else {
        setMsg("Sign-in failed");
      }
    } catch (e: any) {
      setMsg(e?.message || "Apple sign-in failed");
    }
  }, [setMsg, timezone]);

  return (
    <>
      {Toast}
      <Script
        src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
        strategy="afterInteractive"
      />
      <button
        onClick={handleApple}
        className="neo-btn w-full flex items-center justify-center gap-3 cursor-pointer"
        aria-label="Continue with Apple"
      >
        {/* simple Apple glyph from system font */}
        <span aria-hidden></span>
        Continue with Apple
      </button>
    </>
  );
}

/* ------------ X/Twitter ------------ */
function TwitterButton() {
  const { setMsg, Toast } = useToast();

  const handleTwitter = useCallback(async () => {
    try {
      const url = `${BACKEND_BASE}${
        process.env.NEXT_PUBLIC_TWITTER_START || "/user/auth/x/start"
      }`;
      const { data } = await axios.post(url, {
        redirect: window.location.origin + "/oauth/x/callback",
      });
      if (!data?.authorizeUrl) throw new Error("No authorizeUrl received");
      window.location.href = data.authorizeUrl;
    } catch (e: any) {
      setMsg(e?.message || "X sign-in failed");
    }
  }, [setMsg]);

  return (
    <>
      {Toast}
      <button
        onClick={handleTwitter}
        className="neo-btn w-full flex items-center justify-center gap-3 cursor-pointer"
        aria-label="Continue with X"
      >
        <span aria-hidden>✕</span>
        Continue with X
      </button>
    </>
  );
}

/* ------------ Page ------------ */
function LoginInner() {
  const { setMsg, Toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      const out = await postPasswordLogin(email, password);
      if ("ok" in out && out.ok) {
        window.location.href = "/dashboard";
        return;
      }
      setMsg("Login failed");
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Login failed";
      setMsg(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full app-auth-bg text-slate-800 flex items-center justify-center p-6">
      <div className="neo-surface max-w-md w-full">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Welcome back</h1>
        <p className="text-sm text-[var(--neo-muted)] mb-8">
          Sign in to continue to Goood Vibez
        </p>

        <div className="space-y-3">
          <GoogleButtonGIS />
          {/* <AppleButton /> */}
          <TwitterButton />
        </div>

        <div className="divider">
          <span>or</span>
        </div>

        <form className="space-y-4" onSubmit={onPasswordLogin}>
          <div className="grid gap-2">
            <label className="text-sm text-slate-600">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="input neo-inset"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-600">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input neo-inset"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className={`neo-btn w-full cursor-pointer ${busy ? "opacity-60" : ""}`}
            disabled={busy}
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {Toast}

        <p className="mt-6 text-center text-xs text-[var(--neo-muted)]">
          By continuing, you agree to our{" "}
          <a href="/terms" className="underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline">
            Privacy Policy
          </a>
          .
        </p>

        <p className="mt-6 text-center text-xs text-[var(--neo-muted)]">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <LoginInner />
    </GoogleOAuthProvider>
  );
}
