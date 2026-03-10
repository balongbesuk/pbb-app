"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, MoreHorizontal, FileText, CheckCircle, Clock } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { TaxTableActions } from "@/components/tax/table/tax-table-actions";

interface TaxTableRowProps {
    item: any;
    selected: boolean;
    onToggle: (id: number) => void;
    onOpenDetail: (item: any) => void;
    currentUser: any;
    penariks: any[];
    onUpdateStatus: (id: string, status: any) => void;
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
    role
}: TaxTableRowProps) {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <TableRow
            className={`hover:bg-muted/40 transition-colors border-border/50 ${role === "PENGGUNA" ? "cursor-pointer" : ""}`}
            data-state={selected ? "selected" : undefined}
            onClick={role === "PENGGUNA" ? () => onOpenDetail(item) : undefined}
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
                <div className="text-xs text-muted-foreground whitespace-normal break-words max-w-[300px]">{item.alamatObjek}</div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1 text-xs">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span>{item.dusun || "-"}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">RT {item.rt || "?"} / RW {item.rw || "?"}</div>
            </TableCell>
            <TableCell className="text-right font-semibold">
                {formatCurrency(item.ketetapan)}
            </TableCell>
            <TableCell>
                <Badge variant={(item.paymentStatus === 'LUNAS' ? 'success' : item.paymentStatus === 'BELUM_LUNAS' ? 'warning' : 'outline') as any} className="text-[10px]">
                    {item.paymentStatus}
                </Badge>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {item.penarik?.name?.charAt(0) || <User className="w-3 h-3" />}
                    </div>
                    <span className="text-xs truncate">{item.penarik?.name || "Belum Ada"}</span>
                </div>
            </TableCell>
            {role !== "PENGGUNA" && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                    <TaxTableActions
                        item={item}
                        penariks={penariks}
                        currentUser={currentUser}
                        onOpenDetail={() => onOpenDetail(item)}
                        onUpdateStatus={onUpdateStatus}
                        onAssignPenarik={onAssignPenarik}
                        onTransferRequest={onTransferRequest}
                    />
                </TableCell>
            )}
        </TableRow>
    );
}
