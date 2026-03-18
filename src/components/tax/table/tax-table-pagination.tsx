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
          className="h-8 px-3 font-semibold transition-all"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="mr-1.5 h-4 w-4" /> Sebelumnya
        </Button>
        <div className="bg-muted/50 border-border/50 rounded-md border px-4 py-1.5 text-xs font-bold">
          Halaman <span className="text-primary">{currentPage}</span> dari {totalPages || 1}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 font-semibold transition-all"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Selanjutnya <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
