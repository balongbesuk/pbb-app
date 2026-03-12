import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton untuk halaman Laporan.
 * Meniru layout: Header → 4 Summary Cards → Tabel Rekapitulasi
 */
export default function LaporanLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="space-y-2 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-900 dark:bg-zinc-950"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-32" />
            {i >= 3 && <Skeleton className="h-3 w-20" />}
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm overflow-hidden dark:border-zinc-900 dark:bg-zinc-950">
        {/* Card Header */}
        <div className="border-b border-zinc-50 p-6 dark:border-zinc-900/50">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-5 w-52" />
          </div>
        </div>

        {/* Table Header */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-6 border-b border-border py-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-12 hidden sm:block" />
            <Skeleton className="h-4 w-12 hidden sm:block" />
            <Skeleton className="h-4 w-20 hidden md:block" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16 hidden lg:block" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Table Rows */}
        <div className="px-6 pb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-6 border-b border-border/50 py-4"
            >
              <div className="flex items-center gap-3 min-w-[150px]">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-5 w-10 rounded-full hidden sm:block" />
              <Skeleton className="h-5 w-10 rounded-full hidden sm:block" />
              <Skeleton className="h-4 w-20 hidden md:block" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16 hidden lg:block" />
              <div className="flex flex-col items-end gap-1 ml-auto">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-1.5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
