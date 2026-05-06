"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Ban, MapPin, User } from "lucide-react";
import { cn, formatCurrency, getPaymentStatusColor, getPaymentStatusLabel } from "@/lib/utils";
import { TAX_TABLE_WIDTHS } from "@/constants/table-layout";
import type { TaxDataItem } from "@/types/app";

interface TaxTableRowProps {
  item: TaxDataItem;
  selected: boolean;
  onToggle: (id: number) => void;
  onOpenDetail: (item: TaxDataItem) => void;
  role: string;
  selectionDisabled?: boolean;
  selectionHint?: string;
  style?: React.CSSProperties;
}

export function TaxTableRow({
  item,
  selected,
  onToggle,
  onOpenDetail,
  role,
  selectionDisabled = false,
  selectionHint,
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
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn("flex items-center justify-center p-1 sm:p-2", TAX_TABLE_WIDTHS.checkbox)}
          title={selectionHint}
        >
          <div className="relative">
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggle(item.id)}
              disabled={selectionDisabled}
              aria-label="Select row"
            />
            {selectionDisabled && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <Ban className="h-4 w-4 text-rose-500/85" />
              </span>
            )}
          </div>
        </div>
      )}
      <div className={cn("flex items-center font-mono text-xs px-4", TAX_TABLE_WIDTHS.nop)}>{item.nop}</div>
      <div className={cn("flex flex-col justify-center overflow-hidden px-4", TAX_TABLE_WIDTHS.wpInfo)}>
        <div className="truncate font-semibold text-sm">{item.namaWp}</div>
        <div className="text-muted-foreground truncate max-w-full text-xs">
          {item.alamatObjek}
        </div>
      </div>
      <div className={cn("flex flex-col justify-center overflow-hidden px-4", TAX_TABLE_WIDTHS.wilayah)}>
        <div className="flex items-center gap-1 text-xs">
          <MapPin className="text-primary h-3 w-3 shrink-0" />
          <span className="truncate">{item.dusun || "-"}</span>
        </div>
        <div className="text-muted-foreground text-[10px] truncate flex items-center gap-1">
          <span>RT {item.rt || "-"} / RW {item.rw || "-"}</span>
          <span className="text-xs opacity-30">|</span>
          <span className="font-bold text-primary/80">BLOK {item.nop.replace(/\D/g, "").substring(10, 13) || "-"}</span>
        </div>
      </div>
      <div className={cn("flex items-center justify-end font-semibold px-4", TAX_TABLE_WIDTHS.tagihan)}>
        {formatCurrency(item.ketetapan)}
      </div>
      <div className={cn("flex items-center px-4", TAX_TABLE_WIDTHS.status)}>
        <Badge
          variant="outline"
          className={cn(
            "whitespace-nowrap text-[10px] sm:text-[11px] font-black uppercase border-transparent",
            getPaymentStatusColor(item.paymentStatus)
          )}
        >
          {getPaymentStatusLabel(item.paymentStatus)}
        </Badge>
      </div>
      <div className={cn("flex items-center overflow-hidden px-4", TAX_TABLE_WIDTHS.penarik)}>
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
