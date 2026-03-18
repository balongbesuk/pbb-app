"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Database,
  FileText,
  Globe,
  Search,
  History,
} from "lucide-react";
import { useSession } from "next-auth/react";

export function BottomNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "PENGGUNA";

  const navItems = [
    {
      icon: LayoutDashboard,
      label: "Beranda",
      href: "/dashboard",
      allowedRoles: ["ADMIN", "PENARIK", "PENGGUNA"],
    },
    {
      icon: Database,
      label: "Data PBB",
      href: "/data-pajak",
      allowedRoles: ["ADMIN", "PENARIK", "PENGGUNA"],
    },
    {
      icon: Search,
      label: "Cari",
      href: "/data-pajak?focus=search",
      isCenter: true,
      allowedRoles: ["ADMIN", "PENARIK", "PENGGUNA"],
    },
    {
      icon: FileText,
      label: "Laporan",
      href: "/laporan",
      allowedRoles: ["ADMIN", "PENARIK", "PENGGUNA"],
    },
    {
      icon: History,
      label: "Riwayat",
      href: "/riwayat",
      allowedRoles: ["PENARIK"],
    },
    {
      icon: Globe,
      label: "Portal",
      href: "/",
      allowedRoles: ["ADMIN", "PENGGUNA"],
    },
  ];

  const filteredItems = navItems.filter((item) =>
    item.allowedRoles.includes(userRole)
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/60 backdrop-blur-2xl border-t border-white/5 pb-safe ring-1 ring-white/5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
      <div className="flex h-20 items-center justify-around px-4">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || (item.isCenter && pathname === "/data-pajak");
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link key={item.href} href={item.href} className="relative -mt-10 group">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/40 outline-none ring-4 ring-background transition-all group-active:scale-90 group-active:rotate-3">
                  <Icon className="h-8 w-8 text-primary-foreground stroke-[2.5px]" />
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary/20 rounded-full blur-md opacity-0 group-active:opacity-100 transition-opacity" />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1.5 transition-all w-14",
                isActive ? "text-primary" : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all",
                isActive ? "bg-primary/10" : "group-hover:bg-zinc-100/10"
              )}>
                <Icon className={cn(
                  "h-6 w-6 transition-all", 
                  isActive ? "stroke-[2.5px] scale-110" : "stroke-2"
                )} />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-tighter transition-all", 
                isActive ? "opacity-100" : "opacity-60"
              )}>
                {item.label}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-1 h-1 w-1 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)] animate-in fade-in zoom-in duration-500" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
