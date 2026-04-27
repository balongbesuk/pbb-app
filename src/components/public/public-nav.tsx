"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, FilePlus2, LogIn } from "lucide-react";
import { PublicModeToggle } from "./public-mode-toggle";
import { usePublicThemeContext } from "./public-theme-provider";
import { SpptNewDialog } from "./sppt-new-dialog";
import { cn } from "@/lib/utils";

interface PublicNavProps {
  namaDesa: string;
  kecamatan: string;
  kabupaten: string;
  logoUrl: string | null;
  updatedAt?: string | Date | null;
}

export function PublicNav({ namaDesa, kecamatan, kabupaten, logoUrl, updatedAt }: PublicNavProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const { theme } = usePublicThemeContext();
  const isDark = theme === "dark";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cacheBuster = updatedAt ? `?v=${new Date(updatedAt).getTime()}` : "";
  const finalLogoUrl = logoUrl ? `${logoUrl}${cacheBuster}` : null;

  return (
    <nav
      className={cn(
        "fixed top-0 w-full p-4 sm:p-5 flex justify-between items-center z-50 transition-all duration-300",
        isScrolled 
          ? "backdrop-blur-md border-b border-border/50 py-3 shadow-md" 
          : "bg-transparent"
      )}
      style={{
        backgroundColor: isScrolled 
          ? (isDark ? "rgba(5, 11, 20, 0.85)" : "rgba(255, 255, 255, 0.85)")
          : "transparent"
      }}
    >
      <Link href="/" className="flex items-center gap-3 group hover:opacity-80 transition-opacity">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-white/20 group-hover:scale-105 transition-transform">
          {finalLogoUrl ? (
            <Image
              src={finalLogoUrl}
              alt={namaDesa ? `Logo Desa ${namaDesa}` : "Logo PBB Manager"}
              width={44}
              height={44}
              className="h-full w-full object-contain p-1"
              priority
              unoptimized
            />
          ) : (
            <div
              className="w-full h-full rounded-2xl flex items-center justify-center text-white"
              style={{ background: "linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)" }}
            >
              <Building2 className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="public-nav-name block text-base font-black leading-tight tracking-tight">
            {namaDesa ? `Desa ${namaDesa}` : "PBB Manager"}
          </span>
          {kecamatan && kabupaten && (
            <span className="public-nav-sub block text-[11px] font-medium opacity-60">
              Kec. {kecamatan}, Kab. {kabupaten}
            </span>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => setShowNewDialog(true)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 hover:bg-primary/20 transition-all group border border-primary/20"
          title="Pengajuan SPPT PBB Baru"
        >
          <FilePlus2 className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
        </button>
        <PublicModeToggle />
        <Link
          href="/login"
          className={cn(
            "public-cta-btn group flex items-center justify-center gap-2 text-white h-11 sm:h-12 rounded-2xl font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg",
            "w-11 sm:w-auto px-0 sm:px-6"
          )}
        >
          <span className="hidden sm:inline">Masuk Admin</span>
          <ArrowRight className="hidden sm:block w-4 h-4 group-hover:translate-x-1 transition-transform" />
          <LogIn className="sm:hidden w-5 h-5" />
        </Link>
      </div>

      <SpptNewDialog 
        open={showNewDialog} 
        onOpenChange={setShowNewDialog} 
        isDark={isDark} 
      />
    </nav>
  );
}
