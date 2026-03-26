import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TaxTableSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="md:min-w-[1100px] animate-in fade-in duration-500">
      {/* Desktop Header Skeleton */}
      {!isMobile && (
        <div className="flex sticky top-0 z-30 bg-muted border-b border-border/80 w-full items-center h-12 px-4 shadow-sm">
          <div className="w-[50px] shrink-0"><Skeleton className="h-4 w-4" /></div>
          <div className="w-[180px] shrink-0"><Skeleton className="h-4 w-24" /></div>
          <div className="flex-1 min-w-[300px] px-4"><Skeleton className="h-4 w-40" /></div>
          <div className="w-[150px] shrink-0 px-4"><Skeleton className="h-4 w-20" /></div>
          <div className="w-[130px] shrink-0 px-4 ml-auto"><Skeleton className="h-4 w-20" /></div>
          <div className="w-[120px] shrink-0 px-4"><Skeleton className="h-4 w-16" /></div>
          <div className="w-[150px] shrink-0 px-4"><Skeleton className="h-4 w-24" /></div>
        </div>
      )}

      <div className="space-y-4 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={cn(
            "rounded-2xl border border-border/40 bg-card/40 p-1 overflow-hidden",
            isMobile ? "h-[220px]" : "h-16 flex items-center px-4"
          )}>
            {isMobile ? (
              <div className="flex flex-col h-full">
                <div className="h-10 border-b border-border/40 bg-muted/20 px-4 flex items-center justify-between">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="flex-1 p-4 flex flex-col gap-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="h-12 grid grid-cols-2 divide-x divide-border/40 border-t border-border/40">
                  <div className="flex items-center px-4"><Skeleton className="h-5 w-20" /></div>
                  <div className="flex items-center px-4"><Skeleton className="h-3 w-16" /></div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-[50px] shrink-0"><Skeleton className="h-8 w-8 rounded-lg" /></div>
                <div className="w-[180px] shrink-0"><Skeleton className="h-4 w-28" /></div>
                <div className="flex-1 min-w-[300px] px-4"><Skeleton className="h-5 w-48" /></div>
                <div className="w-[150px] shrink-0 px-4"><Skeleton className="h-4 w-24" /></div>
                <div className="w-[130px] shrink-0 px-4 ml-auto"><Skeleton className="h-5 w-20" /></div>
                <div className="w-[120px] shrink-0 px-4"><Skeleton className="h-6 w-16 rounded-full" /></div>
                <div className="w-[150px] shrink-0 px-4"><Skeleton className="h-8 w-8 rounded-full" /></div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
