"use client";

import { usePublicTheme } from "@/hooks/use-public-theme";
import { cn } from "@/lib/utils";

export function PublicThemeWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { theme } = usePublicTheme();
  const isDark = theme === "dark";

  // We use style={{ ... }} with a type assertion to inject CSS custom properties
  // This overrides what next-themes sets on <html> via CSS variable cascade
  const themeStyle = isDark
    ? {
        // Oceanic Dark Blue
        backgroundColor: "#050B14",
        backgroundImage: "radial-gradient(ellipse at top, #0F203B 0%, #050B14 60%, #02060D 100%)",
        color: "#F8FAFC",
      }
    : {
        // Light mode
        backgroundColor: "oklch(0.985 0.001 106.423)",
        backgroundImage: "linear-gradient(135deg, oklch(0.99 0.01 244.29) 0%, oklch(0.95 0.02 200.29) 100%)",
        color: "oklch(0.145 0.012 45.057)",
      };

  // CSS variable overrides injected as a <style> tag to handle Shadcn components inside
  const varOverrides = isDark
    ? `
      .public-area {
        --background: #050B14;
        --foreground: #F8FAFC;
        --card: #0A192F;
        --card-foreground: #F8FAFC;
        --popover: #0A192F;
        --popover-foreground: #F8FAFC;
        --primary: #3B82F6;
        --primary-foreground: #FFFFFF;
        --secondary: #1E293B;
        --secondary-foreground: #F1F5F9;
        --muted: #1E293B;
        --muted-foreground: #94A3B8;
        --accent: #1E293B;
        --accent-foreground: #F1F5F9;
        --border: #1E293B;
        --input: #0F203B;
        --ring: #3B82F6;
      }
    `
    : `
      .public-area {
        --background: oklch(0.985 0.001 106.423);
        --foreground: oklch(0.145 0.012 45.057);
        --card: oklch(1 0 0);
        --card-foreground: oklch(0.145 0.012 45.057);
        --popover: oklch(1 0 0);
        --popover-foreground: oklch(0.145 0.012 45.057);
        --primary: oklch(0.205 0.1 244.29);
        --primary-foreground: oklch(0.985 0.001 106.423);
        --secondary: oklch(0.97 0.01 244.29);
        --secondary-foreground: oklch(0.205 0.1 244.29);
        --muted: oklch(0.97 0.01 106.423);
        --muted-foreground: oklch(0.556 0.011 45.187);
        --accent: oklch(0.97 0.01 244.29);
        --accent-foreground: oklch(0.205 0.1 244.29);
        --border: oklch(0.922 0.011 45.187);
        --input: oklch(0.922 0.011 45.187);
        --ring: oklch(0.205 0.1 244.29);
      }
    `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: varOverrides }} />
      <div
        className={cn(
          isDark ? "public-dark" : "public-light",
          "public-area min-h-screen",
          className
        )}
        style={themeStyle}
      >
        {children}
      </div>
    </>
  );
}
