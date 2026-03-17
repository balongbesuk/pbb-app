"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function TaxTableSkeleton({ rows = 5, role = "ADMIN" }: { rows?: number; role?: string }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="animate-in fade-in-50 duration-500">
          {role !== "PENGGUNA" && (
            <TableCell>
              <Skeleton className="h-4 w-4 rounded" />
            </TableCell>
          )}
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="mb-1 h-4 w-40" />
            <Skeleton className="h-3 w-60" />
          </TableCell>
          <TableCell>
            <Skeleton className="mb-1 h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </TableCell>
          {role !== "PENGGUNA" && (
            <TableCell>
              <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  );
}
