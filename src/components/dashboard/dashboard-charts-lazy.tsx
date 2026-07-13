"use client";

import dynamic from "next/dynamic";

function ChartSkeleton() {
  return (
    <div className="h-[350px] w-full animate-pulse bg-muted/40 rounded-3xl border border-border/20" />
  );
}

function SidebarCardSkeleton() {
  return (
    <div className="h-[400px] w-full animate-pulse bg-muted/40 rounded-3xl border border-border/20" />
  );
}

export const RWBarChart = dynamic(
  () => import("./dashboard-charts").then((mod) => mod.RWBarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export const StatusPieChart = dynamic(
  () => import("./dashboard-charts").then((mod) => mod.StatusPieChart),
  { ssr: false, loading: () => <SidebarCardSkeleton /> }
);

export const TrendAnalysisChart = dynamic(
  () => import("./dashboard-charts").then((mod) => mod.TrendAnalysisChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
