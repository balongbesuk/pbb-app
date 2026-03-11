"use client";

import { useEffect, useRef } from "react";
import { usePublicTheme } from "@/hooks/use-public-theme";
import { cn } from "@/lib/utils";

const DARK_CSS_VARS = {
  "--background": "#050B14",
  "--foreground": "#F8FAFC",
  "--card": "#0A192F",
  "--card-foreground": "#F8FAFC",
  "--popover": "#0A192F",
  "--popover-foreground": "#F8FAFC",
  "--primary": "#3B82F6",
  "--primary-foreground": "#FFFFFF",
  "--secondary": "#1E293B",
  "--secondary-foreground": "#F1F5F9",
  "--muted": "#1E293B",
  "--muted-foreground": "#94A3B8",
  "--accent": "#1E293B",
  "--accent-foreground": "#F1F5F9",
  "--border": "#1E293B",
  "--input": "#0F203B",
  "--ring": "#3B82F6",
};

const LIGHT_CSS_VARS = {
  "--background": "oklch(0.985 0.001 106.423)",
  "--foreground": "oklch(0.145 0.012 45.057)",
  "--card": "oklch(1 0 0)",
  "--card-foreground": "oklch(0.145 0.012 45.057)",
  "--popover": "oklch(1 0 0)",
  "--popover-foreground": "oklch(0.145 0.012 45.057)",
  "--primary": "oklch(0.205 0.1 244.29)",
  "--primary-foreground": "oklch(0.985 0.001 106.423)",
  "--secondary": "oklch(0.97 0.01 244.29)",
  "--secondary-foreground": "oklch(0.205 0.1 244.29)",
  "--muted": "oklch(0.97 0.01 106.423)",
  "--muted-foreground": "oklch(0.556 0.011 45.187)",
  "--accent": "oklch(0.97 0.01 244.29)",
  "--accent-foreground": "oklch(0.205 0.1 244.29)",
  "--border": "oklch(0.922 0.011 45.187)",
  "--input": "oklch(0.922 0.011 45.187)",
  "--ring": "oklch(0.205 0.1 244.29)",
};

export function PublicThemeWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { theme } = usePublicTheme();
  const isDark = theme === "dark";
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;

    const vars = isDark ? DARK_CSS_VARS : LIGHT_CSS_VARS;

    // Apply CSS variables directly to the element style
    Object.entries(vars).forEach(([key, val]) => {
      el.style.setProperty(key, val);
    });

    // Apply background directly
    if (isDark) {
      el.style.backgroundColor = "#050B14";
      el.style.backgroundImage = "radial-gradient(ellipse at top, #0F203B 0%, #050B14 60%, #02060D 100%)";
      el.style.color = "#F8FAFC";
    } else {
      el.style.backgroundColor = "oklch(0.985 0.001 106.423)";
      el.style.backgroundImage = "linear-gradient(135deg, oklch(0.99 0.01 244.29) 0%, oklch(0.95 0.02 200.29) 100%)";
      el.style.color = "oklch(0.145 0.012 45.057)";
    }
  }, [isDark]);

  return (
    <div
      ref={divRef}
      className={cn(
        isDark ? "public-dark" : "public-light",
        "public-area min-h-screen",
        className
      )}
    >
      {children}
    </div>
  );
}
