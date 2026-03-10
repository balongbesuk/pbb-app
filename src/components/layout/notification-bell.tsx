"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Check,
  X,
  ArrowRight,
  Info,
  CalendarDays
} from "lucide-react";
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
import { getNotifications, getPendingRequests, handleTransferResponse, markNotificationAsRead } from "@/app/actions/transfer-actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchAll = async () => {
    try {
      const [notifs, reqs] = await Promise.all([
        getNotifications(),
        getPendingRequests()
      ]);
      setNotifications(notifs);
      setPendingRequests(reqs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchAll();
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return (
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="w-5 h-5 text-muted-foreground" />
    </Button>
  );

  const unreadCount = notifications.filter(n => !n.isRead).length + pendingRequests.length;

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
    // We'll need a new action for this or just loop. Loop is easier for now but less efficient.
    // Let's assume we want a single action for efficiency.
    await Promise.all(notifications.filter(n => !n.isRead).map(n => markNotificationAsRead(n.id)));
    fetchAll();
    setLoading(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative group p-2 rounded-md hover:bg-muted transition-colors cursor-pointer outline-none">
        <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-destructive text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse border-2 border-background px-0.5">
            {unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden glass border-emerald-500/20 shadow-2xl">
        <div className="bg-emerald-500/10 dark:bg-emerald-950/30 p-4 border-b border-emerald-500/20">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-0 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-between">
              <span>Pemberitahuan</span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && <Badge variant="secondary" className="bg-emerald-500 text-white border-none text-[10px] h-5">{unreadCount} Baru</Badge>}
                {notifications.some(n => !n.isRead) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[9px] px-1.5 hover:bg-emerald-500/20"
                    onClick={onMarkAllRead}
                    disabled={loading}
                  >
                    Baca Semua
                  </Button>
                )}
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {pendingRequests.length > 0 && (
            <div className="p-2 space-y-2 bg-emerald-500/5 dark:bg-emerald-950/20 border-b border-emerald-500/10 dark:border-emerald-500/20">
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 px-2 flex items-center gap-1 uppercase tracking-wider mb-1">
                <ArrowRight className="w-3 h-3" />
                Butuh Persetujuan
              </p>
              {pendingRequests.map(req => (
                <div key={req.id} className="p-3 bg-white/80 dark:bg-background/80 backdrop-blur-sm border border-emerald-500/20 dark:border-emerald-500/30 rounded-lg shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{req.taxData.namaWp}</p>
                      <p className="text-[10px] text-muted-foreground">Oleh: {req.sender.name}</p>
                    </div>
                    <Badge className="bg-sky-500 text-[8px] h-4">Transfer</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-7 text-[10px] flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-sm"
                      onClick={() => onResponse(req.id, "ACCEPTED")}
                      disabled={loading}
                    >
                      <Check className="w-3 h-3 mr-1" /> Terima
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/50 font-bold shadow-sm"
                      onClick={() => onResponse(req.id, "REJECTED")}
                      disabled={loading}
                    >
                      <X className="w-3 h-3 mr-1" /> Tolak
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {notifications.length === 0 && pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="bg-muted/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 opacity-20" />
              </div>
              <p className="text-sm">Tidak ada pemberitahuan baru.</p>
            </div>
          ) : (
            notifications.map(notif => (
              <DropdownMenuItem
                key={notif.id}
                className={`p-4 flex flex-col items-start gap-1 border-b last:border-0 border-border/40 focus:bg-emerald-50/50 dark:focus:bg-emerald-900/20 cursor-pointer ${!notif.isRead ? 'bg-emerald-50/20 dark:bg-emerald-950/30' : ''}`}
                onClick={() => onMarkRead(notif.id)}
              >
                <div className="flex w-full justify-between items-start gap-2">
                  <div className={`text-xs font-bold ${!notif.isRead ? 'text-primary' : 'text-foreground'}`}>
                    {notif.type === 'REJECTED' && <Badge variant="destructive" className="mr-2 text-[8px] h-4">Ditolak</Badge>}
                    {notif.type === 'ACCEPTED' && <Badge className="mr-2 bg-teal-500 hover:bg-teal-600 text-[8px] h-4">Berhasil</Badge>}
                    {notif.type === 'INFO' && <Info className="w-3 h-3 inline mr-1 text-blue-500" />}
                    {notif.title}
                  </div>
                  {!notif.isRead && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1" />}
                </div>
                {notif.message && <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{notif.message}</p>}
                <div className="flex items-center gap-1 mt-2 opacity-60">
                  <CalendarDays className="w-3 h-3 text-[10px]" />
                  <span className="text-[9px] font-medium">{new Date(notif.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
