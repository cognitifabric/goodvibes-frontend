"use client";
import React, { useEffect, useState } from "react";

export default function ToastBridgeClient() {
  const [toasts, setToasts] = useState<string[]>([]);

  useEffect(() => {
    const push = (msg: string) => {
      setToasts((t) => [...t, msg]);
      setTimeout(() => setToasts((t) => t.slice(1)), 3500);
    };

    const onApiToast = (e: Event) => push((e as CustomEvent).detail as string);
    const onUnhandled = (e: PromiseRejectionEvent) => {
      try { e.preventDefault(); } catch {}
      const reason: any = (e && (e.reason ?? (e as any).detail)) ?? {};
      const msg = (reason && (reason.message ?? String(reason))) || "Request failed";
      // emit same event so UI uses one codepath
      try { window.dispatchEvent(new CustomEvent("queuevibes:toast", { detail: msg })); } catch {}
      // optional redirect on auth
      if (/not authenticated|unauthori(s|z)ed|401/i.test(msg)) setTimeout(() => (window.location.href = "/login"), 300);
    };

    window.addEventListener("queuevibes:toast", onApiToast as EventListener);
    window.addEventListener("unhandledrejection", onUnhandled);
    return () => {
      window.removeEventListener("queuevibes:toast", onApiToast as EventListener);
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, []);

  if (!toasts.length) return null;
  return (
    <div aria-live="polite" className="fixed top-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((m, i) => (
        <div key={i} className="bg-black/85 text-white px-4 py-2 rounded shadow-lg max-w-xs text-sm" style={{ backdropFilter: "blur(6px)" }}>
          {m}
        </div>
      ))}
    </div>
  );
}