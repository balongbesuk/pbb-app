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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, User, UserMinus, ArrowRight, Handshake } from "lucide-react";
import type { TaxDataItem, AppUser, PenarikInfo } from "@/types/app";

interface TaxTableActionsProps {
  item: TaxDataItem;
  penariks: PenarikInfo[];
  currentUser: AppUser | undefined;
  onAssignPenarik: (taxId: string, penarikId: string | null) => void;
  onTransferRequest: (taxId: number, receiverId: string, type: "GIVE" | "TAKE") => void;
}

export function TaxTableActions({
  item,
  penariks,
  currentUser,
  onAssignPenarik,
  onTransferRequest,
}: TaxTableActionsProps) {
  // If the user has no actions available, don't show the menu at all or show a restricted version
  // But for now, we follow the user's request to only keep "Atur Penarik" for Admin and transfer for Penarik.

  const hasAdminActions = currentUser?.role === "ADMIN";
  const hasPenarikActions = currentUser?.role === "PENARIK";

  if (!hasAdminActions && !hasPenarikActions) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Opsi data pajak"
        className="hover:bg-muted rounded-md p-1 transition-colors outline-none"
        onClick={(e) => e.stopPropagation()}
      >

        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {hasAdminActions && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <User className="mr-2 h-4 w-4" />
              Atur Penarik
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-[240px]">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive mb-1 cursor-pointer gap-2 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignPenarik(item.id.toString(), null);
                  }}
                >
                  <UserMinus className="h-4 w-4" />
                  Kosongkan Penarik
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                  {penariks.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssignPenarik(item.id.toString(), p.id);
                      }}
                      className="flex cursor-pointer items-center gap-2 py-2"
                    >
                      <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                        {(p.name || "?").charAt(0)}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="truncate text-sm font-semibold">{p.name}</span>
                        <span className="text-muted-foreground truncate text-[10px]">
                          {p.dusun || "-"} RT {p.rt || "0"}/{p.rw || "0"}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        )}

        {hasPenarikActions && (
          <>
            {item.penarikId === currentUser.id ? (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-emerald-600 focus:text-emerald-700">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Kirim ke Lain
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {penariks
                      .filter((p) => p.id !== currentUser?.id)
                      .map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTransferRequest(item.id, p.id, "GIVE");
                          }}
                          className="cursor-pointer"
                        >
                          {p.name} ({p.dusun})
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            ) : (
              item.penarikId && (
                <DropdownMenuItem
                  className="cursor-pointer text-blue-600 focus:text-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTransferRequest(item.id, item.penarikId!, "TAKE");
                  }}
                >
                  <Handshake className="mr-2 h-4 w-4" />
                  Minta Data WP
                </DropdownMenuItem>
              )
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
