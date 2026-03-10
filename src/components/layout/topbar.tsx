"use client";
import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, User, LogOut } from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Menu } from "lucide-react";

export function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { data: session } = useSession();
  const [mounted, setMounted] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="h-16 glass sticky top-0 z-10 border-b border-border/50 flex items-center justify-between px-4 md:px-6">
        <div className="flex-1" />
      </header>
    );
  }

  return (
    <header className="h-16 glass sticky top-0 z-10 border-b border-border/50 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex-1" />
      </div>

      <div className="flex items-center gap-3">
        <ModeToggle />

        <NotificationBell />

        <div className="h-8 w-px bg-border/20 mx-1 md:mx-2" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">{session?.user?.name || "Admin"}</p>
            <p className="text-xs text-muted-foreground capitalize">{(session?.user as any)?.role?.toLowerCase() || "User"}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="p-0 h-10 w-10 rounded-full hover:bg-muted transition-colors cursor-pointer outline-none">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {session?.user?.name?.charAt(0) || "A"}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass border-border/50">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push("/settings/profile")}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil & Password</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => signOut({ callbackUrl: '/login' })}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
