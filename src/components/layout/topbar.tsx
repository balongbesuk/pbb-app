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
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut, Menu } from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { data: session } = useSession();
  const [mounted, setMounted] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user's avatar from API every time session changes
  React.useEffect(() => {
    if (!session?.user) return;
    fetch("/api/me/avatar")
      .then((r) => r.json())
      .then((d) => {
        if (d.avatarUrl) setAvatarUrl(d.avatarUrl + "?t=" + new Date().getTime());
      })
      .catch(() => {});
  }, [session]);

  if (!mounted) {
    return (
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
        <div className="flex-1" />
      </header>
    );
  }

  const initials = session?.user?.name?.charAt(0)?.toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex flex-1 items-center gap-2 md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Buka menu navigasi"
          className="md:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex-1" />
      </div>

      <div className="flex items-center gap-3">
        <ModeToggle />

        <NotificationBell />

        <div className="bg-border/20 mx-1 h-8 w-px md:mx-2" />

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">{session?.user?.name || "Admin"}</p>
            <p className="text-muted-foreground text-xs capitalize">
              {(session?.user as any)?.role?.toLowerCase() || "User"}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="hover:ring-primary/5 h-9 w-9 cursor-pointer rounded-full p-0 transition-all outline-none hover:ring-4">
              <div className="bg-primary/5 dark:bg-primary/10 text-primary border-primary/10 relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border text-sm font-black">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Foto profil"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 rounded-2xl border border-border bg-card p-2 shadow-2xl"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-3 py-2">
                  {/* Mini avatar in dropdown header */}
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-primary/10">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Foto profil"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-black text-primary">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-foreground text-sm leading-none font-bold">
                        {session?.user?.name || "User"}
                      </p>
                      <p className="text-muted-foreground mt-1 text-[10px] tracking-widest uppercase">
                        {(session?.user as any)?.role || "User"}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                {(session?.user as any)?.role !== "PENARIK" && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push("/settings/profile")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil &amp; Password</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
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
