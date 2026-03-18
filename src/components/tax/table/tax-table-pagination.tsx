"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TaxTablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total: number;
  shownCount: number;
}

export function TaxTablePagination({
  currentPage,
  totalPages,
  onPageChange,
  total,
  shownCount,
}: TaxTablePaginationProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 py-4 sm:flex-row">
      <div className="text-muted-foreground text-xs font-medium italic">
        Menampilkan {shownCount} dari {total} data PBB
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="h-10 rounded-xl px-4 font-bold transition-all border-border/60 hover:bg-muted/50 active:scale-95"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="mr-1.5 h-4 w-4" /> Sebelum
        </Button>
        <div className="bg-muted/30 backdrop-blur-sm border-border/60 rounded-xl border px-5 py-2 text-xs font-black tracking-tight shadow-sm">
          <span className="text-muted-foreground">HALAMAN</span> <span className="text-primary text-sm">{currentPage}</span> <span className="text-muted-foreground">DARI</span> {totalPages || 1}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-10 rounded-xl px-4 font-bold transition-all border-border/60 hover:bg-muted/50 active:scale-95"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Lanjut <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
