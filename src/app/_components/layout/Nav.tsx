"use client";
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Music, Menu, X } from "lucide-react";

export default function Nav({
  initialAuthenticated = false,
  user,
}: {
  initialAuthenticated?: boolean;
  user?: { id?: string; username?: string };
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  // initialize from server prop and keep it stable unless explicit client action occurs
  const [authenticated, setAuthenticated] = useState<boolean>(initialAuthenticated);

  // best-effort sync on client but do not overwrite server truthiness if initialAuthenticated === true
  useEffect(() => {
    if (!initialAuthenticated && typeof document !== "undefined") {
      // only attempt client cookie read when server said unauthenticated
      const hasSession = document.cookie.split(";").some((c) => c.trim().startsWith("gv_session="));
      if (hasSession) setAuthenticated(true);
    }
  }, [initialAuthenticated]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const api = await import("@/lib/api");
      await api.logout();
      setAuthenticated(false);
      try {
        document.cookie = "gv_session=;path=/;Max-Age=0";
      } catch {}
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Logout failed", err);
    } finally {
      setLoggingOut(false);
      window.location.href = "/login";
    }
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto">
        <div
          className="px-6 py-4 rounded-2xl backdrop-blur-md border border-white/20"
          style={{
            background: "rgba(255, 255, 255, 0.7)",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                }}
              >
                <Music className="w-5 h-5 text-white" />
              </div>
              <span
                className="text-2xl tracking-tight cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
                onClick={() => (window.location.href = "/")}
              >
                AuraVibes
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="transition-colors hover:opacity-80 cursor-pointer" style={{ color: "var(--neo-text)" }}>
                Features
              </a>
              <a href="#how-it-works" className="transition-colors hover:opacity-80 cursor-pointer" style={{ color: "var(--neo-text)" }}>
                How It Works
              </a>
              <a href="#pricing" className="transition-colors hover:opacity-80 cursor-pointer" style={{ color: "var(--neo-text)" }}>
                Pricing
              </a>
              <a href="/sets" className="transition-colors hover:opacity-80 cursor-pointer" style={{ color: "var(--neo-text)" }}>
                Sets
              </a>

              {!authenticated ? (
                <>
                  <a href="/login" className="cursor-pointer px-3 py-2 rounded-md text-sm" style={{ color: "var(--neo-text)" }}>
                    Log in
                  </a>
                  <button
                    onClick={() => (window.location.href = "/signup")}
                    className="px-6 py-2 rounded-xl text-white transition-all hover:scale-105 cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                      boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)",
                    }}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => (window.location.href = "/dashboard")}
                    className="px-6 py-2 rounded-xl text-white transition-all hover:scale-105 cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                      boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)",
                    }}
                    title="Account"
                    aria-label="Account"
                  >
                    Account
                  </button>

                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="px-4 py-2 rounded-md border bg-white/90 text-sm hover:opacity-90 cursor-pointer"
                    title="Log out"
                    aria-label="Log out"
                  >
                    {loggingOut ? "Logging out…" : "Log out"}
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg transition-colors cursor-pointer"
              style={{ color: "var(--neo-text)" }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pt-4 border-t"
              style={{ borderColor: "var(--neo-shadow-dark)" }}
            >
              <div className="flex flex-col gap-4">
                <a href="#features" className="transition-colors hover:opacity-80 cursor-pointer" style={{ color: "var(--neo-text)" }} onClick={() => setMobileMenuOpen(false)}>
                  Features
                </a>
                <a href="#how-it-works" className="transition-colors hover:opacity-80 cursor-pointer" style={{ color: "var(--neo-text)" }} onClick={() => setMobileMenuOpen(false)}>
                  How It Works
                </a>
                <a href="#pricing" className="transition-colors hover:opacity-80 cursor-pointer" style={{ color: "var(--neo-text)" }} onClick={() => setMobileMenuOpen(false)}>
                  Pricing
                </a>
                <a href="#sets" className="transition-colors hover:opacity-80 cursor-pointer" style={{ color: "var(--neo-text)" }} onClick={() => setMobileMenuOpen(false)}>
                  Sets
                </a>

                {!authenticated ? (
                  <>
                    <a href="/login" className="cursor-pointer px-6 py-2 rounded-md w-full text-center" onClick={() => setMobileMenuOpen(false)}>
                      Log in
                    </a>
                    <button
                      className="px-6 py-2 rounded-xl text-white transition-all hover:scale-105 w-full cursor-pointer"
                      style={{
                        background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                        boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)",
                      }}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        window.location.href = "/signup";
                      }}
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="px-6 py-2 rounded-md w-full cursor-pointer"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        window.location.href = "/dashboard";
                      }}
                    >
                      Account
                    </button>
                    <button
                      onClick={async () => {
                        setMobileMenuOpen(false);
                        await handleLogout();
                      }}
                      className="px-4 py-2 rounded-md border bg-white/90 w-full text-center cursor-pointer"
                      title="Log out"
                    >
                      Log out
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}