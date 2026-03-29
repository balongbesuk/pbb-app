"use client";

import { useState } from "react";
import { searchPublicTaxData } from "@/app/actions/public-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, MapPin, User, CheckCircle2, XCircle, Phone, Info, Wallet, ShieldAlert, Ruler, AlertCircle, Calendar, CreditCard, HelpCircle, History, Download, Eye, RefreshCcw, Copy, Check, FileText } from "lucide-react";
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
    const res = await searchPublicTaxData(query, tahunPajak);
    if (res.success) {
      setResults(res.data || []);
      if ((res as any).jatuhTempo) {
        setJatuhTempo((res as any).jatuhTempo);
      }
      if ((res as any).bapendaUrl) {
        setBapendaUrl((res as any).bapendaUrl);
        setIsJombangBapenda(!!(res as any).isJombangBapenda);
        setEnableBapendaSync(!!(res as any).enableBapendaSync);
      } else {
        setBapendaUrl(null);
      }
    } else {
      setResults([]);
      setMessage(res.message || "Terjadi kesalahan sistem.");
      if ((res as any).rateLimited) {
        setIsRateLimited(true);
      }
    }
    setLoading(false);
  };

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
    } catch (e: any) {
      toast.error(e.message || "Gagal menghubungi Bapenda.");
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
    ? "rounded-3xl border-0 shadow-2xl bg-[#0A192F]/60 backdrop-blur-xl text-white"
    : "rounded-3xl border-0 shadow-2xl bg-white/60 backdrop-blur-xl text-slate-900";
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
    ? "border-white/5 hover:border-blue-500/30 bg-[#0A192F]/60 text-white"
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
  const waaBtnCls = isDark
    ? "border-emerald-800/30 hover:bg-emerald-950/30 text-emerald-400 bg-emerald-950/10"
    : "border-emerald-200 hover:bg-emerald-50 text-emerald-700";
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
                className={`pl-11 h-12 rounded-2xl w-full text-base shadow-sm ${inputCls}`}
              />

            </div>
            <Button type="submit" disabled={loading} className={`h-12 w-full sm:w-32 rounded-2xl font-bold shadow-lg ${btnCls}`}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Cari Data"}
            </Button>
          </form>

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
                  <Badge className={`${badgeCls} ${
                    item.status === "LUNAS" 
                      ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                      : "bg-amber-500 text-white shadow-amber-500/20"
                  }`}>
                    {item.status === "LUNAS" ? "Lunas" : "Blm Lunas"}
                  </Badge>
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
                  </CardContent>
                  
                  {item.status === "BELUM_LUNAS" && (
                    <CardFooter className={`p-4 sm:p-5 border-t flex flex-col gap-4 ${cardFooterCls}`}>
                      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
                        <div className="w-full lg:w-auto flex items-center justify-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-tight text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-2 rounded-2xl border border-amber-500/20 shrink-0">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Jatuh Tempo: {formatJatuhTempo(jatuhTempo)} {tahunPajak}
                        </div>

                        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 w-full lg:flex-nowrap">
                          {bapendaUrl && (
                            <>
                              {enableBapendaSync && (
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "h-9 text-[9px] sm:text-[10px] font-black uppercase tracking-widest gap-2 rounded-2xl transition-all active:scale-95 shadow-sm px-3",
                                    isDark 
                                      ? "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300" 
                                      : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                  )}
                                  onClick={() => handleCheckBapenda(item.nop)}
                                  disabled={isCheckingAuto[item.nop]}
                                >
                                  {isCheckingAuto[item.nop] ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                                  <span className="hidden sm:inline">Check & </span>Update Lunas
                                </Button>
                              )}
                              <a 
                                href={getBapendaUrl(item.nop)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={cn(
                                  buttonVariants({ variant: "outline" }),
                                  "h-9 text-[9px] sm:text-[10px] font-black uppercase tracking-widest gap-2 rounded-2xl transition-all active:scale-95 shadow-sm px-3",
                                  isDark 
                                    ? "border-zinc-500/20 text-zinc-400 hover:bg-zinc-500/20 hover:text-zinc-300" 
                                    : "border-zinc-500/30 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-700"
                                )}
                              >
                                <Info className="w-3 h-3" />
                                <span className="hidden sm:inline">Web </span>Bapenda
                              </a>
                            </>
                          )}

                          <Button
                            variant="outline"
                            className={cn(
                              "h-9 text-[9px] sm:text-[10px] font-black uppercase tracking-widest gap-2 rounded-2xl transition-all active:scale-95 shadow-sm px-3",
                              isDark
                                ? "border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10"
                                : "border-amber-500/20 bg-amber-500/5 text-amber-700 hover:bg-amber-50"
                            )}
                            onClick={() => setMutationItem(item)}
                          >
                            <FileText className="w-3 h-3 opacity-70" />
                            Ajukan Perubahan
                          </Button>

                          <Button
                            variant="outline"
                            className={cn(
                              "h-9 text-[9px] sm:text-[10px] font-black uppercase tracking-widest gap-2 rounded-2xl transition-all active:scale-95 shadow-sm px-3",
                              isDark
                                ? "border-sky-500/20 bg-sky-500/5 text-sky-400 hover:bg-sky-500/10"
                                : "border-sky-500/20 bg-sky-500/5 text-sky-700 hover:bg-sky-50"
                            )}
                            onClick={() => setSpopItem(item)}
                          >
                            <FileText className="w-3 h-3 opacity-70" />
                            Isi SPOP / LSPOP
                          </Button>

                          {item.petugas && item.petugas.kontak !== "Tidak ada nomor" && (
                            <Button
                              variant="outline"
                              className={cn(
                                "h-9 text-[9px] sm:text-[10px] font-black uppercase tracking-widest gap-2 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-sm px-3",
                                isDark
                                  ? "border-primary/20 text-primary hover:bg-primary/20 hover:text-white"
                                  : "border-primary/40 text-primary hover:bg-primary/5"
                              )}
                              onClick={() => window.open(`https://wa.me/${item.petugas?.kontak.replace(/\D/g, "")}?text=Halo%20pak%20petugas%20PBB%20saya%20ingin%20cek%20pembayaran%20PBB%20saya%20dengan%20NOP%20${item.nop}`, "_blank")}
                            >
                              <Phone className="w-3 h-3" />
                              <span className="hidden sm:inline">Hubungi </span>Penarik
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardFooter>
                  )}

                  {item.status === "LUNAS" && (
                    <CardFooter className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center gap-3 ${cardFooterCls}`}>
                      <div className="w-full flex-1 flex items-center justify-center gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 py-3 rounded-2xl border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" />
                        Pajak Anda Telah Lunas
                      </div>

                      {/* Mutation for Lunas - Now inline */}
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full sm:w-auto h-11 sm:h-12 rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] sm:text-[11px] gap-2.5 transition-all active:scale-95 shadow-sm px-6",
                          isDark
                            ? "border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10"
                            : "border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
                        )}
                        onClick={() => setMutationItem(item)}
                      >
                        <FileText className="w-4 h-4 opacity-70" />
                        Ajukan Perubahan
                      </Button>

                      <Button
                        variant="outline"
                        className={cn(
                          "w-full sm:w-auto h-11 sm:h-12 rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] sm:text-[11px] gap-2.5 transition-all active:scale-95 shadow-sm px-6",
                          isDark
                            ? "border-sky-500/20 bg-sky-500/5 text-sky-400 hover:bg-sky-500/10"
                            : "border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/20"
                        )}
                        onClick={() => setSpopItem(item)}
                      >
                        <FileText className="w-4 h-4 opacity-70" />
                        Isi SPOP / LSPOP
                      </Button>
                    </CardFooter>
                  )}

                  {/* Arspi Digital E-SPPT Viewer Actions */}
                  {item.arsipUrl && (
                    <div className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center gap-4 ${isDark ? 'bg-blue-950/10' : 'bg-blue-50/30'}`}>
                      <span className="flex-1 text-[11px] font-bold text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest text-center sm:text-left">Arsip Digital Tersedia</span>
                      <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                        <Button 
                          variant="outline" 
                          onClick={() => togglePdf(item.nop)}
                          className={cn(
                            "w-full sm:w-auto h-11 sm:h-10 text-[10px] font-black uppercase tracking-widest gap-2 rounded-2xl transition-all active:scale-95",
                            isDark
                              ? "border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
                              : "border-blue-500/30 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          )}
                        >
                          <Eye className="w-4 h-4" />
                          {openPdfMap[item.nop] ? "Tutup E-SPPT" : "Lihat E-SPPT"}
                        </Button>
                        <a 
                          href={item.arsipUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "w-full sm:w-auto h-11 sm:h-10 text-[10px] font-black uppercase tracking-widest gap-2 rounded-2xl transition-all active:scale-95",
                            isDark
                              ? "border-primary/20 text-primary hover:bg-primary/20 hover:text-white"
                              : "border-primary/20 text-primary hover:bg-primary/5"
                          )}
                        >
                          <Download className="w-4 h-4" />
                          Unduh PDF
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Inline PDF Viewer */}
                  {openPdfMap[item.nop] && item.arsipUrl && (
                    <div className="border-t bg-black/5 dark:bg-black/20 p-2 sm:p-4 animate-in slide-in-from-top-2 duration-300">
                      <iframe 
                        src={`${item.arsipUrl}#toolbar=0&navpanes=0`} 
                        className="w-full h-[60vh] sm:h-[500px] rounded-xl border-dashed border-2 border-primary/20 bg-white" 
                        title={`E-SPPT NOP ${item.nop}`}
                      />
                    </div>
                  )}
                </Card>

              ))}
            </div>
        </div>
      )}
      {/* Dialog Redirect Pembayaran */}
      <UnpaidBillDialog 
        open={!!showPayRedirect} 
        onOpenChange={(open) => !open && setShowPayRedirect(null)}
        nop={showPayRedirect?.nop || ""}
        namaWp={showPayRedirect?.namaWp || ""}
        isDark={isDark}
      />

      {/* Dialog Mutasi / Pemecahan */}
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
