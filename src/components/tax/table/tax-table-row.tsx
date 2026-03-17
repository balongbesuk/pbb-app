"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MapPin, User } from "lucide-react";
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
}: TaxTableRowProps) {

  return (
    <TableRow
      className="hover:bg-muted/40 border-border/50 cursor-pointer transition-colors"
      data-state={selected ? "selected" : undefined}
      onClick={() => onOpenDetail(item)}
    >
      {role !== "PENGGUNA" && (
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggle(item.id)}
            aria-label="Select row"
          />
        </TableCell>
      )}
      <TableCell className="font-mono text-xs">{item.nop}</TableCell>
      <TableCell>
        <div className="font-semibold">{item.namaWp}</div>
        <div className="text-muted-foreground max-w-[300px] text-xs break-words whitespace-normal">
          {item.alamatObjek}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-xs">
          <MapPin className="text-primary h-3 w-3" />
          <span>{item.dusun || "-"}</span>
        </div>
        <div className="text-muted-foreground text-xs">
          RT {item.rt || "-"} / RW {item.rw || "-"}
        </div>
      </TableCell>
      <TableCell className="text-right font-semibold">{formatCurrency(item.ketetapan)}</TableCell>
      <TableCell>
        <Badge
          variant={
            (item.paymentStatus === "LUNAS"
              ? "success"
              : item.paymentStatus === "BELUM_LUNAS"
                ? "warning"
                : "outline") as any
          }
          className="text-xs font-bold"
        >
          {item.paymentStatus === "LUNAS"
            ? "Lunas"
            : item.paymentStatus === "BELUM_LUNAS"
              ? "Belum Lunas"
              : "Tdk Terbit"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
            {item.penarik?.name?.charAt(0) || <User className="h-3 w-3" />}
          </div>
          <span className="truncate text-xs">{item.penarik?.name || "Belum Ada"}</span>
        </div>
      </TableCell>
      {role !== "PENGGUNA" && (
        <TableCell onClick={(e) => e.stopPropagation()}>
          <TaxTableActions
            item={item}
            penariks={penariks}
            currentUser={currentUser}
            onAssignPenarik={onAssignPenarik}
            onTransferRequest={onTransferRequest}
          />
        </TableCell>
      )}
    </TableRow>
  );
}
