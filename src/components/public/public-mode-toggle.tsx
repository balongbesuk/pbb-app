"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicTheme } from "@/hooks/use-public-theme";

export function PublicModeToggle() {
  const { theme, toggleTheme } = usePublicTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Ganti ke tema ${theme === "dark" ? "terang" : "gelap"}`}
      className="rounded-full bg-white/10 hover:bg-white/20 public-dark:bg-black/10 public-dark:hover:bg-black/20 border border-white/10"
      onClick={toggleTheme}
    >
      {theme === "dark" ? (
        <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-400" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] text-zinc-700" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
