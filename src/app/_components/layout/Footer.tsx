"use client";
import React from "react";
import { Music } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-12 px-6 border-t" style={{ borderColor: "var(--neo-shadow-dark)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
              }}
            >
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl" style={{ color: "var(--neo-text)" }}>
              AuraVibes
            </span>
          </div>

          <div className="flex gap-8">
            <a href="#" className="transition-colors" style={{ color: "var(--neo-muted)" }}>
              About
            </a>
            <a href="#" className="transition-colors" style={{ color: "var(--neo-muted)" }}>
              Features
            </a>
            <a href="#" className="transition-colors" style={{ color: "var(--neo-muted)" }}>
              Pricing
            </a>
            <a href="#" className="transition-colors" style={{ color: "var(--neo-muted)" }}>
              Contact
            </a>
          </div>

          <div style={{ color: "var(--neo-muted)" }}>© 2025 QueueVibes. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}