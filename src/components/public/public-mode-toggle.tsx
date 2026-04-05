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
      className={`rounded-full border transition-all h-11 w-11 shadow-sm ${
        isDark
          ? "bg-zinc-900 hover:bg-zinc-800 border-white/10 text-white"
          : "bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-900"
      }`}
      onClick={toggleTheme}
    >
      {isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">
        {isDark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      </span>
    </Button>
  );
}
