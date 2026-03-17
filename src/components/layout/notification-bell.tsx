"use client";

import { useState, useEffect } from "react";
import { Bell, Check, X, ArrowRight, Info, CalendarDays, Trash2 } from "lucide-react";
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
import {
  getNotifications,
  getPendingRequests,
  handleTransferResponse,
  markNotificationAsRead,
  markAllNotificationsRead,
  deleteAllNotifications,
} from "@/app/actions/transfer-actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchAll = async () => {
    try {
      const [notifs, reqs] = await Promise.all([getNotifications(), getPendingRequests()]);
      setNotifications(notifs);
      setPendingRequests(reqs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchAll();
    // Poll for notifications every 60 seconds (1 minute) to reduce database load
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted)
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="text-muted-foreground h-5 w-5" />
      </Button>
    );

  const unreadCount = notifications.filter((n) => !n.isRead).length + pendingRequests.length;

  const onResponse = async (requestId: string, status: "ACCEPTED" | "REJECTED") => {
    setLoading(true);
    const res = await handleTransferResponse(requestId, status);
    if (res.success) {
      toast.success(status === "ACCEPTED" ? "Data berhasil diterima" : "Data ditolak");
      fetchAll();
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  const onMarkRead = async (id: string) => {
    await markNotificationAsRead(id);
    fetchAll();
  };

  const onMarkAllRead = async () => {
    setLoading(true);
    await markAllNotificationsRead();
    fetchAll();
    setLoading(false);
  };

  const onDeleteAll = async () => {
    setLoading(true);
    await deleteAllNotifications();
    toast.success("Semua notifikasi dibersihkan.");
    fetchAll();
    setLoading(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Pemberitahuan"
        className="group hover:bg-muted relative cursor-pointer rounded-md p-2 transition-colors outline-none"
      >
        <Bell className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors" />
        {unreadCount > 0 && (
          <span className="bg-destructive border-background absolute top-1.5 right-1.5 flex h-4 min-w-[16px] animate-pulse items-center justify-center rounded-full border-2 px-0.5 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="glass w-80 overflow-hidden border-emerald-500/20 p-0 shadow-2xl"
      >
        <div className="border-b border-emerald-500/20 bg-emerald-500/10 p-4 dark:bg-emerald-950/30">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center justify-between p-0 font-bold text-emerald-700 dark:text-emerald-400">
              <span>Pemberitahuan</span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-5 border-none bg-emerald-500 text-[10px] text-white"
                  >
                    {unreadCount} Baru
                  </Badge>
                )}
                {notifications.some((n) => !n.isRead) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[9px] hover:bg-emerald-500/20"
                    onClick={onMarkAllRead}
                    disabled={loading}
                  >
                    Baca Semua
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-rose-500 hover:bg-rose-500/20 hover:text-rose-600 dark:hover:bg-rose-950/50"
                    onClick={onDeleteAll}
                    disabled={loading}
                    title="Hapus Semua Riwayat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {pendingRequests.length > 0 && (
            <div className="space-y-2 border-b border-emerald-500/10 bg-emerald-500/5 p-2 dark:border-emerald-500/20 dark:bg-emerald-950/20">
              <p className="mb-1 flex items-center gap-1 px-2 text-[10px] font-bold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                <ArrowRight className="h-3 w-3" />
                Butuh Persetujuan
              </p>
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="dark:bg-background/80 rounded-lg border border-emerald-500/20 bg-white/80 p-3 shadow-sm backdrop-blur-sm dark:border-emerald-500/30"
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-900 dark:text-gray-100">
                        {req.taxData.namaWp}
                      </p>
                      <p className="text-muted-foreground text-[10px]">Oleh: {req.sender.name}</p>
                    </div>
                    <Badge className="h-4 bg-sky-500 text-[8px]">Transfer</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-7 flex-1 bg-emerald-600 text-[10px] font-bold text-white shadow-sm hover:bg-emerald-700"
                      onClick={() => onResponse(req.id, "ACCEPTED")}
                      disabled={loading}
                    >
                      <Check className="mr-1 h-3 w-3" /> Terima
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 flex-1 border-rose-200 text-[10px] font-bold text-rose-600 shadow-sm hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                      onClick={() => onResponse(req.id, "REJECTED")}
                      disabled={loading}
                    >
                      <X className="mr-1 h-3 w-3" /> Tolak
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {notifications.length === 0 && pendingRequests.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center">
              <div className="bg-muted/30 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                <Bell className="h-6 w-6 opacity-20" />
              </div>
              <p className="text-sm">Tidak ada pemberitahuan baru.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                className={`border-border/40 flex cursor-pointer flex-col items-start gap-1 border-b p-4 last:border-0 focus:bg-emerald-50/50 dark:focus:bg-emerald-900/20 ${!notif.isRead ? "bg-emerald-50/20 dark:bg-emerald-950/30" : ""}`}
                onClick={() => onMarkRead(notif.id)}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div
                    className={`text-xs font-bold ${!notif.isRead ? "text-primary" : "text-foreground"}`}
                  >
                    {notif.type === "REJECTED" && (
                      <Badge variant="destructive" className="mr-2 h-4 text-[8px]">
                        Ditolak
                      </Badge>
                    )}
                    {notif.type === "ACCEPTED" && (
                      <Badge className="mr-2 h-4 bg-teal-500 text-[8px] hover:bg-teal-600">
                        Berhasil
                      </Badge>
                    )}
                    {notif.type === "INFO" && (
                      <Info className="mr-1 inline h-3 w-3 text-blue-500" />
                    )}
                    {notif.title}
                  </div>
                  {!notif.isRead && (
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                  )}
                </div>
                {notif.message && (
                  <p className="text-muted-foreground line-clamp-2 text-[11px] leading-relaxed">
                    {notif.message}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1 opacity-60">
                  <CalendarDays className="h-3 w-3 text-[10px]" />
                  <span className="text-[9px] font-medium">
                    {new Date(notif.createdAt).toLocaleDateString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
