"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
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
      <div className="flex min-w-0 flex-1 flex-col transition-all duration-300 print:block">
        <div className="print:hidden">
          <Topbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
