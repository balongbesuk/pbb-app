"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Printer, Loader2 } from "lucide-react";

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
    availableFilters: any;
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
    availableFilters,
    onPrint,
    showPrint,
    isFetching
}: TaxTableFiltersProps) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full max-w-sm flex items-center gap-2">
                    <form onSubmit={onSearchSubmit} className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari NOP atau Nama..."
                            className="pl-10 h-9 text-xs transition-all focus:ring-primary/20"
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </form>
                    {isFetching && (
                        <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className="flex items-center justify-center p-1.5 bg-primary/10 rounded-full shadow-inner">
                                <Loader2 className="h-3 w-3 text-primary animate-spin" />
                            </div>
                            <span className="text-[10px] font-bold text-primary tracking-tight whitespace-nowrap">Sinkronisasi...</span>
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <Select value={filterDusun} onValueChange={(v) => onDusunChange(v || "all")}>
                        <SelectTrigger className="w-[130px] h-9 text-xs font-medium">
                            <span className="flex flex-1 text-left truncate">
                                {filterDusun === "all" ? "Semua Dusun" : filterDusun}
                            </span>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Dusun</SelectItem>
                            {availableFilters.dusun.map((d: string) => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterRw} onValueChange={(v) => onRwChange(v || "all")}>
                        <SelectTrigger className="w-[100px] h-9 text-xs font-medium">
                            <span className="flex flex-1 text-left truncate">
                                {filterRw === "all" ? "Semua RW" : `RW ${filterRw}`}
                            </span>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua RW</SelectItem>
                            {availableFilters.rw.map((rw: string) => (
                                <SelectItem key={rw} value={rw}>RW {rw}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterRt} onValueChange={(v) => onRtChange(v || "all")}>
                        <SelectTrigger className="w-[100px] h-9 text-xs font-medium">
                            <span className="flex flex-1 text-left truncate">
                                {filterRt === "all" ? "Semua RT" : `RT ${filterRt}`}
                            </span>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua RT</SelectItem>
                            {availableFilters.rt.map((rt: string) => (
                                <SelectItem key={rt} value={rt}>RT {rt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterPenarik} onValueChange={(v) => onPenarikChange(v || "all")}>
                        <SelectTrigger className="w-[140px] h-9 text-xs font-medium">
                            <span className="flex flex-1 text-left truncate">
                                {filterPenarik === "all" ? "Semua Penarik" :
                                    filterPenarik === "none" ? "Belum Dialokasikan" :
                                        availableFilters.penarik?.find((p: any) => p.id === filterPenarik)?.name || "Pilih Penarik"}
                            </span>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Penarik</SelectItem>
                            <SelectItem value="none" className="text-destructive font-medium">Belum Dialokasikan</SelectItem>
                            {availableFilters.penarik?.map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center justify-between mt-2 flex-col-reverse sm:flex-row gap-2">
                {showPrint ? (
                    <Button onClick={onPrint} variant="outline" size="sm" className="h-8 gap-2 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50 dark:hover:bg-emerald-900/40 w-full sm:w-auto font-bold shadow-sm">
                        <Printer className="w-4 h-4" /> Cetak / Export Data
                    </Button>
                ) : (
                    <div></div>
                )}
            </div>
        </div>
    );
}
