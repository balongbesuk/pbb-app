"use client";

import { usePublicTurnstile } from "./public-turnstile-provider";
import { Check, X, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function PublicGithubIcon() {
  const { turnstileStatus } = usePublicTurnstile();

  // Konfigurasi style berdasarkan status verifikasi Turnstile
  let borderCls = "";
  let dotCls = "";
  let tooltipText = "";
  let IconBadge = null;

  switch (turnstileStatus) {
    case "loading":
      borderCls = "border-blue-500/60 dark:border-blue-400/50 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.3)] bg-blue-500/5";
      dotCls = "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)] animate-pulse";
      tooltipText = "Keamanan: Memverifikasi peramban Anda...";
      break;

    case "success":
      borderCls = "border-emerald-500 dark:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] bg-emerald-500/5 hover:scale-110 active:scale-95";
      dotCls = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]";
      tooltipText = "Keamanan: Terverifikasi Aman (Bukan Bot)";
      IconBadge = (
        <div className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-emerald-500 rounded-full border border-background shadow-md z-20 animate-in zoom-in-50 duration-300">
          <Check className="w-2.5 h-2.5 text-white stroke-[4]" />
        </div>
      );
      break;

    case "error":
      borderCls = "border-rose-500 dark:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.6)] bg-rose-500/5 animate-shake";
      dotCls = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-ping";
      tooltipText = "Keamanan: Terdeteksi sebagai Bot!";
      IconBadge = (
        <div className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-rose-500 rounded-full border border-background shadow-md z-20 animate-bounce duration-300">
          <X className="w-2.5 h-2.5 text-white stroke-[4]" />
        </div>
      );
      break;

    case "expired":
      borderCls = "border-amber-500 dark:border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] bg-amber-500/5";
      dotCls = "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]";
      tooltipText = "Keamanan: Sesi kedaluwarsa. Silakan segarkan pencarian.";
      IconBadge = (
        <div className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-amber-500 rounded-full border border-background shadow-md z-20 animate-pulse duration-1000">
          <RotateCw className="w-2.5 h-2.5 text-white stroke-[3.5] animate-spin" style={{ animationDuration: '4s' }} />
        </div>
      );
      break;

    case "idle":
    default:
      borderCls = "border-zinc-300 dark:border-zinc-800 hover:border-black dark:hover:border-white hover:scale-105 active:scale-95";
      dotCls = "bg-zinc-400 dark:bg-zinc-700";
      tooltipText = "PBB Manager Repository";
      break;
  }

  return (
    <div className="relative group inline-flex items-center justify-center">
      <a
        href="https://github.com/balongbesuk/pbb-app"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "relative p-3 rounded-full border-2 transition-all duration-500 ease-out z-10",
          borderCls
        )}
        title={tooltipText}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-foreground transition-transform duration-500 group-hover:rotate-[360deg]"
        >
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
        
        {/* Indikator Status Dot Mini */}
        {turnstileStatus !== "idle" && (
          <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
            {turnstileStatus === "loading" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            )}
            <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5 transition-colors duration-500", dotCls)}></span>
          </span>
        )}
      </a>

      {/* Badge Ikon Tameng (Shield) */}
      {IconBadge}

      {/* Tooltip Kustom Cantik */}
      <div className="absolute bottom-full mb-3 flex-col items-center hidden group-hover:flex animate-in fade-in slide-in-from-bottom-2 duration-300 z-50">
        <span className="relative z-10 p-2 text-[10px] font-black tracking-wider uppercase leading-none text-white bg-black/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl shadow-xl whitespace-nowrap border border-white/5">
          {tooltipText}
        </span>
        <div className="w-3.5 h-3.5 -mt-2 rotate-45 bg-black/90 dark:bg-zinc-900/90 border-r border-b border-white/5"></div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
