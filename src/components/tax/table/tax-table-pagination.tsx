"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaxTablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total: number;
  label?: string;
  className?: string;
}

export function TaxTablePagination({
  currentPage,
  totalPages,
  onPageChange,
  total,
  label = "data PBB",
  className,
}: TaxTablePaginationProps) {
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = startPage + maxPagesToShow - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  if (total === 0 || totalPages <= 1) return null;

  return (
    <div className={cn("flex flex-col items-center gap-4 py-4 sm:flex-row sm:justify-between w-full", className)}>
      <div className="flex w-full sm:w-auto animate-in fade-in zoom-in items-center justify-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-1.5 shadow-sm">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
          Total Data
        </span>
        <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-black text-primary-foreground">
          {total}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 whitespace-nowrap">
          {label}
        </span>
      </div>

      <div className="flex w-full sm:w-auto flex-wrap items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-xl border-zinc-200 border-b-2 shadow-sm transition-all hover:-translate-x-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:border-zinc-800"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex max-w-full overflow-x-auto items-center gap-1 rounded-xl border border-zinc-200 border-b-2 bg-zinc-50 p-1 shadow-inner scrollbar-hide dark:border-zinc-800 dark:bg-zinc-900/50">
          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="h-7 w-7 rounded-lg text-xs font-bold text-muted-foreground transition-all hover:bg-zinc-200 hover:text-foreground dark:hover:bg-zinc-800"
              >
                1
              </button>
              {startPage > 2 && <span className="px-1 text-xs text-muted-foreground/50">...</span>}
            </>
          )}

          {pages.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                "min-w-7 h-7 px-2 rounded-lg text-xs font-black transition-all duration-300",
                currentPage === p
                  ? "scale-105 bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-zinc-200 hover:text-foreground dark:hover:bg-zinc-800"
              )}
            >
              {p}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="px-1 text-xs text-muted-foreground/50">...</span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="h-7 w-7 rounded-lg text-xs font-bold text-muted-foreground transition-all hover:bg-zinc-200 hover:text-foreground dark:hover:bg-zinc-800"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-xl border-zinc-200 border-b-2 shadow-sm transition-all hover:translate-x-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:border-zinc-800"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
