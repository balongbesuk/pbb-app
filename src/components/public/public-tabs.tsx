"use client";

import { useState } from "react";
import { PublicSearch } from "./public-search";
import { PublicGis } from "./public-gis";
import { Search, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePublicThemeContext } from "./public-theme-provider";

interface PublicTabsProps {
  tahunPajak: number;
  showNominalPajak: boolean;
  enablePublicGis?: boolean;
}

export function PublicTabs({ tahunPajak, showNominalPajak, enablePublicGis = true }: PublicTabsProps) {
  const [activeTab, setActiveTab] = useState<"SEARCH" | "GIS">("SEARCH");
  const { theme } = usePublicThemeContext();
  const isDark = theme === "dark";

  return (
    <div className="w-full flex flex-col items-center gap-12">
      {/* Tab Nav - Kinetic Sliding Indicator */}
      {enablePublicGis ? (
        <div className={cn(
          "relative inline-flex p-1.5 rounded-full shadow-inner animate-in fade-in zoom-in-95 duration-1000 overflow-hidden border",
          isDark 
            ? "bg-zinc-950/80 border-white/5 shadow-black/40" 
            : "bg-slate-200/60 border-slate-200 shadow-slate-300/20"
        )}>
          {/* Animated Indicator Background */}
          <div 
            className={cn(
              "absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-xl z-0",
              activeTab === "SEARCH" ? "translate-x-0" : "translate-x-full",
              "bg-blue-600 shadow-blue-500/20 dark:shadow-blue-900/40"
            )}
          />

          <button
            onClick={() => setActiveTab("SEARCH")}
            className={cn(
              "flex items-center justify-center gap-2.5 px-10 py-3.5 rounded-full transition-all duration-500 relative z-10 w-44 group active:scale-95",
              activeTab === "SEARCH" 
                ? "text-white" 
                : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
            )}
          >
              <Search className={cn("w-4 h-4 transition-all duration-500", activeTab === "SEARCH" ? "scale-110" : "scale-100 opacity-60")} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cek Status</span>
          </button>

          <button
            onClick={() => setActiveTab("GIS")}
            className={cn(
              "flex items-center justify-center gap-2.5 px-10 py-3.5 rounded-full transition-all duration-500 relative z-10 w-44 group active:scale-95",
              activeTab === "GIS" 
                ? "text-white" 
                : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
            )}
          >
              <MapIcon className={cn("w-4 h-4 transition-all duration-500", activeTab === "GIS" ? "scale-110" : "scale-100 opacity-60")} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Peta GIS</span>
          </button>
        </div>
      ) : null}

      <div className="w-full">
        {activeTab === "SEARCH" || !enablePublicGis ? (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
            <PublicSearch 
              tahunPajak={tahunPajak} 
              showNominalPajak={showNominalPajak} 
            />
          </div>
        ) : (
          <PublicGis tahunPajak={tahunPajak} />
        )}
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
