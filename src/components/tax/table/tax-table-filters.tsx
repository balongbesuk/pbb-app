"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Printer, User, SlidersHorizontal, ChevronDown, X, CheckCircle2 } from "lucide-react";
import type { AvailableFilters } from "@/types/app";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AppUser } from "@/types/app";
import { cn } from "@/lib/utils";

interface TaxTableFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  filterDusun: string;
  onDusunChange: (val: string) => void;
  filterRw: string;
  onRwChange: (val: string) => void;
  filterRt: string;
  onRtChange: (val: string) => void;
  filterPenarik: string;
  onPenarikChange: (val: string) => void;
  filterRegionStatus: string;
  onRegionStatusChange: (val: string) => void;
  filterPaymentStatus: string;
  onPaymentStatusChange: (val: string) => void;
  filterArchiveStatus: string;
  onArchiveStatusChange: (val: string) => void;
  availableFilters: AvailableFilters;
  onPrint: () => void;
  showPrint: boolean;
  isFetching?: boolean;
  currentUser?: AppUser;
}

export function TaxTableFilters({
  search,
  onSearchChange,
  onSearchSubmit,
  filterDusun,
  onDusunChange,
  filterRw,
  onRwChange,
  filterRt,
  onRtChange,
  filterPenarik,
  onPenarikChange,
  filterRegionStatus,
  onRegionStatusChange,
  filterPaymentStatus,
  onPaymentStatusChange,
  filterArchiveStatus,
  onArchiveStatusChange,
  availableFilters,
  onPrint,
  showPrint,
  isFetching,
  currentUser,
}: TaxTableFiltersProps) {
  const searchParams = useSearchParams();
  const focusTarget = searchParams?.get("focus");
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // --- Local Search State (Debounce & > 3 chars) ---
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch.length >= 2 || localSearch.length === 0) {
        if (localSearch !== search) {
          onSearchChange(localSearch);
        }
      }
    }, 600); // 600ms debounce - prevents excessive queries while typing
    return () => clearTimeout(handler);
  }, [localSearch, search, onSearchChange]);

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.length >= 2 || localSearch.length === 0) {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }
    onSearchSubmit(e);
  };
  // ------------------------------------------------

  useEffect(() => {
    if (focusTarget === "search") {
      // Focus mobile input (visible on small screens)
      if (window.innerWidth < 768) {
        mobileInputRef.current?.focus();
        mobileInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        // Focus desktop input
        inputRef.current?.focus();
        inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [focusTarget]);

  // Count active filters (excluding "all"/empty)
  const activeFilterCount = [
    filterDusun !== "all" && filterDusun,
    filterRw !== "all" && filterRw,
    filterRt !== "all" && filterRt,
    filterPenarik !== "all" && filterPenarik,
    filterRegionStatus !== "all" && filterRegionStatus,
    filterPaymentStatus !== "all" && filterPaymentStatus,
  ].filter(Boolean).length;

  const paymentStatusLabel = filterPaymentStatus === "all" ? "Semua Status"
    : filterPaymentStatus === "LUNAS" ? "✅ Lunas"
    : filterPaymentStatus === "BELUM_LUNAS" ? "⏳ Belum Lunas"
    : filterPaymentStatus === "SUSPEND" ? "🚫 Sengketa"
    : "📄 Tdk Terbit";



  return (
    <div className="space-y-3">
      {/* ── MOBILE LAYOUT (hidden on md+) ─────────────────── */}
      <div className="md:hidden space-y-2">
        {/* Row 1: Search + Filter Button */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleLocalSubmit} className="relative flex-1">
            <Search className="absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              ref={mobileInputRef}
              placeholder="Cari NOP atau Nama..."
              className="focus-visible:ring-primary/20 h-10 rounded-xl border-border bg-muted/20 pl-10 text-xs font-medium transition-all"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </form>

          <button
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className={cn(
              "relative flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all",
              mobileFiltersOpen
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shrink-0 shadow-sm">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={cn("h-3 w-3 transition-transform duration-200 opacity-50", mobileFiltersOpen && "rotate-180 opacity-100")} />
          </button>

          {isFetching && (
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-primary" />
          )}
        </div>

        {/* Row 2: Quick action chips — always visible */}
        <div className="flex gap-2 overflow-x-auto pb-2 px-1 no-scrollbar">
          {showPrint && (
            <button
              onClick={onPrint}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              <Printer className="h-3 w-3" />
              Cetak
            </button>
          )}

          {currentUser?.role === "PENARIK" && currentUser?.id && (
            <button
              onClick={() => filterPenarik === currentUser.id ? onPenarikChange("all") : onPenarikChange(currentUser.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors",
                filterPenarik === currentUser.id
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              )}
            >
              <User className="h-3 w-3" />
              {filterPenarik === currentUser.id ? "Tugas Saya ✓" : "Tugas Saya"}
            </button>
          )}
          <button
            onClick={() => filterPaymentStatus === "BELUM_LUNAS" ? onPaymentStatusChange("all") : onPaymentStatusChange("BELUM_LUNAS")}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
              filterPaymentStatus === "BELUM_LUNAS"
                ? "bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-500/20"
                : "bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30 text-amber-600 dark:text-amber-500 hover:bg-amber-500/10"
            )}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            {filterPaymentStatus === "BELUM_LUNAS" ? "Belum Lunas ✓" : "Belum Lunas"}
          </button>

          <button
            onClick={() => filterArchiveStatus === "missing" ? onArchiveStatusChange("all") : onArchiveStatusChange("missing")}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
              filterArchiveStatus === "missing"
                ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-500/20"
                : "bg-red-500/5 dark:bg-red-950/20 border-red-500/30 text-red-600 dark:text-red-500 hover:bg-red-500/10"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {filterArchiveStatus === "missing" ? "Tanpa Arsip ✓" : "Tanpa Arsip"}
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        <div className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          mobileFiltersOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-3 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Filter & Sortir</span>
              <button onClick={() => setMobileFiltersOpen(false)} className="rounded-lg p-1 hover:bg-muted">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Status Bayar chips */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Status Bayar</p>
              <div className="flex flex-wrap gap-1.5">
                {["all","BELUM_LUNAS","LUNAS","SUSPEND","TIDAK_TERBIT"].map((s) => {
                  const label = s === "all" ? "Semua" : s === "BELUM_LUNAS" ? "⏳ Belum Lunas" : s === "LUNAS" ? "✅ Lunas" : s === "SUSPEND" ? "🚫 Suspend" : "Tdk Terbit";
                  return (
                    <button key={s} onClick={() => onPaymentStatusChange(s)}
                      className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all",
                        filterPaymentStatus === s ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 border-border text-muted-foreground")}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dusun chips */}
            {availableFilters.dusun.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Dusun</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => onDusunChange("all")}
                    className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all",
                      filterDusun === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 border-border text-muted-foreground")}>
                    Semua
                  </button>
                  {availableFilters.dusun.map((d: string) => (
                    <button key={d} onClick={() => onDusunChange(d)}
                      className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all",
                        filterDusun === d ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 border-border text-muted-foreground")}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* RW + RT row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">RW</p>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => onRwChange("all")}
                    className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold transition-all",
                      filterRw === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 border-border text-muted-foreground")}>
                    Semua
                  </button>
                  {availableFilters.rw.map((rw: string) => (
                    <button key={rw} onClick={() => onRwChange(rw)}
                      className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold transition-all",
                        filterRw === rw ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 border-border text-muted-foreground")}>
                      {rw}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">RT</p>
                <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto">
                  <button onClick={() => onRtChange("all")}
                    className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold transition-all",
                      filterRt === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 border-border text-muted-foreground")}>
                    Semua
                  </button>
                  {availableFilters.rt.map((rt: string) => (
                    <button key={rt} onClick={() => onRtChange(rt)}
                      className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold transition-all",
                        filterRt === rt ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 border-border text-muted-foreground")}>
                      {rt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Penarik, Kelengkapan, Status row */}
            <div className="space-y-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Penarik</p>
                <Select value={filterPenarik} onValueChange={(v) => onPenarikChange(v || "all")}>
                  <SelectTrigger className="h-9 w-full rounded-xl border-border bg-muted/40 text-[10px] font-bold">
                    <span className="flex flex-1 truncate text-left">
                      {filterPenarik === "all" ? "Semua Penarik" : filterPenarik === "none" ? "Tanpa Petugas"
                        : availableFilters.penarik?.find((p) => p.id === filterPenarik)?.name || "Pilih"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border shadow-2xl">
                    <SelectItem value="all" className="font-bold">Semua Penarik</SelectItem>
                    <SelectItem value="none" className="text-destructive font-black">Tanpa Petugas</SelectItem>
                    {availableFilters.penarik?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Kelengkapan</p>
                  <Select value={filterRegionStatus} onValueChange={(v) => onRegionStatusChange(v || "all")}>
                    <SelectTrigger className="h-9 w-full rounded-xl border-border bg-muted/40 text-[10px] font-bold">
                      <span className="flex flex-1 text-left">
                        {filterRegionStatus === "all" ? "Semua" : "⚠️ Blm Lengkap"}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-2xl">
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="incomplete" className="text-destructive font-black">⚠️ Belum Lengkap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Status Bayar</p>
                  <Select value={filterPaymentStatus} onValueChange={(v) => onPaymentStatusChange(v || "all")}>
                    <SelectTrigger className="h-9 w-full rounded-xl border-border bg-muted/40 text-[10px] font-bold">
                      <span className="flex flex-1 text-left truncate italic">
                        {paymentStatusLabel}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-2xl">
                      <SelectItem value="all" className="font-bold">Semua Status</SelectItem>
                      <SelectItem value="BELUM_LUNAS" className="font-bold text-amber-600">⏳ Belum Lunas</SelectItem>
                      <SelectItem value="LUNAS" className="text-emerald-600">✅ Lunas</SelectItem>
                      <SelectItem value="SUSPEND" className="text-rose-600 font-bold">🚫 Sengketa</SelectItem>
                      <SelectItem value="TIDAK_TERBIT" className="font-bold text-zinc-500">📄 Tdk Terbit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Apply button */}
            <Button onClick={() => setMobileFiltersOpen(false)} size="sm" className="w-full rounded-xl h-10 font-black text-xs gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Terapkan Filter
              {activeFilterCount > 0 && (
                <span className="bg-primary-foreground text-primary rounded-full px-2 py-0.5 text-[10px] font-black shadow-sm">
                  {activeFilterCount} aktif
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── DESKTOP LAYOUT (hidden on < md) ───────────────── */}
      <div className="hidden md:block space-y-4">
        <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
          <div className="flex w-full items-center gap-3 lg:w-auto">
            <form onSubmit={handleLocalSubmit} className="relative flex-1 sm:min-w-[300px]">
              <Search className="absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <Input
                ref={inputRef}
                placeholder="Cari NOP atau Nama..."
                className="focus-visible:ring-primary/20 h-10 rounded-xl border-border bg-muted/20 pl-10 text-xs font-medium transition-all"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </form>

            {isFetching && (
              <div className="animate-in fade-in zoom-in hidden items-center gap-2 duration-300 sm:flex">
                <div className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
                <span className="text-primary text-[10px] font-black tracking-widest uppercase">Sinkron...</span>
              </div>
            )}
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <Select value={filterDusun} onValueChange={(v) => onDusunChange(v || "all")}>
              <SelectTrigger className="h-10 flex-1 rounded-xl border-border bg-card text-[10px] font-bold shadow-sm sm:text-xs lg:w-[130px]">
                <span className="flex flex-1 truncate text-left">{filterDusun === "all" ? "Semua Dusun" : filterDusun}</span>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-2xl">
                <SelectItem value="all" className="font-bold">Semua Dusun</SelectItem>
                {availableFilters.dusun.map((d: string) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterRw} onValueChange={(v) => onRwChange(v || "all")}>
              <SelectTrigger className="h-10 flex-1 rounded-xl border-border bg-card text-[10px] font-bold shadow-sm sm:text-xs lg:w-[100px]">
                <span className="flex flex-1 truncate text-left">{filterRw === "all" ? "Semua RW" : `RW ${filterRw}`}</span>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-2xl">
                <SelectItem value="all" className="font-bold">Semua RW</SelectItem>
                {availableFilters.rw.map((rw: string) => (
                  <SelectItem key={rw} value={rw}>RW {rw}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterRt} onValueChange={(v) => onRtChange(v || "all")}>
              <SelectTrigger className="h-10 flex-1 rounded-xl border-border bg-card text-[10px] font-bold shadow-sm sm:text-xs lg:w-[100px]">
                <span className="flex flex-1 truncate text-left">{filterRt === "all" ? "Semua RT" : `RT ${filterRt}`}</span>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-2xl">
                <SelectItem value="all" className="font-bold">Semua RT</SelectItem>
                {availableFilters.rt.map((rt: string) => (
                  <SelectItem key={rt} value={rt}>RT {rt}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPenarik} onValueChange={(v) => onPenarikChange(v || "all")}>
              <SelectTrigger className="h-10 flex-1 rounded-xl border-border bg-card text-[10px] font-bold shadow-sm sm:text-xs lg:w-[160px]">
                <span className="flex flex-1 truncate text-left">
                  {filterPenarik === "all" ? "Semua Penarik" : filterPenarik === "none" ? "Tanpa Petugas"
                    : availableFilters.penarik?.find((p) => p.id === filterPenarik)?.name || "Pilih"}
                </span>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-2xl">
                <SelectItem value="all" className="font-bold">Semua Penarik</SelectItem>
                <SelectItem value="none" className="text-destructive font-black">Tanpa Petugas</SelectItem>
                {availableFilters.penarik?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterRegionStatus} onValueChange={(v) => onRegionStatusChange(v || "all")}>
              <SelectTrigger className="h-10 flex-1 rounded-xl border-border bg-card text-xs font-bold shadow-sm lg:w-[140px]">
                <span className="flex flex-1 truncate text-left">
                  {filterRegionStatus === "all" ? "Semua Wilayah" : "⚠️ Belum Lengkap"}
                </span>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-2xl">
                <SelectItem value="all">Semua Wilayah</SelectItem>
                <SelectItem value="incomplete" className="text-destructive font-black">⚠️ Belum Lengkap</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPaymentStatus} onValueChange={(v) => onPaymentStatusChange(v || "all")}>
              <SelectTrigger className="h-10 flex-1 rounded-xl border-border bg-card text-xs font-bold shadow-sm lg:w-[150px]">
                <span className="flex flex-1 truncate text-left">{paymentStatusLabel}</span>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-2xl">
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="BELUM_LUNAS" className="font-bold text-amber-600">⏳ Belum Lunas</SelectItem>
                <SelectItem value="LUNAS" className="text-emerald-600">✅ Lunas</SelectItem>
                <SelectItem value="SUSPEND" className="text-rose-600 font-bold">🚫 Sengketa</SelectItem>
                <SelectItem value="TIDAK_TERBIT" className="font-bold text-zinc-500">📄 Tdk Terbit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col-reverse items-center justify-between gap-2 sm:flex-row">
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            {showPrint && (
              <Button onClick={onPrint} variant="outline" size="sm"
                className="h-9 w-full gap-2 rounded-xl border-border bg-muted/20 text-[10px] font-bold tracking-widest text-muted-foreground uppercase shadow-sm transition-colors hover:bg-muted/30 sm:w-auto">
                <Printer className="h-3.5 w-3.5" /> Cetak / Unduh Excel
              </Button>
            )}
            {currentUser?.role === "PENARIK" && currentUser?.id && (
              <Button
                onClick={() => filterPenarik === currentUser.id ? onPenarikChange("all") : onPenarikChange(currentUser.id)}
                variant={filterPenarik === currentUser.id ? "default" : "outline"} size="sm"
                className={cn(
                  "h-9 w-full sm:w-auto gap-2 rounded-xl text-[10px] font-bold tracking-widest uppercase shadow-sm transition-colors",
                  filterPenarik === currentUser.id ? "bg-primary text-primary-foreground shadow-primary/20"
                    : "border-border bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-500/20"
                )}>
                <User className="h-3.5 w-3.5" />
                {filterPenarik === currentUser.id ? "Menampilkan Tugas Saya" : "Tampilkan Tugas Saya"}
              </Button>
            )}
            <Button
              onClick={() => filterPaymentStatus === "BELUM_LUNAS" ? onPaymentStatusChange("all") : onPaymentStatusChange("BELUM_LUNAS")}
              variant={filterPaymentStatus === "BELUM_LUNAS" ? "default" : "outline"} size="sm"
              className={cn(
                "h-9 w-full sm:w-auto gap-2 rounded-xl text-[10px] font-bold tracking-widest uppercase shadow-sm transition-colors",
                filterPaymentStatus === "BELUM_LUNAS" ? "bg-amber-600 text-white shadow-amber-500/20"
                  : "border-border bg-amber-500/5 text-amber-600 dark:text-amber-500 hover:bg-amber-500/10"
              )}>
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              {filterPaymentStatus === "BELUM_LUNAS" ? "Menampilkan Belum Lunas" : "Tampilkan Belum Lunas"}
            </Button>
            <Button
              onClick={() => filterArchiveStatus === "missing" ? onArchiveStatusChange("all") : onArchiveStatusChange("missing")}
              variant={filterArchiveStatus === "missing" ? "default" : "outline"} size="sm"
              className={cn(
                "h-9 w-full sm:w-auto gap-2 rounded-xl text-[10px] font-bold tracking-widest uppercase shadow-sm transition-colors",
                filterArchiveStatus === "missing" ? "bg-red-600 text-white shadow-red-500/20"
                  : "border-border bg-red-500/5 text-red-600 dark:text-red-500 hover:bg-red-500/10"
              )}>
              <div className="h-2 w-2 rounded-full bg-red-500" />
              {filterArchiveStatus === "missing" ? "Menampilkan Belum Ada Arsip" : "Tampilkan Belum Ada Arsip"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
