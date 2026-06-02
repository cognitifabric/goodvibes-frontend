"use client";
import React from "react";
import { Music, LogOut } from "lucide-react";
import { logout } from "@/lib/api";
import type { Me } from "@/lib/types";

export default function Nav({ me }: { me: Me | null }) {
  async function handleLogout() {
    await logout().catch(() => {});
    window.location.href = "/login";
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 h-16 md:h-[72px] flex items-center justify-between px-4 md:px-8 border-b border-white/5"
      style={{ background: "rgba(10,10,15,0.85)", backdropFilter: "blur(12px)" }}
    >
      {/* Logo */}
      <a href="/dashboard" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
          <Music className="w-4 h-4 text-black" />
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">GoodVibes</span>
      </a>

      {/* Right */}
      {me && (
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-white text-sm font-medium leading-none">
              {me.firstName || me.username}
            </span>
            <span className="text-gray-500 text-xs mt-0.5 capitalize">{me.plan || "free"}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-purple-500 flex items-center justify-center text-black font-bold text-sm select-none">
            {(me.firstName?.[0] || me.username?.[0] || "?").toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </nav>
  );
}
