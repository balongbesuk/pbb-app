import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createArchiveRestoreJob } from "@/lib/archive-restore-job";

type SessionUserWithRole = {
  role?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const MAX_ARCHIVE_RESTORE_ZIP_SIZE = 100 * 1024 * 1024;
    const ALLOWED_ARCHIVE_RESTORE_MIME_TYPES = new Set([
      "application/zip",
      "application/x-zip-compressed",
      "application/octet-stream",
    ]);

    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as SessionUserWithRole | undefined;
    if (!session || sessionUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const fileCandidate = formData.get("file");
    const file = fileCandidate instanceof File ? fileCandidate : null;
    const year = formData.get("year") as string | null;

    if (!file || !year) {
      return NextResponse.json({ error: "File dan parameter tahun diperlukan" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json({ error: "File restore arsip harus berformat ZIP." }, { status: 400 });
    }

    if (file.type && !ALLOWED_ARCHIVE_RESTORE_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Tipe file ZIP tidak didukung." }, { status: 400 });
    }

    if (file.size > MAX_ARCHIVE_RESTORE_ZIP_SIZE) {
      return NextResponse.json({ error: "Ukuran ZIP maksimal 100 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      new (await import("adm-zip")).default(buffer);
    } catch {
      return NextResponse.json({ error: "Format ZIP tidak valid atau file rusak." }, { status: 400 });
    }

    const job = createArchiveRestoreJob(file.name, year, buffer);
    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: job.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
