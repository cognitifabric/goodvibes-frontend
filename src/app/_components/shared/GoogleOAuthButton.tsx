"use client";
import React, { useEffect, useRef, useId } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (opts: any) => void;
          renderButton: (el: HTMLElement, opts: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface Props {
  onSuccess?: () => void;
  onError?: (msg: string) => void;
  label?: string;
}

export default function GoogleOAuthButton({ onSuccess, onError, label = "Continue with Google" }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    function init() {
      if (!window.google?.accounts?.id || !divRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            const res = await fetch("/api/user/auth/oauth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ provider: "google", idToken: response.credential }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Google login failed");
            onSuccess?.();
            window.location.href = "/dashboard";
          } catch (e: any) {
            onError?.(e.message || "Google login failed");
          }
        },
      });
      window.google.accounts.id.renderButton(divRef.current!, {
        theme: "filled_black",
        size: "large",
        shape: "rectangular",
        width: divRef.current!.offsetWidth || 320,
        text: "continue_with",
        logo_alignment: "left",
      });
    }

    if (window.google?.accounts?.id) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = init;
      document.head.appendChild(script);
    }
  }, []);

  // If no Google client ID configured, don't render
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;

  return (
    <div className="w-full">
      <div ref={divRef} className="w-full flex justify-center" />
    </div>
  );
}
