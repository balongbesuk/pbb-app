"use client";

import { usePublicTurnstile } from "./public-turnstile-provider";
import { MapPin, Check, X, RotateCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function TurnstileWidget() {
  const { turnstileContainerRef, turnstileStatus } = usePublicTurnstile();

  let borderCls = "";
  let iconCls = "";
  let statusText = "Portal Pajak Bumi dan Bangunan";
  let StatusIcon = MapPin;

  // Jika Turnstile dikonfigurasi, ubah border dan icon berdasarkan statusnya
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    switch (turnstileStatus) {
      case "loading":
        borderCls = "border-blue-500/60 dark:border-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.3)] bg-blue-500/10";
        iconCls = "text-blue-500 animate-spin";
        StatusIcon = Loader2;
        statusText = "Memverifikasi Keamanan...";
        break;
      case "success":
        borderCls = "border-emerald-500 dark:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] bg-emerald-500/10";
        iconCls = "text-emerald-500";
        StatusIcon = Check;
        break;
      case "error":
        borderCls = "border-rose-500 dark:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.6)] bg-rose-500/10 animate-shake";
        iconCls = "text-rose-500";
        StatusIcon = X;
        statusText = "Terdeteksi Bot!";
        break;
      case "expired":
        borderCls = "border-amber-500 dark:border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] bg-amber-500/10";
        iconCls = "text-amber-500";
        StatusIcon = RotateCw;
        statusText = "Sesi Kedaluwarsa";
        break;
      case "idle":
      default:
        borderCls = "border-zinc-200 dark:border-zinc-800";
        break;
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 mb-2">
      {/* Widget Turnstile */}
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <div className="flex justify-center">
          <div className="p-1 rounded-xl bg-white/5 border border-white/10 shadow-sm backdrop-blur-sm">
            <div ref={turnstileContainerRef} />
          </div>
        </div>
      )}

      {/* Badge Portal Pajak Bumi dan Bangunan yang merangkap Indikator Turnstile */}
      <div 
        className={cn(
          "public-badge inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 transition-all duration-500", 
          borderCls || "border-transparent" // Fallback jika tidak ada status (mengikuti CSS bawaan)
        )}
      >
        <span className="text-[10px] font-black tracking-widest uppercase">{statusText}</span>
        <StatusIcon className={cn("w-3.5 h-3.5", iconCls)} />
      </div>
    </div>
  );
}
