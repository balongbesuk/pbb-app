import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import QueryProvider from "@/components/query-provider";

import { getVillageConfig } from "@/app/actions/settings-actions";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const viewport: Viewport = {
  themeColor: "#1e293b",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const config = await getVillageConfig();
  const villageName = config?.namaDesa || "";
  
  // Cache buster for icon based on updated time or current time
  const iconUrl = config?.logoUrl 
    ? `${config.logoUrl}?t=${config.updatedAt?.getTime() || Date.now()}` 
    : "/favicon.ico";
  
  return {
    title: villageName 
      ? `PBB Manager | ${villageName}` 
      : "PBB Manager | Sistem Manajemen Penarikan Pajak",
    description: `Aplikasi Manajemen Penarikan Pajak Bumi Bangunan (PBB) Desa ${villageName}`,
    icons: {
      icon: iconUrl,
    },
  };
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${outfit.className} ${outfit.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <div className="gradient-bg min-h-screen print:h-auto print:min-h-0 print:bg-white">
                {children}
              </div>
              <Toaster position="top-right" />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
