"use client";
import React from "react";

// ─── GlassCard ─────────────────────────────────────────────────────────────
export const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`glass rounded-2xl ${className}`}
    {...props}
  />
));
GlassCard.displayName = "GlassCard";

// ─── GlassInput ────────────────────────────────────────────────────────────
export const GlassInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={`gv-input ${className}`}
    {...props}
  />
));
GlassInput.displayName = "GlassInput";

// ─── GlassButton ───────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "ghost" | "danger";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className = "", variant = "ghost", loading, disabled, children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-4 py-2.5 text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
    const variants: Record<ButtonVariant, string> = {
      primary: "bg-green-500 hover:bg-green-400 text-black",
      ghost:   "border border-white/10 hover:bg-white/5 text-white",
      danger:  "border border-red-500/30 hover:bg-red-500/10 text-red-400",
    };
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);
GlassButton.displayName = "GlassButton";
