"use client";

import { useState } from "react";
import { searchPublicTaxData } from "@/app/actions/public-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, MapPin, User, CheckCircle2, XCircle, Phone, Info, Wallet, ShieldAlert, Ruler, AlertCircle, Calendar, CreditCard, HelpCircle, History } from "lucide-react";
import { usePublicThemeContext } from "@/components/public/public-theme-provider";
import { formatCurrency, formatDate, formatDateNoTime, formatJatuhTempo, cn } from "@/lib/utils";

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
  const { theme } = usePublicThemeContext();
  const isDark = theme === "dark";


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
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
                    <p className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1.5 ${nopCls}`}>{item.nop}</p>
                    <h3 className={`text-lg font-black truncate ${nameCls}`}>{item.namaWp}</h3>
                  </div>
                  <Badge variant={item.status === "LUNAS" ? "success" : "warning"} className="h-7 px-4 text-[10px] font-black shadow-sm ring-1 ring-white/10">
                    {item.status === "LUNAS" ? (
                      <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> LUNAS</>
                    ) : (
                      <><AlertCircle className="w-3.5 h-3.5 mr-1.5" /> BELUM LUNAS</>
                    )}
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
                        <>Terakhir Dicek: <span className="font-bold">{formatDateNoTime(item.updatedAt)}</span></>
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
                          <a 
                            href={getBapendaUrl(item.nop)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "w-full sm:w-auto h-9 text-[11px] font-bold uppercase tracking-widest gap-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl"
                            )}
                          >
                            <Info className="w-3.5 h-3.5" />
                            Cek di BAPENDA Resmi
                          </a>
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
                </Card>
              ))}
            </div>
        </div>
      )}
    </div>
  );
}
