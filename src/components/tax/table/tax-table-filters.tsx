"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Printer, Loader2 } from "lucide-react";
import type { AvailableFilters } from "@/types/app";

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
  availableFilters: AvailableFilters;
  onPrint: () => void;
  showPrint: boolean;
  isFetching?: boolean;
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
  availableFilters,
  onPrint,
  showPrint,
  isFetching,
}: TaxTableFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
        <div className="flex w-full items-center gap-3 lg:w-auto">
          <form onSubmit={onSearchSubmit} className="relative flex-1 sm:min-w-[300px]">
            <Search className="absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Cari NOP atau Nama..."
              className="focus-visible:ring-primary/20 h-10 rounded-xl border-border bg-muted/20 pl-10 text-xs font-medium transition-all"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </form>

          <Select
            value={filterRegionStatus}
            onValueChange={(v) => onRegionStatusChange(v || "all")}
          >
            <SelectTrigger className="h-10 w-[160px] rounded-xl border-border bg-card text-xs font-bold shadow-sm">
              <span className="flex flex-1 truncate text-left">
                {filterRegionStatus === "all" ? "Semua Wilayah" : "⚠️ Belum Lengkap"}
              </span>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border shadow-2xl">
              <SelectItem value="all">Semua Wilayah</SelectItem>
              <SelectItem value="incomplete" className="text-destructive font-black">
                ⚠️ Belum Lengkap
              </SelectItem>
            </SelectContent>
          </Select>

          {isFetching && (
            <div className="animate-in fade-in zoom-in hidden items-center gap-2 duration-300 sm:flex">
              <div className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
              <span className="text-primary text-[10px] font-black tracking-widest uppercase">
                Sinkron...
              </span>
            </div>
          )}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          <Select value={filterDusun} onValueChange={(v) => onDusunChange(v || "all")}>
            <SelectTrigger className="h-10 flex-1 rounded-xl border-border bg-card text-[10px] font-bold shadow-sm sm:text-xs lg:w-[130px]">
              <span className="flex flex-1 truncate text-left">
                {filterDusun === "all" ? "Semua Dusun" : filterDusun}
              </span>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border shadow-2xl">
              <SelectItem value="all" className="font-bold">
                Semua Dusun
              </SelectItem>
              {availableFilters.dusun.map((d: string) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterRw} onValueChange={(v) => onRwChange(v || "all")}>
            <SelectTrigger className="h-10 flex-1 rounded-xl border-border bg-card text-[10px] font-bold shadow-sm sm:text-xs lg:w-[100px]">
              <span className="flex flex-1 truncate text-left">
                {filterRw === "all" ? "Semua RW" : `RW ${filterRw}`}
              </span>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border shadow-2xl">
              <SelectItem value="all" className="font-bold">
                Semua RW
              </SelectItem>
              {availableFilters.rw.map((rw: string) => (
                <SelectItem key={rw} value={rw}>
                  RW {rw}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterRt} onValueChange={(v) => onRtChange(v || "all")}>
            <SelectTrigger className="h-10 flex-1 rounded-xl border-border bg-card text-[10px] font-bold shadow-sm sm:text-xs lg:w-[100px]">
              <span className="flex flex-1 truncate text-left">
                {filterRt === "all" ? "Semua RT" : `RT ${filterRt}`}
              </span>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border shadow-2xl">
              <SelectItem value="all" className="font-bold">
                Semua RT
              </SelectItem>
              {availableFilters.rt.map((rt: string) => (
                <SelectItem key={rt} value={rt}>
                  RT {rt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPenarik} onValueChange={(v) => onPenarikChange(v || "all")}>
            <SelectTrigger className="h-10 flex-1 rounded-xl border-border bg-card text-[10px] font-bold shadow-sm sm:text-xs lg:w-[160px]">
              <span className="flex flex-1 truncate text-left">
                {filterPenarik === "all"
                  ? "Semua Penarik"
                  : filterPenarik === "none"
                    ? "Tanpa Petugas"
                    : availableFilters.penarik?.find((p) => p.id === filterPenarik)?.name ||
                      "Pilih"}
              </span>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border shadow-2xl">
              <SelectItem value="all" className="font-bold">
                Semua Penarik
              </SelectItem>
              <SelectItem value="none" className="text-destructive font-black">
                Tanpa Petugas
              </SelectItem>
              {availableFilters.penarik?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col-reverse items-center justify-between gap-2 sm:flex-row">
        {showPrint ? (
          <Button
            onClick={onPrint}
            variant="outline"
            size="sm"
            className="h-9 w-full gap-2 rounded-xl border-border bg-muted/20 text-[10px] font-bold tracking-widest text-muted-foreground uppercase shadow-sm transition-colors hover:bg-muted/30 sm:w-auto"
          >
            <Printer className="h-3.5 w-3.5" /> Cetak / Export Data
          </Button>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
}
