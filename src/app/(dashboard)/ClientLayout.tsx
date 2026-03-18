"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomNavbar } from "@/components/layout/bottom-navbar";
import { useState } from "react";
import { useSession } from "next-auth/react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: session } = useSession();

  // Jika user wajib ganti password, kita sembunyikan navigasi (sidebar & topbar)
  // agar mereka tidak bisa berpindah halaman sampai password diganti.
  const isForcedPasswordChange = session?.user?.mustChangePassword;

  if (isForcedPasswordChange) {
    return (
      <div className="bg-background text-foreground flex min-h-screen flex-col">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground flex min-h-screen overflow-x-hidden print:block print:bg-white print:text-black">
      <div className="print:hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300 print:block">
        <div className="sticky top-0 z-30 shrink-0 print:hidden">
          <Topbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        </div>
        <main className="flex-1 overflow-y-auto p-4 pb-28 md:p-8 print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
      <div className="print:hidden">
        <BottomNavbar />
      </div>
    </div>
  );
}
