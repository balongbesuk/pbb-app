"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TaxTablePagination } from "@/components/tax/table/tax-table-pagination";

export function LogTablePagination({
  currentPage,
  totalPages,
  total,
}: {
  currentPage: number;
  totalPages: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="px-6 border-t border-zinc-50 dark:border-zinc-900/50">
      <TaxTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        onPageChange={handlePageChange}
        label="Log Aktivitas"
      />
    </div>
  );
}
