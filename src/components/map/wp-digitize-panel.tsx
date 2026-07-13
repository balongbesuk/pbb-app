"use client";

import { useState, useEffect, useRef } from "react";
import { X, Pencil, CheckCircle2, Search, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

type UnmappedNop = {
  nop: string;
  namaWp: string;
  alamatObjek: string;
  dusun: string;
  rt: string;
  rw: string;
  paymentStatus: string;
};

type Props = {
  tahun: number;
  onSelectNop: (nop: UnmappedNop | null) => void;
  selectedNop: UnmappedNop | null;
  onSaved: () => void;
  pendingGeometry: any | null;
  onClose: () => void;
  refreshCount?: number;
};

export function WpDigitizePanel({
  tahun,
  onSelectNop,
  selectedNop,
  onSaved,
  pendingGeometry,
  onClose,
  refreshCount = 0,
}: Props) {
  const [list, setList] = useState<UnmappedNop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/gis-sync-report?tahun=${tahun}`)
      .then((r) => r.json())
      .then((d) => {
        setList(d.missingFromGis || []);
      })
      .catch(() => setError("Gagal memuat daftar NOP"))
      .finally(() => setLoading(false));
  }, [tahun, savedCount, refreshCount]);

  const filtered = list.filter(
    (w) =>
      w.nop.toLowerCase().includes(search.toLowerCase()) ||
      w.namaWp.toLowerCase().includes(search.toLowerCase()) ||
      w.dusun.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave() {
    if (!selectedNop || !pendingGeometry) return;

    // Parse NOP: "35.17.040.019.001-0159.0" → blok="001", nop="0159"
    const clean = selectedNop.nop.replace(/\D/g, ""); // 18-digit
    const blok = clean.length >= 13 ? clean.substring(10, 13) : "";
    const nopSuffix = clean.length >= 17 ? clean.substring(13, 17) : clean;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/peta/wp-digitize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geometry: pendingGeometry,
          properties: {
            name: selectedNop.namaWp,
            nop: nopSuffix,
            blok,
            fullNop: selectedNop.nop,
          },
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Gagal menyimpan");
      }

      setSavedCount((c) => c + 1);
      onSelectNop(null);
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const statusColor: Record<string, string> = {
    LUNAS: "bg-emerald-100 text-emerald-700",
    BELUM_LUNAS: "bg-rose-100 text-rose-700",
    TIDAK_TERBIT: "bg-zinc-100 text-zinc-500",
    SUSPEND: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="absolute top-4 left-4 z-[500] w-72 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 overflow-hidden flex flex-col max-h-[calc(100%-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white shrink-0">
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4" />
          <span className="font-black text-sm uppercase tracking-widest">Mode Digitasi</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Instruksi */}
          <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-100 dark:border-indigo-800 shrink-0">
            <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold leading-relaxed">
              {!selectedNop
                ? "1️⃣ Pilih NOP dari daftar di bawah"
                : !pendingGeometry
                ? "2️⃣ Gambar batas bidang tanah di peta menggunakan tombol ✏️"
                : "3️⃣ Klik Simpan untuk menyimpan ke peta"}
            </p>
          </div>

          {/* Selected NOP + Save button */}
          {selectedNop && (
            <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 shrink-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-slate-800 dark:text-white truncate">
                    {selectedNop.namaWp}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {selectedNop.nop}
                  </div>
                </div>
                <button
                  onClick={() => onSelectNop(null)}
                  className="shrink-0 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {pendingGeometry && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[11px] font-black uppercase tracking-widest py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {saving ? "Menyimpan..." : "Simpan ke Peta"}
                </button>
              )}
              {!pendingGeometry && (
                <div className="mt-2 text-[10px] text-amber-600 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Belum ada gambar — gambar dulu di peta
                </div>
              )}
              {error && (
                <div className="mt-2 text-[10px] text-rose-600 font-bold">{error}</div>
              )}
            </div>
          )}

          {/* Berhasil disimpan counter */}
          {savedCount > 0 && (
            <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 shrink-0">
              <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {savedCount} bidang berhasil disimpan sesi ini
              </div>
            </div>
          )}

          {/* Search */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-700 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau NOP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-slate-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 min-h-0">
            {loading && (
              <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Memuat...</span>
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                <p className="text-xs font-bold">
                  {search ? "Tidak ditemukan" : "Semua sudah terpetakan!"}
                </p>
              </div>
            )}
            {!loading &&
              filtered.map((wp) => (
                <button
                  key={wp.nop}
                  onClick={() => onSelectNop(selectedNop?.nop === wp.nop ? null : wp)}
                  className={`w-full text-left px-4 py-2.5 border-b border-slate-50 dark:border-zinc-800 hover:bg-indigo-50 dark:hover:bg-zinc-800 transition-colors ${
                    selectedNop?.nop === wp.nop
                      ? "bg-indigo-100 dark:bg-indigo-900/30 border-l-2 border-l-indigo-500"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                        {wp.namaWp}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                        {wp.nop}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        RT {wp.rt} RW {wp.rw} · {wp.dusun}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded-full mt-0.5 ${
                        statusColor[wp.paymentStatus] || "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {wp.paymentStatus === "BELUM_LUNAS" ? "BLM" : wp.paymentStatus === "LUNAS" ? "LNS" : "TDK"}
                    </span>
                  </div>
                </button>
              ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 shrink-0">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider text-center">
              {filtered.length} NOP belum terpetakan
            </p>
          </div>
        </>
      )}
    </div>
  );
}
