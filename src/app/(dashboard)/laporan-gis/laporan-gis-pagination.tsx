"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
};

export function LaporanGisPagination({ page, totalPages, totalItems, startIndex, endIndex }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", p.toString());
    router.push(`?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-zinc-50 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/20">
      <p className="text-xs text-zinc-500 font-medium">
        Menampilkan <strong className="text-zinc-800 dark:text-zinc-200">{startIndex}</strong> - <strong className="text-zinc-800 dark:text-zinc-200">{endIndex}</strong> dari <strong className="text-zinc-800 dark:text-zinc-200">{totalItems}</strong> NOP belum terpetakan
      </p>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .map((p, i, arr) => {
              const showEllipsis = i > 0 && p - arr[i - 1] > 1;
              return (
                <div key={p} className="flex items-center">
                  {showEllipsis && <span className="px-2 text-zinc-400 text-xs">...</span>}
                  <button
                    onClick={() => goToPage(p)}
                    className={`w-7 h-7 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      page === p
                        ? "bg-indigo-600 text-white"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {p}
                  </button>
                </div>
              );
            })}
        </div>

        <button
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
