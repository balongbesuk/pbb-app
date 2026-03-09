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
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", allowedRoles: ["ADMIN", "PENARIK", "PENGGUNA"] },
  { icon: UploadCloud, label: "Upload PBB", href: "/upload-pbb", allowedRoles: ["ADMIN"] },
  { icon: Database, label: "Data Pajak", href: "/data-pajak", allowedRoles: ["ADMIN", "PENARIK", "PENGGUNA"] },
  { icon: Users, label: "Pengguna & Penarik", href: "/pengguna", allowedRoles: ["ADMIN"] },
  { icon: FileText, label: "Laporan", href: "/laporan", allowedRoles: ["ADMIN", "PENARIK", "PENGGUNA"] },
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

  const filteredMenuItems = menuItems.filter(item => item.allowedRoles.includes(userRole));

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-all"
          onClick={onClose}
        />
      )}

      <aside 
        className={cn(
          "fixed md:sticky top-0 h-screen glass border-r border-border/50 flex flex-col z-40 transition-all duration-300",
          isCollapsed ? "w-20" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl shrink-0 shadow-lg shadow-primary/20">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-xl tracking-tight truncate">PBB Manager</span>
            )}
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="md:hidden border-none bg-transparent"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

      <nav className="flex-1 px-3 space-y-1">
        {filteredMenuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
              pathname === item.href 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "text-muted-foreground hover:bg-secondary/50 hover:text-primary"
            )}>
              <item.icon className={cn("w-5 h-5", pathname === item.href ? "text-primary-foreground" : "group-hover:text-primary")} />
              {!isCollapsed && <span className="font-semibold">{item.label}</span>}
            </div>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border/50 hidden md:block">
        <Button 
          variant="outline" 
          size="icon" 
          className="w-full justify-center border-primary/20 hover:bg-primary/10 hover:text-primary transition-all" 
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronLeft className={cn("w-5 h-5 text-primary transition-transform", isCollapsed && "rotate-180")} />
        </Button>
      </div>
    </aside>
    </>
  );
}
