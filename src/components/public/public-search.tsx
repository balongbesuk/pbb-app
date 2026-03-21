"use client";

import { useState } from "react";
import { searchPublicTaxData } from "@/app/actions/public-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, MapPin, User, CheckCircle2, XCircle, Phone, Info, Wallet, ShieldAlert, Ruler, AlertCircle, Calendar, CreditCard, HelpCircle, History, Download, Eye, RefreshCcw } from "lucide-react";
import { usePublicThemeContext } from "@/components/public/public-theme-provider";
import { formatCurrency, formatDate, formatDateNoTime, formatJatuhTempo, cn } from "@/lib/utils";
import { toast } from "sonner";

export function PublicSearch({ 
  tahunPajak, 
  showNominalPajak = false 
}: { 
  tahunPajak: number;
  showNominalPajak?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
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
              <strong className="font-bold">Info:</strong> Data pelunasan diperbarui secara manual oleh petugas desa. Untuk status resmi, silakan cek sistem BAPENDA Kabupaten.
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
                    <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 opacity-60 ${nopCls}`}>{item.nop}</p>
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
                    <CardFooter className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${cardFooterCls}`}>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Jatuh Tempo: {formatJatuhTempo(jatuhTempo)} {tahunPajak}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {bapendaUrl && (
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            {enableBapendaSync && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto h-9 text-[11px] font-bold uppercase tracking-widest gap-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl"
                                onClick={() => handleCheckBapenda(item.nop)}
                                disabled={isCheckingAuto[item.nop]}
                              >
                                {isCheckingAuto[item.nop] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                                Cek & Update Lunas
                              </Button>
                            )}
                            <a 
                              href={getBapendaUrl(item.nop)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "w-full sm:w-auto h-9 text-[11px] font-bold uppercase tracking-widest gap-2 border-zinc-500/30 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-500/10 rounded-xl"
                              )}
                            >
                              <Info className="w-3.5 h-3.5" />
                              Web Bapenda
                            </a>
                          </div>
                        )}
                        {item.petugas && item.petugas.kontak !== "Tidak ada nomor" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto h-9 text-[11px] font-bold uppercase tracking-widest gap-2 border-primary/30 text-primary hover:bg-primary/5 rounded-xl transition-all hover:scale-105 active:scale-95"
                            onClick={() => window.open(`https://wa.me/${item.petugas.kontak.replace(/\D/g, "")}?text=Halo%20pak%20petugas%20PBB%20saya%20ingin%20cek%20pembayaran%20PBB%20saya%20dengan%20NOP%20${item.nop}`, "_blank")}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Hubungi Penarik
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  )}

                  {item.status === "LUNAS" && (
                    <CardFooter className={`p-3 border-t text-center ${cardFooterCls}`}>
                      <p className="w-full text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 opacity-80">
                        Terima kasih Telah Membayar Pajak Anda
                      </p>
                    </CardFooter>
                  )}

                  {/* Arspi Digital E-SPPT Viewer Actions */}
                  {item.arsipUrl && (
                    <div className={`p-4 border-t flex flex-wrap items-center justify-end gap-2 ${isDark ? 'bg-blue-950/10' : 'bg-blue-50/30'}`}>
                      <span className="flex-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Arsip Digital Tersedia</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => togglePdf(item.nop)}
                        className="h-9 gap-2 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {openPdfMap[item.nop] ? "Tutup E-SPPT" : "Lihat E-SPPT"}
                      </Button>
                      <a 
                        href={item.arsipUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "h-9 gap-2 border-primary/20 hover:bg-primary/5 text-primary rounded-xl"
                        )}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Unduh PDF
                      </a>
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
      <Dialog open={!!showPayRedirect} onOpenChange={(open) => !open && setShowPayRedirect(null)}>
        <DialogContent className={`rounded-3xl border-none p-5 sm:p-8 max-w-[95vw] sm:max-w-[420px] shadow-2xl ${isDark ? "bg-[#0A192F] text-white" : "bg-white text-slate-900"}`}>
          <DialogHeader className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3">
               <div className="p-3 bg-emerald-500/10 rounded-2xl">
                  <Wallet className="w-5 h-5 text-emerald-500" />
               </div>
               <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tighter">
                 Tagihan Belum Lunas
               </DialogTitle>
            </div>
            <DialogDescription className={`pt-2 text-[13px] sm:text-sm font-medium leading-relaxed text-center sm:text-left ${isDark ? "text-blue-100/70" : "text-slate-600"}`}>
              Sistem telah mengecek ke Bapenda Jombang. Tagihan atas nama <strong className="font-black text-primary uppercase">{showPayRedirect?.namaWp}</strong> dengan NOP <span className="font-bold underline decoration-zinc-500/30 underline-offset-4">{showPayRedirect?.nop}</span> masih tercatat <span className="text-rose-600 dark:text-rose-400 font-black">BELUM LUNAS</span>.
            </DialogDescription>
          </DialogHeader>
          
          <div className={`my-4 p-4 rounded-2xl border ${isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"}`}>
             <p className="text-xs font-bold leading-relaxed flex items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
               <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
               Ingin melunasi sekarang secara online? Anda bisa menggunakan layanan resmi E-PAY Bapenda Jombang.
             </p>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 mt-4">
            <Button 
                variant="outline" 
                onClick={() => setShowPayRedirect(null)}
                className={`w-full sm:w-auto rounded-xl font-black uppercase tracking-widest text-[10px] h-12 border-zinc-200 dark:border-zinc-800 ${isDark ? "hover:bg-white/5 text-blue-200" : "hover:bg-zinc-50 text-slate-500"}`}
            >
              Nanti Saja
            </Button>
            <Button 
                className={`w-full sm:flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-emerald-900/20 border-none group transition-all`}
                onClick={() => {
                  if (showPayRedirect) {
                    window.open(`https://bapenda.jombangkab.go.id/epay/epaypbb.php?orc=dataGIS&nopGIS=${showPayRedirect.nop}`, "_blank");
                    setShowPayRedirect(null);
                  }
                }}
            >
              <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Bayar Online Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
