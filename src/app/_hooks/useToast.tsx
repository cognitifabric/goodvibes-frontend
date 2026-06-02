"use client";
import React, { useState, useEffect, useCallback } from "react";

export default function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const [type, setType] = useState<"error" | "success" | "info">("info");

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(t);
  }, [msg]);

  // Listen to global gv:toast events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === "string") setMsg(detail);
    };
    window.addEventListener("gv:toast", handler);
    return () => window.removeEventListener("gv:toast", handler);
  }, []);

  const toast = useCallback((message: string, t: "error" | "success" | "info" = "info") => {
    setType(t);
    setMsg(message);
  }, []);

  const ToastEl = msg ? (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <div
        className="glass px-5 py-3 rounded-2xl text-sm font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
        style={{
          color: type === "error" ? "#f87171" : type === "success" ? "#34d399" : "#e2e8f0",
          borderColor: type === "error" ? "rgba(248,113,113,0.3)" : type === "success" ? "rgba(52,211,153,0.3)" : undefined,
        }}
      >
        {msg}
      </div>
    </div>
  ) : null;

  return { toast, setMsg: (m: string) => { setType("error"); setMsg(m); }, ToastEl };
}
