import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import QueryProvider from "@/components/query-provider";
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { getVillageConfig } from "@/app/actions/settings-actions";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});


export const viewport: Viewport = {
  themeColor: "#1e293b",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const config = await getVillageConfig();
  const villageName = config?.namaDesa || "";
  
  // Cache buster for icon based on updated time
  const iconUrl = config?.logoUrl 
    ? `${config.logoUrl}?v=${config.updatedAt instanceof Date ? config.updatedAt.getTime() : Date.now()}` 
    : "/icon.png";
  
  return {
    title: villageName 
      ? `PBB Manager | ${villageName}` 
      : "PBB Manager | Sistem Manajemen Penarikan Pajak",
    description: villageName 
      ? `Aplikasi Manajemen Penarikan Pajak Bumi Bangunan (PBB) Desa ${villageName}`
      : "Aplikasi Manajemen Penarikan Pajak Bumi Bangunan (PBB) Desa",
    icons: {
      icon: [
        { url: iconUrl },
        { url: iconUrl, sizes: "32x32", type: "image/png" },
      ],
      shortcut: iconUrl,
      apple: iconUrl,
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
      <body className={`${outfit.className} ${outfit.variable}`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <NuqsAdapter>
                <div className="gradient-bg min-h-screen print:h-auto print:min-h-0 print:bg-white" style={{ position: "relative", zIndex: 2 }}>
                  {children}
                </div>
                <Toaster position="top-right" />
              </NuqsAdapter>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

