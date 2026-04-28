import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { getSmartScanJob } from "@/lib/archive-smart-scan-job";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { jobId } = await context.params;
    const job = getSmartScanJob(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job smart scan tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({
      id: job.id,
      state: job.state,
      percent: job.percent,
      current: job.current,
      total: job.total,
      status: job.status,
      nopLast: job.nopLast,
      detectedCount: job.detectedCount,
      skippedCount: job.skippedCount,
      error: job.error,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
