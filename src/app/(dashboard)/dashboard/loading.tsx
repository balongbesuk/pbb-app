import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton untuk halaman Dashboard.
 * Meniru layout: Header → 4 Stats Cards → 2 Charts + Sidebar
 */
export default function DashboardLoading() {
  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Skeleton className="hidden sm:block h-14 w-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* 4 Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <Skeleton className="h-10 w-10 rounded-xl" />
              {i === 2 && <Skeleton className="h-5 w-14 rounded-full" />}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Charts */}
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-[350px] w-full rounded-2xl" />
          </div>
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <div className="mb-4 space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-60" />
            </div>
            <Skeleton className="h-[300px] w-full rounded-2xl" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <Skeleton className="mb-4 h-5 w-32" />
            <Skeleton className="mx-auto h-[200px] w-[200px] rounded-full" />
            <div className="mt-6 space-y-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <Skeleton className="mb-4 h-5 w-28" />
            <div className="space-y-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-10 rounded-full" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
