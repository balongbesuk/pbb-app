"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, toTitleCase } from "@/lib/utils";
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
  X,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

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
  { icon: Globe, label: "Portal Warga", href: "/", allowedRoles: ["ADMIN", "PENARIK", "PENGGUNA"] },
];

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "PENGGUNA";

  const [villageConfig, setVillageConfig] = useState<{
    namaDesa: string;
    logoUrl: string | null;
  }>({ namaDesa: "PBB Manager", logoUrl: null });

  useEffect(() => {
    fetch("/api/village-config")
      .then((r) => r.json())
      .then((d) => {
        setVillageConfig({
          namaDesa: d.namaDesa || "PBB Manager",
          logoUrl: d.logoUrl || null,
        });
      })
      .catch(() => {});
  }, []);

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
          "fixed top-0 z-40 flex h-screen flex-col border-r border-border bg-background transition-all duration-300 md:sticky",
          isCollapsed ? "w-20" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between gap-3 p-6">
          <div className="flex min-w-0 items-center gap-3">
            {/* Logo area */}
            <div className="bg-primary/5 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
              {villageConfig.logoUrl ? (
                <Image
                  src={villageConfig.logoUrl}
                  alt="Logo Desa"
                  width={40}
                  height={40}
                  className="h-full w-full object-contain p-0.5"
                />

              ) : (
                <Building2 className="text-primary h-6 w-6" />
              )}
            </div>
            {!isCollapsed && (
              <span className="text-foreground truncate text-sm font-bold leading-tight tracking-tight">
                {toTitleCase(villageConfig.namaDesa)}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Tutup menu"
            className="h-8 w-8 shrink-0 md:hidden"
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
                    <div className="bg-primary absolute left-0 h-5 w-1.5 rounded-r-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
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

        <div className="hidden border-t border-border p-4 md:block">
          <Button
            variant="ghost"
            size="icon"
            aria-label={isCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            className="h-10 w-full justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
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
