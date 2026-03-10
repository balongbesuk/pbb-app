"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText, CheckCircle, Clock, User, UserMinus, ArrowRight, Handshake } from "lucide-react";

interface TaxTableActionsProps {
    item: any;
    penariks: any[];
    currentUser: any;
    onOpenDetail: () => void;
    onUpdateStatus: (id: string, status: any) => void;
    onAssignPenarik: (taxId: string, penarikId: string | null) => void;
    onTransferRequest: (taxId: number, receiverId: string, type: "GIVE" | "TAKE") => void;
}

export function TaxTableActions({
    item,
    penariks,
    currentUser,
    onOpenDetail,
    onUpdateStatus,
    onAssignPenarik,
    onTransferRequest
}: TaxTableActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="p-1 hover:bg-muted rounded-md transition-colors outline-none">
                <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuItem className="cursor-pointer font-bold text-primary focus:text-primary focus:bg-primary/10 gap-2 mb-1" onClick={onOpenDetail}>
                    <FileText className="w-4 h-4" />
                    Detail Pajak
                </DropdownMenuItem>

                {currentUser?.role !== "PENGGUNA" && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onUpdateStatus(item.id, 'LUNAS')} className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Tandai Lunas
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(item.id, 'BELUM_LUNAS')} className="text-amber-600 focus:text-amber-700 focus:bg-amber-50 cursor-pointer gap-2">
                            <Clock className="w-4 h-4" />
                            Tandai Belum Lunas
                        </DropdownMenuItem>
                    </>
                )}

                {currentUser?.role === "ADMIN" && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <User className="w-4 h-4 mr-2" />
                                Atur Penarik
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent className="w-[240px]">
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive font-medium cursor-pointer gap-2 mb-1"
                                        onClick={() => onAssignPenarik(item.id, null)}
                                    >
                                        <UserMinus className="w-4 h-4" />
                                        Kosongkan Penarik
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {penariks.map(p => (
                                            <DropdownMenuItem
                                                key={p.id}
                                                onClick={() => onAssignPenarik(item.id, p.id)}
                                                className="cursor-pointer flex items-center gap-2 py-2"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                                    {p.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col truncate">
                                                    <span className="font-semibold text-sm truncate">{p.name}</span>
                                                    <span className="text-[10px] text-muted-foreground truncate">{p.dusun || "-"} RT {p.rt || "0"}/{p.rw || "0"}</span>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    </>
                )}

                {currentUser?.role === "PENARIK" && (
                    <>
                        <DropdownMenuSeparator />
                        {item.penarikId === currentUser.id ? (
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="text-emerald-600 focus:text-emerald-700">
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    Kirim ke Lain
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                        {penariks.filter(p => p.id !== currentUser.id).map(p => (
                                            <DropdownMenuItem
                                                key={p.id}
                                                onClick={() => onTransferRequest(item.id, p.id, "GIVE")}
                                                className="cursor-pointer"
                                            >
                                                {p.name} ({p.dusun})
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                        ) : item.penarikId && (
                            <DropdownMenuItem
                                className="text-blue-600 focus:text-blue-700 cursor-pointer"
                                onClick={() => onTransferRequest(item.id, item.penarikId!, "TAKE")}
                            >
                                <Handshake className="w-4 h-4 mr-2" />
                                Minta Data WP
                            </DropdownMenuItem>
                        )}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
