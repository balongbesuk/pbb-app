import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton untuk halaman Manajemen Pengguna.
 * Meniru layout: Header + Tombol Tambah → Grid kartu user
 */
export default function PenggunaLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* User Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950"
          >
            {/* Card Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start justify-between">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>

            {/* Card Content */}
            <div className="flex flex-1 flex-col justify-between space-y-5 px-6 pb-6">
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-zinc-50 pt-5 dark:border-zinc-900">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-10" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
