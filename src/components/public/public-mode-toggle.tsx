"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicThemeContext } from "@/components/public/public-theme-provider";

export function PublicModeToggle() {
  const { theme, toggleTheme } = usePublicThemeContext();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      className={`rounded-full border transition-all h-11 w-11 ${
        isDark
          ? "bg-[#0A192F]/70 hover:bg-[#0F203B] border-white/10 text-yellow-400 hover:text-yellow-300"
          : "bg-white/60 hover:bg-white border-zinc-200 text-zinc-700 hover:text-zinc-900"
      }`}

      onClick={toggleTheme}
    >
      {isDark ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">
        {isDark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      </span>
    </Button>
  );
}
