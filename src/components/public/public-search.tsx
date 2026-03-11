"use client";

import { useState } from "react";
import { searchPublicTaxData } from "@/app/actions/public-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, MapPin, User, CheckCircle2, XCircle, Phone, Info } from "lucide-react";

export function PublicSearch({ tahunPajak }: { tahunPajak: number }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [message, setMessage] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setMessage("");

    const res = await searchPublicTaxData(query, tahunPajak);
    if (res.success) {
      setResults(res.data || []);
    } else {
      setResults([]);
      setMessage(res.message || "Terjadi kesalahan sistem.");
    }
    setLoading(false);
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <Card className="rounded-3xl border-0 shadow-2xl bg-white/60 backdrop-blur-xl dark:bg-zinc-950/60 dark:border-zinc-800">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">Cek Status PBB</CardTitle>
          <CardDescription className="text-sm">Masukkan NOP atau Nama Wajib Pajak untuk melihat informasi pembayaran Pajak Bumi dan Bangunan tahun {tahunPajak}.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Misal: 35.15.118... atau NAMA ANDA"
                className="pl-11 h-12 rounded-2xl w-full text-base bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary shadow-sm"
              />
            </div>
            <Button type="submit" disabled={loading} className="h-12 w-full sm:w-32 rounded-2xl font-bold shadow-lg shadow-primary/20">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Cari Data"}
            </Button>
          </form>

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 p-4 text-[11px] sm:text-xs text-amber-800 dark:text-amber-400">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              <strong className="font-bold">Disclaimer:</strong> Status pelunasan pajak di portal desa berpotensi berbeda (delay) dengan sistem Pemerintah Kabupaten (DISPENDA/BAPENDA). Pembaruan data di sini bergantung penuh pada <strong className="font-bold">konfirmasi Pembayaran</strong> oleh Petugas Penarik Pajak Desa.
            </p>
          </div>
        </CardContent>
      </Card>

      {hasSearched && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {message && (
            <div className="p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-2xl text-center text-sm font-semibold text-orange-800 dark:text-orange-400">
              {message}
            </div>
          )}
          
          <div className="grid gap-4">
            {results.map((item, i) => (
              <Card key={i} className="rounded-2xl border border-zinc-100 hover:border-primary/20 transition-colors shadow-sm bg-white dark:bg-zinc-950 overflow-hidden">
                <CardHeader className="p-5 pb-3 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 border-b border-zinc-50 dark:border-zinc-900 flex flex-row items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1.5">{item.nop}</p>
                    <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 truncate">{item.namaWp}</h3>
                  </div>
                  <Badge variant={item.status === 'LUNAS' ? 'default' : 'destructive'} className={`h-7 px-3 text-xs shadow-sm ${item.status === 'LUNAS' ? 'bg-emerald-500 hover:bg-emerald-600 border-none' : ''}`}>
                    {item.status === 'LUNAS' ? (
                      <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> LUNAS</>
                    ) : (
                      <><XCircle className="w-3.5 h-3.5 mr-1" /> BELUM LUNAS</>
                    )}
                  </Badge>
                </CardHeader>
                <CardContent className="p-5 grid gap-4 sm:grid-cols-2 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground gap-1.5 mb-0.5">
                      <MapPin className="w-3.5 h-3.5" /> <span className="text-[10px] uppercase font-bold tracking-wider">Alamat Objek</span>
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{item.alamat}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground gap-1.5 mb-0.5">
                      <User className="w-3.5 h-3.5" /> <span className="text-[10px] uppercase font-bold tracking-wider">Petugas Penarik</span>
                    </div>
                    {item.petugas ? (
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{item.petugas.nama}</p>
                        <p className="text-xs text-muted-foreground">{item.petugas.wilayah}</p>
                      </div>
                    ) : (
                      <p className="text-red-500 font-medium italic">Belum Ada Petugas</p>
                    )}
                  </div>
                </CardContent>
                {item.status === "BELUM_LUNAS" && item.petugas && item.petugas.kontak !== "Tidak ada nomor" && (
                  <CardFooter className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 grid">
                    <Button variant="outline" className="w-full sm:w-auto ml-auto rounded-xl border-emerald-200 hover:bg-emerald-50 text-emerald-700 dark:border-emerald-800/30 dark:hover:bg-emerald-950" onClick={() => window.open(`https://wa.me/${item.petugas.kontak.replace(/^0/, '62')}`, '_blank')}>
                      <Phone className="w-4 h-4 mr-2" /> Hubungi Petugas via WhatsApp
                    </Button>
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
