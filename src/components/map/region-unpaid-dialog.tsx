"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, User, Copy, Check, RefreshCcw, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { UnpaidBillDialog } from "@/components/tax/unpaid-bill-dialog";
import { usePublicThemeContext } from "@/components/public/public-theme-provider";
import { cn } from "@/lib/utils";

interface RegionUnpaidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tahun: number;
  type: string;
  rt?: string;
  rw?: string;
  dusun?: string;
  title: string;
  container?: HTMLElement | null;
}

type UnpaidTaxItem = {
  id: string;
  nop: string;
  namaWp: string;
  rt?: string;
  rw?: string;
  ketetapan: number;
};

type RegionUnpaidResponse = {
  data: UnpaidTaxItem[];
  totalPiutang: number;
  totalCount: number;
  hasMore: boolean;
};

export function RegionUnpaidDialog({
  open,
  onOpenChange,
  tahun,
  type,
  rt,
  rw,
  dusun,
  title,
  container,
}: RegionUnpaidDialogProps) {
  const [data, setData] = useState<UnpaidTaxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPiutang, setTotalPiutang] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // State untuk Cek Bapenda
  const [checkingBapendaId, setCheckingBapendaId] = useState<string | null>(null);
  const [unpaidBillItem, setUnpaidBillItem] = useState<{ nop: string, namaWp: string } | null>(null);
  
  // State untuk pencarian
  const [search, setSearch] = useState("");
  const [dbSearch, setDbSearch] = useState("");

  // Theme support
  const publicContext = usePublicThemeContext();
  const isDark = publicContext ? publicContext.theme === "dark" : false;

  const fetchData = useCallback(async (p: number, isInitial: boolean = false) => {
    if (isInitial) {
        setLoading(true);
        setData([]);
    } else {
        setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        tahun: tahun.toString(),
        type,
        page: p.toString(),
        limit: "20",
        ...(rt && { rt }),
        ...(rw && { rw }),
        ...(dusun && { dusun }),
        ...(dbSearch && { search: dbSearch }),
      });
      const res = await fetch(`/api/region-unpaid?${params.toString()}`);
      const json = (await res.json()) as RegionUnpaidResponse;
      
      if (isInitial) {
        setData(json.data);
        setTotalPiutang(json.totalPiutang);
        setTotalCount(json.totalCount);
      } else {
        setData((prev) => [...prev, ...json.data]);
      }
      
      setHasMore(json.hasMore);
      setPage(p);
    } catch (err) {
      console.error("Gagal memuat data WP:", err);
      toast.error("Gagal memuat data Wajib Pajak");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [dusun, rt, rw, tahun, type, dbSearch]);

  useEffect(() => {
    if (open) {
      fetchData(1, true);
    }
  }, [fetchData, open, dbSearch]);

  // Debounce search (hanya trigger jika >= 3 karakter, atau kosongkan jika < 3)
  useEffect(() => {
    const timer = setTimeout(() => {
        if (search.length >= 3) {
            setDbSearch(search);
        } else {
            setDbSearch("");
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loadingMore && !loading) {
        fetchData(page + 1);
    }
  };

  const handleCopy = (nop: string) => {
    navigator.clipboard.writeText(nop.replace(/\D/g, ""));
    setCopiedId(nop);
    toast.success("NOP berhasil disalin");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCheckBapenda = async (wp: UnpaidTaxItem) => {
    setCheckingBapendaId(wp.id);
    try {
      toast.info(`Mengecek status pembayaran ${wp.namaWp}...`);
      const res = await fetch("/api/check-bapenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nop: wp.nop, tahun }),
      });
      
      const resData = await res.json();
      
      if (resData.isPaid) {
        toast.success(`${wp.namaWp} sudah lunas di Bapenda!`);
        // Remove from local list to reflect reality
        setData(prev => prev.filter(item => item.id !== wp.id));
        setTotalCount(prev => prev - 1);
        setTotalPiutang(prev => prev - wp.ketetapan);
      } else {
        setUnpaidBillItem({ nop: wp.nop, namaWp: wp.namaWp });
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server Bapenda");
      console.error(err);
    } finally {
      setCheckingBapendaId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent container={container} className={cn(
            "sm:max-w-4xl max-h-[85vh] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl transition-colors duration-300",
            isDark ? "bg-zinc-950 text-white" : "bg-white text-slate-950"
        )}>
          <DialogHeader className={cn(
            "p-8 pb-4 transition-colors duration-300",
            isDark ? "bg-zinc-900/50" : "bg-slate-50"
          )}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <div className="p-2 bg-primary/10 rounded-xl">
                      <User className="w-5 h-5 text-primary" />
                   </div>
                   <DialogTitle className="text-2xl font-black tracking-tight uppercase">
                     {title}
                   </DialogTitle>
                </div>
                <DialogDescription className="text-sm font-medium text-muted-foreground">
                  {dbSearch ? (
                    <span>Menampilkan hasil pencarian untuk &quot;<span className="text-primary font-bold">{dbSearch}</span>&quot;</span>
                  ) : (
                    <span>Menampilkan {data.length} dari {totalCount} Wajib Pajak yang belum melunasi PBB tahun {tahun}</span>
                  )}
                </DialogDescription>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Total Piutang</p>
                <p className={cn(
                    "text-2xl font-black tracking-tighter transition-colors",
                    isDark ? "text-rose-400" : "text-rose-600"
                )}>
                  {formatCurrency(totalPiutang)}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Search bar */}
          <div className="px-8 mt-4">
               <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Cari Nama atau NOP (Min. 3 karakter)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={cn(
                            "pl-10 pr-10 h-12 rounded-2xl focus-visible:ring-primary/20 border transition-all",
                            isDark 
                                ? "bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500" 
                                : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                        )}
                    />
                    {search && (
                        <button 
                            onClick={() => setSearch("")}
                            className={cn(
                                "absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors",
                                isDark ? "hover:bg-zinc-800" : "hover:bg-slate-200"
                            )}
                        >
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                    )}
               </div>
          </div>

          <div 
            className="px-8 pb-8 overflow-y-auto max-h-[55vh] scroll-smooth mt-4"
            onScroll={handleScroll}
          >
            {loading && data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">Sinkronisasi Data...</p>
              </div>
            ) : data.length === 0 ? (
              <div className={cn(
                "text-center py-20 rounded-3xl border border-dashed mt-4 transition-colors",
                isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-slate-50 border-slate-200"
              )}>
                {dbSearch ? (
                  <>
                    <p className="text-slate-600 font-black uppercase tracking-widest text-xs">Pencarian Tidak Ditemukan</p>
                    <p className="text-muted-foreground text-sm mt-1">Tidak ada NOP atau Nama &quot;{dbSearch}&quot; di wilayah ini.</p>
                  </>
                ) : (
                  <>
                    <p className="text-emerald-600 font-black uppercase tracking-widest text-xs">Semua Terbayar Lunas!</p>
                    <p className="text-muted-foreground text-sm mt-1">Tidak ada tunggakan pajak di wilayah ini.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {data.map((wp) => (
                  <div key={wp.id} className={cn(
                    "group relative border p-4 rounded-2xl hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300",
                    isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-100"
                  )}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                            "text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors mb-1",
                            isDark ? "text-white" : "text-slate-900"
                        )}>
                          {wp.namaWp}
                        </h4>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/50 transition-colors",
                            isDark ? "bg-zinc-800 border-zinc-700/50 text-slate-300" : "bg-slate-100 border-slate-200/50 text-muted-foreground/60"
                          )}>
                            Wilayah: RT {wp.rt} / RW {wp.rw}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div 
                            onClick={() => handleCopy(wp.nop)}
                            className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors"
                           >
                              <span className="text-[11px] font-mono text-muted-foreground font-bold">{wp.nop}</span>
                              {copiedId === wp.nop ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground/40" />}
                           </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-sm font-black text-rose-500 tracking-tighter mb-1">
                          {formatCurrency(wp.ketetapan)}
                        </p>
                          <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckBapenda(wp)}
                          disabled={checkingBapendaId === wp.id}
                          className={cn(
                            "h-8 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                            isDark 
                                ? "bg-emerald-950/30 border-emerald-500/20 text-emerald-400 hover:bg-emerald-900/50" 
                                : "bg-emerald-50 border-emerald-500/30 text-emerald-600 hover:bg-emerald-100"
                          )}
                        >
                          {checkingBapendaId === wp.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                          ) : (
                            <RefreshCcw className="w-3 h-3 mr-1.5" />
                          )}
                          Cek Bapenda
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loadingMore && (
              <div className="flex items-center justify-center py-6 gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Memuat data lainnya...</p>
              </div>
            )}
          </div>
          
        </DialogContent>
      </Dialog>

      {unpaidBillItem && (
        <UnpaidBillDialog
          open={!!unpaidBillItem}
          onOpenChange={(open) => !open && setUnpaidBillItem(null)}
          nop={unpaidBillItem.nop}
          namaWp={unpaidBillItem.namaWp}
          isDark={isDark}
          container={container}
        />
      )}
    </>
  );
}
