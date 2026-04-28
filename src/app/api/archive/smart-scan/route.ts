import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { createSmartScanJob } from "@/lib/archive-smart-scan-job";

export const dynamic = "force-dynamic";

const MAX_SMART_SCAN_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_SMART_SCAN_MIME_TYPES = new Set(["application/pdf"]);

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const formData = await req.formData();
    const fileCandidate = formData.get("file");
    const file = fileCandidate instanceof File ? fileCandidate : null;
    const yearRaw = formData.get("year");
    const year = yearRaw ? parseInt(yearRaw.toString()) : new Date().getFullYear();

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Smart scan hanya menerima file PDF." }, { status: 400 });
    }

    if (file.type && !ALLOWED_SMART_SCAN_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Tipe file PDF tidak valid." }, { status: 400 });
    }

    if (file.size > MAX_SMART_SCAN_FILE_SIZE) {
      return NextResponse.json({ error: "Ukuran PDF maksimal 50 MB." }, { status: 400 });
    }

    const job = createSmartScanJob(file.name, year, Buffer.from(await file.arrayBuffer()));

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
