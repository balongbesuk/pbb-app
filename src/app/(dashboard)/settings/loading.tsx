import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton untuk halaman Pengaturan.
 * Meniru layout: Header → 2 kolom (forms kiri + tools kanan)
 */
export default function SettingsLoading() {
  return (
    <div className="max-w-5xl space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-52" />
        </div>
        <Skeleton className="h-4 w-72" />
      </div>

      {/* 2 Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Forms */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile Form Card */}
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <div className="space-y-2 mb-6">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-56" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ))}
              <Skeleton className="h-10 w-28 rounded-xl mt-2" />
            </div>
          </div>

          {/* Logo Upload Card */}
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <Skeleton className="h-5 w-28 mb-4" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>

          {/* Dusun Manager Card */}
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <div className="space-y-2 mb-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="flex gap-3 mb-4">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-full" />
              ))}
            </div>
          </div>

          {/* Region Otomation Card */}
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <div className="space-y-2 mb-4">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-64" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Tools */}
        <div className="space-y-6">
          {/* Backup Tool Card */}
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <Skeleton className="h-5 w-28 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>

          {/* Danger Zone Card */}
          <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm dark:border-rose-900 dark:bg-zinc-950">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-3 w-52 mb-6" />
            <div className="rounded-2xl border border-rose-100 p-4 dark:border-rose-900/50 space-y-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
