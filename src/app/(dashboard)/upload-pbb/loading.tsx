import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton untuk halaman Upload PBB.
 * Meniru layout: Header → 2 kolom (upload form kiri + info cards kanan)
 */
export default function UploadPBBLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upload Card */}
        <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm lg:col-span-2 dark:border-zinc-900 dark:bg-zinc-950 overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-zinc-50 px-6 pt-6 pb-5 dark:border-zinc-900/50">
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>

          {/* Card Content */}
          <div className="space-y-6 p-6">
            {/* Tahun Input */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>

            {/* Drop Zone */}
            <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border-2 border-dashed border-zinc-100 p-10 dark:border-zinc-900">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <div className="space-y-2 text-center">
                <Skeleton className="h-4 w-44 mx-auto" />
                <Skeleton className="h-3 w-36 mx-auto" />
              </div>
            </div>

            {/* Upload Button */}
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="space-y-4 rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-3">
              <Skeleton className="h-3 w-20" />
              <div className="space-y-2.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </div>

          {/* Reset Card */}
          <div className="space-y-5 rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
