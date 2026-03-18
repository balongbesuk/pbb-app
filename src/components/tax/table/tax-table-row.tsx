"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MapPin, User } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { TaxDataItem } from "@/types/app";

interface TaxTableRowProps {
  item: TaxDataItem;
  selected: boolean;
  onToggle: (id: number) => void;
  onOpenDetail: (item: TaxDataItem) => void;
  role: string;
  style?: React.CSSProperties;
}

export function TaxTableRow({
  item,
  selected,
  onToggle,
  onOpenDetail,
  role,
  style,
}: TaxTableRowProps) {
  return (
    <div
      className={cn(
        "hover:bg-muted/30 border-b border-border/40 absolute left-0 top-0 flex w-full cursor-pointer transition-all duration-200 items-center select-none",
        selected && "bg-muted/80 border-primary/20"
      )}
      onClick={() => onOpenDetail(item)}
      style={style}
    >
      {role !== "PENGGUNA" && (
        <div onClick={(e) => e.stopPropagation()} className="flex w-[50px] items-center justify-center p-1 sm:p-2 shrink-0">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggle(item.id)}
            aria-label="Select row"
          />
        </div>
      )}
      <div className="flex w-[180px] items-center font-mono text-xs font-bold px-4 shrink-0 text-foreground/70">{item.nop}</div>
      <div className="flex flex-1 flex-col justify-center overflow-hidden px-4">
        <div className="truncate font-bold text-sm tracking-tight text-foreground">{item.namaWp}</div>
        <div className="text-muted-foreground line-clamp-1 max-w-full text-[11px] italic">
          {item.alamatObjek}
        </div>
      </div>
      <div className="flex w-[150px] flex-col justify-center overflow-hidden px-4 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/80">
          <MapPin className="text-primary h-3 w-3 shrink-0" />
          <span className="truncate uppercase">{item.dusun || "-"}</span>
        </div>
        <div className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase px-4.5">
          RT {item.rt || "01"} / RW {item.rw || "01"}
        </div>
      </div>
      <div className="flex w-[120px] items-center justify-end font-bold text-sm text-foreground px-4 shrink-0">
        {formatCurrency(item.ketetapan)}
      </div>
      <div className="flex w-[120px] items-center px-4 shrink-0">
        <Badge
          variant={
            (item.paymentStatus === "LUNAS"
               ? "success"
               : item.paymentStatus === "BELUM_LUNAS"
                 ? "warning"
                 : "outline") as any
          }
          className="whitespace-nowrap text-[10px] font-black uppercase tracking-wider"
        >
          {item.paymentStatus === "LUNAS"
            ? "Lunas"
            : item.paymentStatus === "BELUM_LUNAS"
              ? "Blm Lunas"
              : "Tdk Terbit"}
        </Badge>
      </div>
      <div className="flex w-[150px] items-center overflow-hidden px-4 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black border border-primary/20">
            {item.penarik?.name?.charAt(0) || <User className="h-3 w-3" />}
          </div>
          <span className="truncate text-xs font-bold text-foreground/70 uppercase tracking-tight">{item.penarik?.name || "Belum Ada"}</span>
        </div>
      </div>
    </div>
  );
}
