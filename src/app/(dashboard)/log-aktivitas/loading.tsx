import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton untuk halaman Log Aktivitas.
 * Meniru layout: Header + Search → Card dengan timeline entries
 */
export default function LogAktivitasLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-64 rounded-xl" />
      </div>

      {/* Log Card */}
      <div className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
        {/* Card Header */}
        <div className="border-b border-zinc-50 px-6 pt-6 pb-5 dark:border-zinc-900/50">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>

        {/* Log Entries */}
        <div className="divide-y divide-border/50">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-5 md:px-6">
              {/* Icon */}
              <Skeleton className="hidden sm:block h-10 w-10 rounded-xl shrink-0 mt-1" />

              {/* Content */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-4 w-full max-w-md" />
                {i % 3 === 0 && (
                  <Skeleton className="h-14 w-full rounded-xl" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="border-t border-border/50 px-6 py-4 flex justify-center">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
