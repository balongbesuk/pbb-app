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
} from "lucide-react";
import { useSession } from "next-auth/react";

export function BottomNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "PENGGUNA";

  const navItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/dashboard",
      allowedRoles: ["ADMIN", "PENARIK", "PENGGUNA"],
    },
    {
      icon: Database,
      label: "Data Pajak",
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
      icon: Globe,
      label: "Portal Warga",
      href: "/",
      allowedRoles: ["ADMIN", "PENARIK", "PENGGUNA"],
    },
  ];

  const filteredItems = navItems.filter((item) =>
    item.allowedRoles.includes(userRole)
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-border bg-background/80 px-4 pb-safe backdrop-blur-xl md:hidden">
      {filteredItems.map((item) => {
        const isActive = pathname === item.href || (item.isCenter && pathname === "/data-pajak");
        const Icon = item.icon;

        if (item.isCenter) {
          return (
            <Link key={item.href} href={item.href} className="relative -mt-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 outline-none ring-4 ring-background transition-transform active:scale-90">
                <Icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <span className="mt-2 block text-center text-[10px] font-bold text-primary">
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("h-6 w-6", isActive && "animate-in zoom-in-75 duration-300")} />
            <span className={cn("text-[10px] font-medium tracking-tight", isActive && "font-bold")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
