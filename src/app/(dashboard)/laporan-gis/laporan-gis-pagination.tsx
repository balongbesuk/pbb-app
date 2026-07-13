"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  totalItems: number;
};

export function LaporanGisPagination({ page, totalPages, totalItems }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", p.toString());
    router.push(`?${params.toString()}`);
  }

  const maxPagesToShow = 5;
  let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
  let endPage = startPage + maxPagesToShow - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  if (totalItems === 0 || totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-4 py-4 px-6 border-t border-zinc-100 dark:border-zinc-900 sm:flex-row sm:justify-between w-full">
      {/* Total items badge */}
      <div className="flex w-full sm:w-auto animate-in fade-in zoom-in items-center justify-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-1.5 shadow-sm">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
          Belum Terpetakan
        </span>
        <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-black text-primary-foreground">
          {totalItems}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 whitespace-nowrap">
          N.O.P
        </span>
      </div>

      {/* Navigation controls */}
      <div className="flex w-full sm:w-auto items-center justify-center gap-1.5 sm:gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-xl border-zinc-200 border-b-2 shadow-sm transition-all hover:-translate-x-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:border-zinc-800"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex max-w-full overflow-x-auto items-center gap-1 rounded-xl border border-zinc-200 border-b-2 bg-zinc-50 p-1 shadow-inner scrollbar-hide dark:border-zinc-800 dark:bg-zinc-900/50">
          {startPage > 1 && (
            <>
              <button
                onClick={() => goToPage(1)}
                className="h-7 w-7 rounded-lg text-xs font-bold text-muted-foreground transition-all hover:bg-zinc-200 hover:text-foreground dark:hover:bg-zinc-800 cursor-pointer"
              >
                1
              </button>
              {startPage > 2 && <span className="px-1 text-xs text-muted-foreground/50">...</span>}
            </>
          )}

          {pages.map((p) => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={cn(
                "min-w-7 h-7 px-2 rounded-lg text-xs font-black transition-all duration-300 cursor-pointer",
                page === p
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
                onClick={() => goToPage(totalPages)}
                className="h-7 w-7 rounded-lg text-xs font-bold text-muted-foreground transition-all hover:bg-zinc-200 hover:text-foreground dark:hover:bg-zinc-800 cursor-pointer"
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
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
