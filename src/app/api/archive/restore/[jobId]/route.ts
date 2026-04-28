import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getArchiveRestoreJob } from "@/lib/archive-restore-job";

type SessionUserWithRole = {
  role?: string | null;
};

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as SessionUserWithRole | undefined;
    if (!session || sessionUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await context.params;
    const job = getArchiveRestoreJob(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job restore arsip tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({
      id: job.id,
      state: job.state,
      phase: job.phase,
      percent: job.percent,
      current: job.current,
      total: job.total,
      status: job.status,
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
