"use client";

import { usePublicTheme } from "@/hooks/use-public-theme";
import { cn } from "@/lib/utils";

export function PublicThemeWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  const { theme } = usePublicTheme();

  return (
    <div className={cn(theme === "dark" ? "public-dark" : "", "min-h-screen transition-colors duration-500", className)}>
      {children}
    </div>
  );
}
