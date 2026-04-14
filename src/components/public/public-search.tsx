"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { searchPublicTaxData } from "@/app/actions/public-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Search, MapPin, User, CheckCircle2, Phone, Info, Wallet, 
  ShieldAlert, Ruler, AlertCircle, History, Download, Eye, RefreshCcw, 
  Copy, Check, FileText, Menu, ChevronDown, Printer 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePublicThemeContext } from "@/components/public/public-theme-provider";
import { formatCurrency, formatDate, formatDateNoTime, formatJatuhTempo, cn } from "@/lib/utils";
import { toast } from "sonner";
import { UnpaidBillDialog } from "@/components/tax/unpaid-bill-dialog";
import { SpptMutationDialog } from "./sppt-mutation-dialog";
import { SpopFormDialog } from "./spop-form-dialog";

interface PublicSearchResultItem {
  id: number;
  nop: string;
  namaWp: string;
  alamat: string;
  luasTanah: number;
  luasBangunan: number;
  tagihan: number;
  status: string;
  updatedAt: string | Date;
  tanggalBayar: string | Date | null;
  arsipUrl: string | null;
  tahun: number;
  dusun: string | null;
  rt: string | null;
  rw: string | null;
  petugas: {
    nama: string | null;
    kontak: string;
    wilayah: string;
  } | null;
}

type PublicSearchResponse = Awaited<ReturnType<typeof searchPublicTaxData>> & {
  jatuhTempo?: string;
  bapendaUrl?: string | null;
  isJombangBapenda?: boolean;
  enableBapendaSync?: boolean;
  rateLimited?: boolean;
};

export function PublicSearch({ 
  tahunPajak, 
  showNominalPajak = false 
}: { 
  tahunPajak: number;
  showNominalPajak?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PublicSearchResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [message, setMessage] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [jatuhTempo, setJatuhTempo] = useState("31 Agustus");
  const [bapendaUrl, setBapendaUrl] = useState<string | null>(null);
  const [isJombangBapenda, setIsJombangBapenda] = useState(true);
  const [enableBapendaSync, setEnableBapendaSync] = useState(true);
  const { theme } = usePublicThemeContext();
  const [openPdfMap, setOpenPdfMap] = useState<Record<string, boolean>>({});
  const [isCheckingAuto, setIsCheckingAuto] = useState<Record<string, boolean>>({});
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [showPayRedirect, setShowPayRedirect] = useState<{ nop: string, namaWp: string } | null>(null);
  const [mutationItem, setMutationItem] = useState<PublicSearchResultItem | null>(null);
  const [spopItem, setSpopItem] = useState<PublicSearchResultItem | null>(null);
  const [copiedNop, setCopiedNop] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  const togglePdf = (nop: string) => {
    setOpenPdfMap(prev => ({ ...prev, [nop]: !prev[nop] }));
  };


  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    setMessage("");
    setIsRateLimited(false);
    setPage(1); // Reset to page 1 for new search
    
    const res = await searchPublicTaxData(query, tahunPajak, 1);
    if (res.success) {
      const data = res.data || [];
      setResults(data);
      setHasMore(!!res.hasMore);

      // Simpan ke riwayat jika ada hasil
      if (data.length > 0) {
        setRecentSearches(prev => {
          const filtered = prev.filter(s => s.toLowerCase() !== query.toLowerCase());
          const next = [query, ...filtered].slice(0, 3);
          localStorage.setItem("pbb_recent_searches", JSON.stringify(next));
          return next;
        });
      }

      const successRes = res as PublicSearchResponse;
      if (successRes.jatuhTempo) {
        setJatuhTempo(successRes.jatuhTempo);
      }
      if (successRes.bapendaUrl) {
        setBapendaUrl(successRes.bapendaUrl);
        setIsJombangBapenda(!!successRes.isJombangBapenda);
        setEnableBapendaSync(!!successRes.enableBapendaSync);
      } else {
        setBapendaUrl(null);
      }
    } else {
      const errorRes = res as PublicSearchResponse;
      setResults([]);
      setHasMore(false);
      setMessage(res.message || "Terjadi kesalahan sistem.");
      if (errorRes.rateLimited) {
        setIsRateLimited(true);
      }
    }
    setLoading(false);
  };

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    const nextPage = page + 1;
    
    const res = await searchPublicTaxData(query, tahunPajak, nextPage);
    if (res.success) {
      setResults(prev => [...prev, ...(res.data || [])]);
      setPage(nextPage);
      setHasMore(!!res.hasMore);
    }
    setIsLoadingMore(false);
  }, [page, hasMore, isLoadingMore, query, tahunPajak]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("pbb_recent_searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Gagal memuat riwayat pencarian:", e);
      }
    }
  }, []);

  const handleRecentClick = (s: string) => {
    setQuery(s);
    // Trigger search immediately after state update (using same logic as submit)
    setTimeout(() => {
        // Search using the string 's' directly to avoid stale 'query' state check
        handleSearchWithTerm(s);
    }, 10);
  };

  const handleSearchWithTerm = async (term: string) => {
    if (!term.trim()) return;
    setLoading(true);
    setHasSearched(true);
    setMessage("");
    setIsRateLimited(false);
    setPage(1);
    
    const res = await searchPublicTaxData(term, tahunPajak, 1);
    if (res.success) {
      const data = res.data || [];
      setResults(data);
      setHasMore(!!res.hasMore);
      // Update posisinya di riwayat
      setRecentSearches(prev => {
        const filtered = prev.filter(s => s.toLowerCase() !== term.toLowerCase());
        const next = [term, ...filtered].slice(0, 3);
        localStorage.setItem("pbb_recent_searches", JSON.stringify(next));
        return next;
      });
      const successRes = res as PublicSearchResponse;
      if (successRes.jatuhTempo) setJatuhTempo(successRes.jatuhTempo);
      if (successRes.bapendaUrl) {
         setBapendaUrl(successRes.bapendaUrl);
         setIsJombangBapenda(!!successRes.isJombangBapenda);
         setEnableBapendaSync(!!successRes.enableBapendaSync);
      }
    } else {
      setResults([]);
      setHasMore(false);
      setMessage(res.message || "Terjadi kesalahan sistem.");
    }
    setLoading(false);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoadingMore]);

  const handleCheckBapenda = async (nop: string) => {
    const lastCheck = cooldowns[nop] || 0;
    const now = Date.now();
    const COOLDOWN_MS = 15000; // 15 detik jeda aman

    if (now - lastCheck < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - lastCheck)) / 1000);
      toast.warning(`Mohon tunggu ${remainingSeconds} detik lagi sebelum mengecek NOP ini kembali.`);
      return;
    }

    setIsCheckingAuto(prev => ({ ...prev, [nop]: true }));
    setCooldowns(prev => ({ ...prev, [nop]: now }));
    toast.info("Mengambil status terbaru dari Bapenda...");
    try {
      const res = await fetch("/api/check-bapenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nop, tahun: tahunPajak })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.isPaid) {
        toast.success(data.message);
        // Refresh data dari server agar arsipUrl ikut ke-load
        await handleSearch();
      } else {
        toast.warning(data.message);
        // Tampilkan popup bayar
        const item = results.find(r => r.nop === nop);
        if (item) {
          setShowPayRedirect({ nop: item.nop, namaWp: item.namaWp });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghubungi Bapenda.";
      toast.error(message);
    } finally {
      setIsCheckingAuto(prev => ({ ...prev, [nop]: false }));
    }
  };

  const handleCopyNop = (nop: string) => {
    const cleanNop = nop.replace(/\D/g, "");
    navigator.clipboard.writeText(cleanNop);
    setCopiedNop(nop);
    toast.success(`NOP ${cleanNop} disalin`);
    setTimeout(() => setCopiedNop(null), 2000);
  };


  // Theme-aware class helpers
  const cardCls = isDark
    ? "rounded-3xl border-0 shadow-2xl bg-[#0A192F] text-white"
    : "rounded-3xl border-0 shadow-2xl bg-white text-slate-900";
  const titleCls = isDark ? "text-white" : "text-slate-900";
  const inputCls = isDark
    ? "bg-[#050B14] border-white/10 text-white placeholder:text-blue-200/30 focus-visible:ring-blue-500"
    : "bg-white border-zinc-200 text-zinc-900 focus-visible:ring-primary";
  const btnCls = isDark
    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/40"
    : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-zinc-900/20";
  const disclaimerCls = isDark
    ? "border-amber-500/30 bg-amber-50/10 text-amber-300"
    : "border-amber-200/60 bg-amber-50/50 text-amber-800";
  const resultCardCls = isDark
    ? "border-white/5 hover:border-blue-500/30 bg-[#0A192F] text-white"
    : "border-zinc-100 hover:border-primary/20 bg-white text-zinc-900";
  const cardHeaderBgCls = isDark
    ? "from-[#0F203B] to-[#0A192F]/50 border-white/5"
    : "from-zinc-50 to-white border-zinc-50";
  const nopCls = isDark ? "text-blue-300/80" : "text-zinc-500";
  const nameCls = isDark ? "text-blue-50" : "text-zinc-900";
  const bodyTextCls = isDark ? "text-blue-100" : "text-zinc-700";
  const mutedLabelCls = isDark ? "text-blue-200/50" : "text-zinc-500";
  const addressCls = isDark ? "text-blue-100/90" : "text-zinc-900";
  const cardFooterCls = isDark ? "bg-[#050B14]/40 border-white/5" : "bg-zinc-50 border-zinc-100";
  const msgBgCls = isDark ? "bg-orange-950/40 border-orange-500/30 text-orange-400" : "bg-orange-50 border-orange-200 text-orange-800";
  const badgeCls = "shadow-sm border-none font-black tracking-widest uppercase text-[10px] px-3 py-1 rounded-full";

  const getBapendaUrl = (nop: string) => {
    if (!bapendaUrl) return "#";
    const cleanNop = nop.replace(/\D/g, "");

    // Jika ini website Bapenda Jombang dan opsi Aktif
    if (isJombangBapenda) {
      if (cleanNop.length !== 18) return bapendaUrl;
      const k0 = cleanNop.substring(0, 2);
      const k1 = cleanNop.substring(2, 4);
      const k2 = cleanNop.substring(4, 7);
      const k3 = cleanNop.substring(7, 10);
      const k4 = cleanNop.substring(10, 13);
      const k5 = cleanNop.substring(13, 17);
      const k6 = cleanNop.substring(17, 18);

      const baseUrl = bapendaUrl.split("?")[0];
      return `${baseUrl}?module=pbb&kata=${k0}&kata1=${k1}&kata2=${k2}&kata3=${k3}&kata4=${k4}&kata5=${k5}&kata6=${k6}&viewpbb=`;
    }

    // Untuk DAERAH LAIN (Manual URL)
    return bapendaUrl;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <Card className={cardCls}>
        <CardHeader className="text-center pb-4">
          <CardTitle className={`text-2xl font-black uppercase tracking-tight ${titleCls}`}>Cek Status PBB</CardTitle>
          <CardDescription className={`text-sm ${isDark ? "text-blue-200/60" : "text-muted-foreground"}`}>
            Masukkan NOP atau Nama Wajib Pajak untuk melihat informasi pembayaran Pajak Bumi dan Bangunan tahun {tahunPajak}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Misal: 35.15.118... atau NAMA ANDA"
                aria-label="Cari NOP atau Nama Wajib Pajak"
                maxLength={30}
                className={`pl-11 h-12 rounded-2xl w-full text-base shadow-sm ${inputCls}`}
              />

            </div>
            <Button type="submit" disabled={loading} className={`h-12 w-full sm:w-32 rounded-2xl font-bold shadow-lg ${btnCls}`}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Cari Data"}
            </Button>
          </form>

          {/* Recent Searches */}
          {recentSearches.length > 0 && !hasSearched && (
            <div className="mt-4 flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
               <span className={cn("text-[10px] font-black uppercase tracking-wider opacity-40", isDark ? "text-white" : "text-slate-900")}>Riwayat:</span>
               {recentSearches.map((s, idx) => (
                 <button
                    key={idx}
                    onClick={() => handleRecentClick(s)}
                    className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all active:scale-95",
                        isDark 
                            ? "bg-white/5 border-white/10 text-blue-200 hover:bg-white/10" 
                            : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                    )}
                 >
                    {s}
                 </button>
               ))}
            </div>
          )}

          <div className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 text-[11px] sm:text-xs ${disclaimerCls}`}>
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              <strong className="font-bold">Info:</strong> Warga dapat mengecek dan menyinkronkan status pelunasan dari BAPENDA langsung dari halaman ini. Untuk verifikasi mandiri, Anda juga bisa membuka situs resmi BAPENDA Kabupaten.
            </p>
          </div>
        </CardContent>
      </Card>

      {hasSearched && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {message && (
            <div className={`p-4 border rounded-2xl text-center text-sm font-semibold ${
              isRateLimited
                ? isDark
                  ? "bg-rose-950/40 border-rose-500/30 text-rose-400"
                  : "bg-rose-50 border-rose-200 text-rose-700"
                : msgBgCls
            }`}>
              {isRateLimited && (
                <ShieldAlert className="inline-block w-4 h-4 mr-2 -mt-0.5" />
              )}
              {message}
            </div>
          )}
          
          <div className="grid gap-4">
            {results.map((item, i) => (
              <Card key={i} className={`rounded-2xl transition-colors shadow-sm overflow-hidden ${resultCardCls}`}>
                <CardHeader className={`p-5 pb-3 bg-gradient-to-r border-b flex flex-row items-center justify-between gap-4 ${cardHeaderBgCls}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className={`text-[10px] font-black uppercase tracking-widest leading-none opacity-60 ${nopCls}`}>{item.nop}</p>
                      <button 
                        onClick={() => handleCopyNop(item.nop)}
                        className={cn(
                          "transition-all active:scale-90 hover:opacity-100 opacity-40 p-1 -m-1 rounded-md",
                          isDark ? "hover:bg-white/10" : "hover:bg-black/5"
                        )}
                        title="Salin NOP"
                      >
                        {copiedNop === item.nop ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <h3 className={`text-lg sm:text-xl font-black ${nameCls} leading-tight`}>{item.namaWp}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                      
                      {bapendaUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          nativeButton={false}
                          render={
                            <a 
                              href={getBapendaUrl(item.nop)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Search className="w-5 h-5" />
                            </a>
                          }
                          className={cn(
                            "h-10 w-10 rounded-2xl transition-all active:scale-95",
                            isDark ? "hover:bg-white/10 text-white/50 hover:text-white" : "hover:bg-black/5 text-black/30 hover:text-black"
                          )}
                          title="Cek Bapenda"
                        />
                      )}


                    <Badge className={cn(badgeCls, 
                      item.status === "LUNAS" 
                        ? "bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600" 
                        : item.status === "TIDAK_TERBIT"
                        ? "bg-zinc-500 text-white shadow-zinc-500/20 hover:bg-zinc-600"
                        : item.status === "SUSPEND"
                        ? "bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600"
                        : "bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600"
                    )}>
                      {item.status === "LUNAS" ? "Lunas" 
                       : item.status === "TIDAK_TERBIT" ? "Tidak Terbit"
                       : item.status === "SUSPEND" ? "Sengketa"
                       : "Blm Lunas"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className={`p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm ${bodyTextCls}`}>
                  <div className="space-y-1">
                    <div className={`flex items-center gap-1.5 mb-0.5 ${mutedLabelCls}`}>
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Alamat Objek</span>
                    </div>
                    <p className={`font-semibold ${addressCls}`}>{item.alamat}</p>
                  </div>

                  <div className="space-y-1">
                    <div className={`flex items-center gap-1.5 mb-0.5 ${mutedLabelCls}`}>
                      <Ruler className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Luas Objek</span>
                    </div>
                    <div className={`flex gap-3 font-semibold ${addressCls}`}>
                      <p>T: {item.luasTanah} m²</p>
                      <p>B: {item.luasBangunan} m²</p>
                    </div>
                  </div>
                  
                  {showNominalPajak && (
                    <div className="space-y-1">
                      <div className={`flex items-center gap-1.5 mb-0.5 ${mutedLabelCls}`}>
                        <Wallet className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Nominal PBB</span>
                      </div>
                      <p className={`text-lg font-black tracking-tight ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                        {formatCurrency(item.tagihan)}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className={`flex items-center gap-1.5 mb-0.5 ${mutedLabelCls}`}>
                      <User className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Petugas Penarik</span>
                    </div>
                    {item.petugas ? (
                      <div>
                        <p className={`font-semibold ${addressCls}`}>{item.petugas.nama}</p>
                        <p className={`text-xs ${mutedLabelCls}`}>{item.petugas.wilayah}</p>
                      </div>
                    ) : (
                      <p className="text-red-500 font-medium italic text-[11px]">Belum Ada Petugas</p>
                    )}
                  </div>

                   <div className="space-y-1">
                    <div className={`flex items-center gap-1.5 mb-0.5 ${mutedLabelCls}`}>
                      <History className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary/80">update terakhir</span>
                    </div>
                    <p className={`text-[11px] font-medium ${addressCls}`}>
                      {item.status === "LUNAS" ? (
                        <>Terbayar: <span className="font-bold">{formatDateNoTime(item.tanggalBayar)}</span></>
                      ) : (
                        <>Terakhir Dicek: <span className="font-bold">{formatDate(item.updatedAt)}</span></>
                      )}
                    </p>
                  </div>

                  {(item.status === "BELUM_LUNAS" || item.status === "TIDAK_TERBIT" || item.status === "SUSPEND") && (
                    <div className="space-y-1">
                      <div className={`flex items-center gap-1.5 mb-0.5 ${mutedLabelCls}`}>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500/80">jatuh tempo</span>
                      </div>
                      <p className={`text-[11px] font-bold ${addressCls}`}>
                         {formatJatuhTempo(jatuhTempo)} {tahunPajak}
                      </p>
                    </div>
                  )}
                  </CardContent>
                  {(item.status === "BELUM_LUNAS" || item.status === "TIDAK_TERBIT" || item.status === "SUSPEND") && (
                    <CardFooter className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 ${cardFooterCls}`}>
                      {enableBapendaSync && (
                        <Button
                          variant="default"
                          onClick={() => handleCheckBapenda(item.nop)}
                          disabled={isCheckingAuto[item.nop]}
                          className={cn(
                            "flex-1 h-11 text-xs font-black uppercase tracking-widest gap-2.5 rounded-2xl transition-all shadow-lg active:scale-95",
                            isDark ? "bg-amber-600 hover:bg-amber-700 shadow-amber-900/20" : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                          )}
                        >
                          {isCheckingAuto[item.nop] ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
                          Bayar Online
                        </Button>
                      )}

                      {/* Action Icons */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        {item.petugas && item.petugas.kontak !== "Tidak ada nomor" && (
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                              "h-11 w-11 rounded-2xl transition-all shadow-sm active:scale-95",
                              isDark
                                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                                : "border-primary/40 text-primary hover:bg-primary/5"
                            )}
                            onClick={() => window.open(`https://wa.me/${item.petugas?.kontak.replace(/\D/g, "")}?text=Halo%20pak%20petugas%20PBB%20saya%20ingin%20cek%20pembayaran%20PBB%20saya%20dengan%20NOP%20${item.nop}`, "_blank")}
                            title="Hubungi Penarik"
                          >
                            <Phone className="w-5.25 h-5.25" />
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setMutationItem(item)}
                          className={cn(
                            "h-11 w-11 rounded-2xl transition-all shadow-sm active:scale-95",
                            isDark ? "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" : "border-amber-500/30 text-amber-600 hover:bg-amber-50"
                          )}
                          title="Ajukan Perubahan"
                        >
                          <FileText className="w-5.25 h-5.25" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSpopItem(item)}
                          className={cn(
                            "h-11 w-11 rounded-2xl transition-all shadow-sm active:scale-95",
                            isDark ? "border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20" : "border-sky-500/30 text-sky-600 hover:bg-sky-50"
                          )}
                          title="Isi SPOP / LSPOP"
                        >
                          <FileText className="w-5.25 h-5.25" />
                        </Button>
                      </div>
                    </CardFooter>
                  )}
                  {item.status === "LUNAS" && (
                    <CardFooter className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 ${cardFooterCls}`}>
                      <div className="flex-1 min-w-0 h-11 flex items-center justify-center gap-2 px-4 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 whitespace-nowrap">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span className="truncate">Lunas</span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {item.arsipUrl && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => togglePdf(item.nop)}
                            className={cn(
                              "h-11 w-11 rounded-2xl transition-all active:scale-95 shadow-sm",
                              isDark
                                ? "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                                : "border-blue-500/30 text-blue-600 hover:bg-blue-50"
                            )}
                            title={openPdfMap[item.nop] ? "Tutup E-SPPT" : "Lihat E-SPPT"}
                          >
                            <Eye className="w-5.25 h-5.25" />
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setMutationItem(item)}
                          className={cn(
                            "h-11 w-11 rounded-2xl transition-all shadow-sm active:scale-95",
                            isDark ? "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" : "border-amber-500/30 text-amber-600 hover:bg-amber-50"
                          )}
                          title="Ajukan Perubahan"
                        >
                          <FileText className="w-5.25 h-5.25" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSpopItem(item)}
                          className={cn(
                            "h-11 w-11 rounded-2xl transition-all shadow-sm active:scale-95",
                            isDark ? "border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20" : "border-sky-500/30 text-sky-600 hover:bg-sky-50"
                          )}
                          title="Isi SPOP / LSPOP"
                        >
                          <FileText className="w-5.25 h-5.25" />
                        </Button>
                      </div>
                    </CardFooter>
                  )}


                  {openPdfMap[item.nop] && item.arsipUrl && (
                    <div className="border-t bg-black/5 dark:bg-black/20 p-2 sm:p-4 animate-in slide-in-from-top-2 duration-300">
                      <iframe 
                        src={`${item.arsipUrl}#toolbar=0&navpanes=0`} 
                        className="w-full h-[60vh] sm:h-[500px] rounded-xl border-dashed border-2 border-primary/20 bg-white" 
                        title={`E-SPPT NOP ${item.nop}`}
                      />
                      <div className="flex flex-wrap items-center justify-end gap-3 mt-4">
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            "h-11 w-11 rounded-2xl transition-all shadow-sm active:scale-95",
                            isDark 
                              ? "border-white/10 bg-white/5 text-white hover:bg-white/10" 
                              : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                          )}
                          onClick={() => window.open(item.arsipUrl || "", "_blank")}
                          title="Cetak SPPT"
                        >
                          <Printer className="w-5.25 h-5.25" />
                        </Button>
                        <Button
                          variant="default"
                          size="icon"
                          nativeButton={false}
                          className={cn(
                            "h-11 w-11 rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-95",
                          )}
                          title="Unduh PDF"
                          render={
                            <a 
                              href={`${item.arsipUrl}?dl=1`} 
                              download={`${item.nop}-${tahunPajak}.pdf`}
                            >
                              <Download className="w-5.25 h-5.25" />
                            </a>
                          }
                        />
                      </div>
                    </div>
                  )}
                </Card>

              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            <div ref={observerTarget} className="py-8 flex justify-center">
              {isLoadingMore ? (
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest animate-pulse",
                  isDark ? "bg-blue-600/10 border-blue-500/20 text-blue-400" : "bg-slate-50 border-slate-200 text-slate-500"
                )}>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat data lainnya...
                </div>
              ) : hasMore ? (
                <div className="opacity-0 h-4" />
              ) : results.length > 0 ? (
                <div className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-full border-t border-dashed text-[10px] font-black uppercase tracking-widest opacity-40",
                  isDark ? "border-white/10 text-white" : "border-slate-200 text-slate-500"
                )}>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Semua data telah ditampilkan
                </div>
              ) : null}
            </div>
        </div>
      )}
      <UnpaidBillDialog 
        open={!!showPayRedirect} 
        onOpenChange={(open) => !open && setShowPayRedirect(null)}
        nop={showPayRedirect?.nop || ""}
        namaWp={showPayRedirect?.namaWp || ""}
        isDark={isDark}
      />

      {mutationItem && (
        <SpptMutationDialog
          open={!!mutationItem}
          onOpenChange={(open) => !open && setMutationItem(null)}
          oldData={{
            nop: mutationItem.nop,
            namaWp: mutationItem.namaWp,
            alamat: mutationItem.alamat,
            luasTanah: mutationItem.luasTanah,
            luasBangunan: mutationItem.luasBangunan,
          }}
          isDark={isDark}
        />
      )}

      <SpopFormDialog
        open={!!spopItem}
        onOpenChange={(open) => !open && setSpopItem(null)}
        taxItem={
          spopItem
            ? {
                nop: spopItem.nop,
                namaWp: spopItem.namaWp,
                alamat: spopItem.alamat,
                luasTanah: spopItem.luasTanah,
                luasBangunan: spopItem.luasBangunan,
                rt: spopItem.rt,
                rw: spopItem.rw,
                dusun: spopItem.dusun,
                tahun: spopItem.tahun,
              }
            : null
        }
        isDark={isDark}
      />
    </div>
  );
}
