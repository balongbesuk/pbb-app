"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function TaxTableSkeleton({ rows = 5, role = "ADMIN" }: { rows?: number; role?: string }) {
  return (
    <div className="flex flex-col w-full">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex w-full items-center h-16 border-b border-border/50 animate-in fade-in-50 duration-500 px-4">
          {role !== "PENGGUNA" && (
            <div className="w-[50px] shrink-0">
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          )}
          <div className="w-[180px] shrink-0">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex-1">
            <Skeleton className="mb-1 h-4 w-40" />
            <Skeleton className="h-3 w-60" />
          </div>
          <div className="w-[150px] shrink-0 px-4">
            <Skeleton className="mb-1 h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="w-[120px] shrink-0 text-right px-4">
            <Skeleton className="ml-auto h-4 w-24" />
          </div>
          <div className="w-[120px] shrink-0 px-4">
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="w-[150px] shrink-0 px-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
