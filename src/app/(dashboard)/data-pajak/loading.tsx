import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton untuk halaman Data Pajak.
 * Meniru layout: Header → Card dengan tabel data WP
 */
export default function DataPajakLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      {/* Card Tabel */}
      <div className="glass border-none shadow-xl rounded-2xl overflow-hidden">
        {/* Card Header */}
        <div className="p-6 pb-4">
          <Skeleton className="h-5 w-44" />
        </div>

        {/* Filters Row */}
        <div className="px-6 pb-4 flex flex-wrap gap-3">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>

        {/* Table Header */}
        <div className="px-6">
          <div className="flex items-center gap-4 border-b border-border py-3">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40 hidden sm:block" />
            <Skeleton className="h-4 w-20 hidden md:block" />
            <Skeleton className="h-4 w-16 hidden md:block" />
            <Skeleton className="h-4 w-16 hidden md:block" />
            <Skeleton className="h-4 w-24 hidden lg:block" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
        </div>

        {/* Table Rows */}
        <div className="px-6 pb-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-border/50 py-4"
            >
              <Skeleton className="h-4 w-8" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full hidden sm:block" />
              <Skeleton className="h-4 w-12 hidden md:block" />
              <Skeleton className="h-4 w-12 hidden md:block" />
              <Skeleton className="h-4 w-20 hidden lg:block" />
              <Skeleton className="h-6 w-20 rounded-full ml-auto" />
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
