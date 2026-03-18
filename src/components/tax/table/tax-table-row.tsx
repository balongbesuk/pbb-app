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
        "hover:bg-muted/40 border-b border-border/50 absolute left-0 top-0 flex w-full cursor-pointer transition-colors items-center",
        selected && "bg-muted/60"
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
      <div className="flex w-[180px] items-center font-mono text-xs px-4 shrink-0">{item.nop}</div>
      <div className="flex w-[200px] shrink-0 flex-col justify-center overflow-hidden px-4">
        <div className="truncate font-semibold text-sm">{item.namaWp}</div>
        <div className="text-muted-foreground line-clamp-2 max-w-full text-xs leading-tight">
          {item.alamatObjek}
        </div>
      </div>
      <div className="flex w-[150px] flex-col justify-center overflow-hidden px-4 shrink-0">
        <div className="flex items-center gap-1 text-xs">
          <MapPin className="text-primary h-3 w-3 shrink-0" />
          <span className="truncate">{item.dusun || "-"}</span>
        </div>
        <div className="text-muted-foreground text-xs truncate">
          RT {item.rt || "-"} / RW {item.rw || "-"}
        </div>
      </div>
      <div className="flex w-[130px] items-center justify-end font-semibold px-4 shrink-0">
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
          className="whitespace-nowrap text-[10px] sm:text-[11px] font-black uppercase"
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
          <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black">
            {item.penarik?.name?.charAt(0) || <User className="h-3 w-3" />}
          </div>
          <span className="truncate text-[11px] font-medium">{item.penarik?.name || "Belum Ada"}</span>
        </div>
      </div>
    </div>
  );
}
