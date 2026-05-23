"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { usePublicThemeContext } from "./public-theme-provider";

export type TurnstileStatus = "loading" | "success" | "error" | "expired" | "idle";

interface PublicTurnstileContextValue {
  turnstileToken: string | null;
  resetTurnstile: () => void;
  turnstileContainerRef: React.RefObject<HTMLDivElement | null>;
  turnstileStatus: TurnstileStatus;
}

const PublicTurnstileContext = createContext<PublicTurnstileContextValue>({
  turnstileToken: null,
  resetTurnstile: () => {},
  turnstileContainerRef: { current: null },
  turnstileStatus: "idle",
});

export function PublicTurnstileProvider({ children }: { children: React.ReactNode }) {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileStatus, setTurnstileStatus] = useState<TurnstileStatus>(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? "loading" : "idle"
  );
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const { theme } = usePublicThemeContext();
  const isDark = theme === "dark";

  const initTurnstile = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      (window as any).turnstile &&
      turnstileContainerRef.current &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    ) {
      try {
        // Hapus widget lama jika sudah ada
        if (widgetIdRef.current) {
          try {
            (window as any).turnstile.remove(widgetIdRef.current);
          } catch (e) {
            // Abaikan jika sudah di-remove
          }
          widgetIdRef.current = null;
        }

        turnstileContainerRef.current.innerHTML = "";
        
        console.log("[Turnstile Provider] Rendering widget, theme:", isDark ? "dark" : "light");
        setTurnstileStatus("loading");
        
        const id = (window as any).turnstile.render(turnstileContainerRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
          appearance: "interaction-only", // Invisible secara visual oleh default
          callback: (token: string) => {
            console.log("[Turnstile Provider] Token received successfully.");
            setTurnstileToken(token);
            setTurnstileStatus("success");
          },
          "expired-callback": () => {
            console.log("[Turnstile Provider] Token expired.");
            setTurnstileToken(null);
            setTurnstileStatus("expired");
          },
          "error-callback": (err: any) => {
            console.error("[Turnstile Provider] Error callback:", err);
            setTurnstileToken(null);
            setTurnstileStatus("error");
          },
          theme: isDark ? "dark" : "light",
        });
        widgetIdRef.current = id;
      } catch (e) {
        console.error("Turnstile render error:", e);
        setTurnstileStatus("error");
      }
    } else if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      setTurnstileStatus("idle");
    }
  }, [isDark]);

  const resetTurnstile = useCallback(() => {
    if (typeof window !== "undefined" && (window as any).turnstile && widgetIdRef.current) {
      console.log("[Turnstile Provider] Resetting turnstile widget.");
      try {
        setTurnstileToken(null);
        setTurnstileStatus("loading");
        (window as any).turnstile.reset(widgetIdRef.current);
      } catch (e) {
        console.error("Turnstile reset error:", e);
        initTurnstile();
      }
    } else {
      initTurnstile();
    }
  }, [initTurnstile]);

  // Render ulang jika script sudah ter-load dan ref/theme berubah
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).turnstile) {
      initTurnstile();
    }
  }, [initTurnstile]);

  return (
    <PublicTurnstileContext.Provider value={{ turnstileToken, resetTurnstile, turnstileContainerRef, turnstileStatus }}>
      {children}
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <>
          {/* Script dimuat secara terpusat */}
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onLoad={initTurnstile}
          />
        </>
      )}
    </PublicTurnstileContext.Provider>
  );
}

export function usePublicTurnstile() {
  return useContext(PublicTurnstileContext);
}
