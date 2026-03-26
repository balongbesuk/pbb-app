import { MapPin, Ban } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, formatCurrency, getPaymentStatusColor, getPaymentStatusLabel } from "@/lib/utils";
import type { TaxDataItem } from "@/types/app";

interface TaxMobileCardProps {
  item: TaxDataItem;
  selected: boolean;
  onToggle: (id: number) => void;
  onOpenDetail: (item: TaxDataItem) => void;
  isSelectable: boolean;
  selectionHint?: string;
  isPengguna: boolean;
}

export function TaxMobileCard({
  item,
  selected,
  onToggle,
  onOpenDetail,
  isSelectable,
  selectionHint,
  isPengguna,
}: TaxMobileCardProps) {
  return (
    <div 
      onClick={() => onOpenDetail(item)}
      className={cn(
        "group relative h-full flex flex-col bg-white dark:bg-zinc-900 border transition-all duration-300 overflow-hidden rounded-2xl shadow-sm",
        selected 
          ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-primary/10 shadow-lg" 
          : "border-border/60 shadow-md",
      )}
    >
      {/* Section 1: Header - Identitas Objek */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/40">
         <div className="flex flex-col">
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-0.5">NOMOR OBJEK PAJAK</span>
            <span className="text-[11px] font-mono font-bold text-foreground/80 tracking-tighter">
               {item.nop}
            </span>
         </div>
         <div className={cn(
           "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
           getPaymentStatusColor(item.paymentStatus)
         )}>
           {getPaymentStatusLabel(item.paymentStatus)}
         </div>
      </div>

      {/* Section 2: Body - Detail Wajib Pajak */}
      <div className="flex-1 px-4 py-3.5 flex items-start justify-between">
        <div className="min-w-0 space-y-1">
          <h3 className="font-black text-[16px] text-foreground tracking-tight uppercase leading-tight truncate">
            {item.namaWp}
          </h3>
          <div className="flex items-start gap-1.5 opacity-80 mt-1">
             <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
             <p className="text-[10px] font-medium text-muted-foreground italic leading-tight line-clamp-1">
               {item.alamatObjek || "Alamat tidak lengkap"}
             </p>
          </div>
        </div>
        
        {!isPengguna && (
          <div 
            onClick={(e) => { 
              e.stopPropagation(); 
              onToggle(item.id); 
            }}
            className="flex h-10 w-10 items-center justify-center -mr-2 -mt-1"
            title={selectionHint}
          >
             <div className="relative">
               <Checkbox 
                 checked={selected} 
                 disabled={!isSelectable}
                 className="h-6 w-6 rounded-lg border-primary/30 bg-background shadow-sm" 
               />
               {!isSelectable && (
                 <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                   <Ban className="h-5 w-5 text-rose-500/85" />
                 </span>
               )}
             </div>
          </div>
        )}
      </div>

      {/* Section 3: Data Grid - Administrasi & Lokasi */}
      <div className="grid grid-cols-2 border-t border-border/40 divide-x divide-border/40">
         <div className="px-4 py-3 flex flex-col justify-center">
            <span className="text-[8px] font-black text-muted-foreground uppercase opacity-60 tracking-widest mb-0.5">TAGIHAN PAJAK</span>
            <div className="text-lg font-black text-primary tracking-tighter">
               {formatCurrency(item.ketetapan)}
            </div>
         </div>
         <div className="px-4 py-3 flex flex-col justify-center overflow-hidden">
            <span className="text-[8px] font-black text-muted-foreground uppercase opacity-60 tracking-widest mb-0.5 whitespace-nowrap">LOKASI WILAYAH</span>
            <div className="text-[10px] font-black text-foreground/80 flex items-center gap-1 uppercase truncate">
               <span>{item.dusun || "-"}</span>
               <span className="text-zinc-300 mx-0.5">•</span>
               <span className="whitespace-nowrap">RT {item.rt}/{item.rw}</span>
            </div>
         </div>
      </div>
    </div>
  );
}
