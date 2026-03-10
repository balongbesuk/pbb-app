"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function LogPagination({
  totalPages,
  currentPage,
}: {
  totalPages: number;
  currentPage: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="border-border/50 flex items-center justify-center gap-4 border-t py-4">
      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => handlePageChange(currentPage - 1)}
        className="gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Sebelumnya
      </Button>
      <div className="text-xs font-medium">
        Halaman {currentPage} dari {totalPages}
      </div>
      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
        className="gap-1"
      >
        Selanjutnya
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
