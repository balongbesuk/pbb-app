import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdmZip from "adm-zip";
import type { AppUser } from "@/types/app";
import { createMapRestoreJob } from "@/lib/map-restore-job";

const MAX_MAP_RESTORE_ZIP_SIZE = 50 * 1024 * 1024;
const ALLOWED_MAP_RESTORE_MIME_TYPES = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
]);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as AppUser | undefined;
    if (!session || user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const fileCandidate = formData.get("file");
    const file = fileCandidate instanceof File ? fileCandidate : null;

    if (!file) {
      return NextResponse.json({ error: "File backup peta diperlukan" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json({ error: "Backup peta harus berformat ZIP." }, { status: 400 });
    }

    if (file.type && !ALLOWED_MAP_RESTORE_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Tipe file ZIP tidak didukung." }, { status: 400 });
    }

    if (file.size > MAX_MAP_RESTORE_ZIP_SIZE) {
      return NextResponse.json({ error: "Ukuran ZIP maksimal 50 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      new AdmZip(buffer);
    } catch {
      return NextResponse.json({ error: "Format ZIP tidak valid atau file rusak." }, { status: 400 });
    }

    const job = createMapRestoreJob(file.name, buffer);
    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: job.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Map Restore Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
