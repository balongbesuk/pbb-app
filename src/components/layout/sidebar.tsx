"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UploadCloud,
  Database,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  Building2,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/dashboard",
    allowedRoles: ["ADMIN", "PENARIK", "PENGGUNA"],
  },
  { icon: UploadCloud, label: "Upload PBB", href: "/upload-pbb", allowedRoles: ["ADMIN"] },
  {
    icon: Database,
    label: "Data Pajak",
    href: "/data-pajak",
    allowedRoles: ["ADMIN", "PENARIK", "PENGGUNA"],
  },
  { icon: Users, label: "Pengguna & Penarik", href: "/pengguna", allowedRoles: ["ADMIN"] },
  {
    icon: FileText,
    label: "Laporan",
    href: "/laporan",
    allowedRoles: ["ADMIN", "PENARIK", "PENGGUNA"],
  },
  { icon: Activity, label: "Log Aktivitas", href: "/log-aktivitas", allowedRoles: ["ADMIN"] },
  { icon: Settings, label: "Pengaturan", href: "/settings", allowedRoles: ["ADMIN"] },
];

import { useSession } from "next-auth/react";
import { X } from "lucide-react";

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "PENGGUNA";

  const filteredMenuItems = menuItems.filter((item) => item.allowedRoles.includes(userRole));

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-all md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 z-40 flex h-screen flex-col border-r border-zinc-100 bg-white transition-all duration-300 md:sticky dark:border-zinc-900 dark:bg-zinc-950",
          isCollapsed ? "w-20" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between gap-3 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <Building2 className="text-primary h-6 w-6" />
            </div>
            {!isCollapsed && (
              <span className="text-foreground text-xl font-bold tracking-tight">PBB Manager</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Tutup menu"
            className="h-8 w-8 md:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-4 pt-2">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all duration-200",
                    isActive
                      ? "bg-primary/5 text-primary font-bold"
                      : "hover:text-foreground text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  )}
                >
                  {isActive && (
                    <div className="bg-primary absolute left-0 h-5 w-1 rounded-r-full" />
                  )}
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-primary" : "group-hover:text-foreground text-zinc-400"
                    )}
                  />
                  {!isCollapsed && <span className="text-sm tracking-tight">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-zinc-100 p-4 md:block dark:border-zinc-900">
          <Button
            variant="ghost"
            size="icon"
            aria-label={isCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            className="h-10 w-full justify-center text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronLeft
              className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")}
            />
          </Button>
        </div>
      </aside>
    </>
  );
}
