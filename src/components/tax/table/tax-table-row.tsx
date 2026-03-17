"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, CheckCircle2 } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TaxTableActions } from "@/components/tax/table/tax-table-actions";
import type { TaxDataItem, AppUser, PenarikInfo } from "@/types/app";
import type { PaymentStatus } from "@prisma/client";

interface TaxTableRowProps {
  item: TaxDataItem;
  selected: boolean;
  onToggle: (id: number) => void;
  onOpenDetail: (item: TaxDataItem) => void;
  currentUser: AppUser | undefined;
  penariks: PenarikInfo[];
  onUpdateStatus: (id: string, status: PaymentStatus) => void;
  onAssignPenarik: (taxId: string, penarikId: string | null) => void;
  onTransferRequest: (taxId: number, receiverId: string, type: "GIVE" | "TAKE") => void;
  role: string;
  style?: React.CSSProperties;
}


export function TaxTableRow({
  item,
  selected,
  onToggle,
  onOpenDetail,
  currentUser,
  penariks,
  onUpdateStatus,
  onAssignPenarik,
  onTransferRequest,
  role,
  style,
}: TaxTableRowProps) {


  return (
    <TableRow
      className="hover:bg-muted/40 border-border/50 absolute left-0 top-0 flex w-full cursor-pointer transition-colors"
      data-state={selected ? "selected" : undefined}
      onClick={() => onOpenDetail(item)}
      style={style}
    >
      {role !== "PENGGUNA" && (
        <TableCell onClick={(e) => e.stopPropagation()} className="flex w-[50px] items-center justify-center p-1 sm:p-2">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggle(item.id)}
            aria-label="Select row"
          />
        </TableCell>
      )}
      <TableCell className="flex w-[180px] items-center font-mono text-xs">{item.nop}</TableCell>
      <TableCell className="flex flex-1 flex-col justify-center overflow-hidden">
        <div className="truncate font-semibold">{item.namaWp}</div>
        <div className="text-muted-foreground line-clamp-1 max-w-full text-xs">
          {item.alamatObjek}
        </div>
      </TableCell>
      <TableCell className="flex w-[150px] flex-col justify-center overflow-hidden">
        <div className="flex items-center gap-1 text-xs">
          <MapPin className="text-primary h-3 w-3 shrink-0" />
          <span className="truncate">{item.dusun || "-"}</span>
        </div>
        <div className="text-muted-foreground text-xs truncate">
          RT {item.rt || "-"} / RW {item.rw || "-"}
        </div>
      </TableCell>
      <TableCell className="flex w-[120px] items-center justify-end font-semibold">
        {formatCurrency(item.ketetapan)}
      </TableCell>
      <TableCell className="flex w-[120px] items-center">
        <Badge
          variant={
            (item.paymentStatus === "LUNAS"
               ? "success"
               : item.paymentStatus === "BELUM_LUNAS"
                 ? "warning"
                 : "outline") as any
          }
          className="whitespace-nowrap text-[10px] sm:text-xs font-black uppercase"
        >
          {item.paymentStatus === "LUNAS"
            ? "Lunas"
            : item.paymentStatus === "BELUM_LUNAS"
              ? "Blm Lunas"
              : "Tdk Terbit"}
        </Badge>
      </TableCell>
      <TableCell className="flex w-[150px] items-center overflow-hidden">
        <div className="flex items-center gap-2 truncate">
          <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
            {item.penarik?.name?.charAt(0) || <User className="h-3 w-3" />}
          </div>
          <span className="truncate text-xs">{item.penarik?.name || "Belum Ada"}</span>
        </div>
      </TableCell>
      {role !== "PENGGUNA" && (
        <TableCell onClick={(e) => e.stopPropagation()} className="flex w-[60px] items-center justify-center p-1 sm:p-4">
          <div className="flex items-center gap-1 sm:gap-2">
            {item.paymentStatus === "BELUM_LUNAS" && (currentUser?.role === "ADMIN" || item.penarikId === currentUser?.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(item.id.toString(), "LUNAS");
                }}
                className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 active:scale-90 flex h-7 w-7 items-center justify-center rounded-lg transition-all sm:hidden"
                title="Cepat Lunaskan"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
            )}
            <TaxTableActions
              item={item}
              penariks={penariks}
              currentUser={currentUser}
              onAssignPenarik={onAssignPenarik}
              onTransferRequest={onTransferRequest}
            />
          </div>
        </TableCell>
      )}
    </TableRow>

  );
}
