import { Checkbox } from "@/components/ui/checkbox";
import { Button, buttonVariants } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuGroup, 
  DropdownMenuLabel, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  Loader2, 
  UserMinus, 
  MapPin, 
  Calculator, 
  XCircle, 
  CheckCircle2, 
  RefreshCcw 
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { AppUser, PenarikInfo } from "@/types/app";

interface TaxBulkActionsProps {
  selectedCount: number;
  totalFiltered: number;
  isAllFilteredSelected: boolean;
  currentUser?: AppUser;
  penariks: PenarikInfo[];
  isAssigning: boolean;
  selectedSum: number;
  selectedDetails: Map<number, { amount: number; name: string }>;
  onToggleSelectAll: () => void;
  onSelectAllFiltered: () => void;
  onBulkRegion: () => void;
  onBulkSync: () => void;
  onBulkAssign: (penarikId: string | null) => void;
  onBulkPayment: (status: "LUNAS" | "BELUM_LUNAS" | "TIDAK_TERBIT" | "SUSPEND") => void;
  onRemoveItem: (id: number) => void;
}

export function TaxBulkActions({
  selectedCount,
  totalFiltered,
  isAllFilteredSelected,
  currentUser,
  penariks,
  isAssigning,
  selectedSum,
  selectedDetails,
  onToggleSelectAll,
  onSelectAllFiltered,
  onBulkRegion,
  onBulkSync,
  onBulkAssign,
  onBulkPayment,
  onRemoveItem,
}: TaxBulkActionsProps) {
  if (selectedCount === 0 || currentUser?.role === "PENGGUNA") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="bg-primary/5 border-primary/20 flex flex-col gap-4 rounded-2xl border p-4 shadow-xl shadow-primary/5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
            <Checkbox
              checked={selectedCount > 0}
              onCheckedChange={onToggleSelectAll}
              className="border-primary/30"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-primary text-sm font-black">
                {isAllFilteredSelected 
                  ? `Seluruh ${totalFiltered.toLocaleString("id-ID")} Data Pajak Terpilih` 
                  : `${selectedCount} Baris Dipilih`}
              </span>
              {isAllFilteredSelected && (
                <span className="bg-primary/10 text-primary flex h-5 items-center rounded-full px-2 text-[9px] font-black uppercase tracking-widest">
                  Smart Selection
                </span>
              )}
            </div>
            
            {totalFiltered > selectedCount && !isAllFilteredSelected && currentUser?.role === "ADMIN" && (
              <button 
                onClick={onSelectAllFiltered}
                className="text-primary/70 hover:text-primary w-fit text-left text-[11px] font-bold underline decoration-primary/30 underline-offset-4 transition-colors"
              >
                Pilih seluruh <span className="text-primary font-black">{totalFiltered.toLocaleString("id-ID")}</span> data sesuai filter
              </button>
            )}
          </div>
        </div>
        
        {currentUser?.role === "ADMIN" && (
          <div className="flex w-full flex-wrap items-center justify-center gap-3 sm:w-auto sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="border-primary/30 hover:bg-primary/10 h-10 rounded-xl px-4 text-xs font-bold transition-all text-primary dark:bg-primary/5"
              onClick={onBulkRegion}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Atur Wilayah
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-emerald-500/30 hover:bg-emerald-50 text-emerald-600 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/10 h-10 rounded-xl px-4 text-xs font-black transition-all shadow-sm"
              onClick={onBulkSync}
              disabled={isAssigning}
            >
              <RefreshCcw className={cn("mr-2 h-4 w-4", isAssigning && "animate-spin")} />
              Sync ({isAllFilteredSelected ? totalFiltered : selectedCount})
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "shadow-primary/20 h-10 rounded-xl px-5 text-xs font-black shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                )}
                disabled={isAssigning}
              >
                <div className="flex items-center">
                  {isAssigning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <User className="mr-2 h-4 w-4" />
                  )}
                  Alokasikan
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[260px] rounded-2xl border-none p-2 shadow-2xl">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-muted-foreground px-3 pt-3 pb-2 text-[10px] font-bold tracking-widest uppercase">
                    Pilih Penarik Kolektor
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="opacity-50" />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive flex cursor-pointer gap-2 rounded-xl px-3 py-2.5 font-bold transition-all"
                  onClick={() => onBulkAssign(null)}
                >
                  <UserMinus className="h-4 w-4" /> 
                  <span>Kosongkan Alokasi</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="opacity-50" />
                <div className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
                  {penariks.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => onBulkAssign(p.id)}
                      className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-all focus:bg-primary/5"
                    >
                      <div className="bg-primary/10 text-primary group-focus:bg-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors">
                        {(p.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="truncate text-sm font-bold tracking-tight">{p.name}</span>
                        <span className="text-muted-foreground group-focus:text-primary/70 truncate text-[10px] font-medium italic">
                          {p.dusun || "-"} • RT {p.rt || "0"}/{p.rw || "0"}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {currentUser?.role === "PENARIK" && (
          <div className="flex w-full flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2 bg-background border px-4 py-2 rounded-xl shadow-inner w-full sm:w-auto">
                 <Calculator className="h-4 w-4 text-muted-foreground" />
                 <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Total Bayar:</span>
                 <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedSum)}</span>
              </div>
              <Button
                size="sm"
                className="h-10 w-full sm:w-auto rounded-xl px-6 text-xs font-black shadow-xl transition-all hover:scale-[1.02] active:scale-95 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 shadow-emerald-500/20 border-none" 
                disabled={isAssigning}
                onClick={() => onBulkPayment("LUNAS")}
              >
                {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                Bayar Sekaligus ({selectedCount})
              </Button>
            </div>

            <div className="bg-white/50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-3">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                 <span>Daftar PBB Terpilih</span>
                 <span className="text-zinc-500">Klik &apos;X&apos; untuk hapus</span>
              </p>
              <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1">
                 {Array.from(selectedDetails.entries()).map(([id, data]) => (
                   <div key={id} className="bg-white dark:bg-zinc-800 border shadow-sm rounded-lg px-2 py-1 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold truncate max-w-[100px]">{data.name}</span>
                         <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black">{formatCurrency(data.amount)}</span>
                      </div>
                      <button 
                        onClick={() => onRemoveItem(id)}
                        className="hover:bg-rose-500/10 p-0.5 rounded-md transition-colors group"
                      >
                        <XCircle className="h-3 w-3 text-zinc-300 group-hover:text-rose-500" />
                      </button>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
