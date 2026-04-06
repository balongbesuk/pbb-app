import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import AdmZip from "adm-zip";
import { requireAdmin } from "@/lib/server-auth";
import { getArchiveDir } from "@/lib/archive-utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    if (!year) {
      return new NextResponse("Year parameter is required", { status: 400 });
    }

    const archiveDir = getArchiveDir(year);

    if (!fs.existsSync(archiveDir)) {
      return new NextResponse("No archive data found for this year", { status: 404 });
    }

    const zip = new AdmZip();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const zipName = `Arsip-PBB-${year}-${timestamp}.zip`;

    // Add everything inside the year folder to the zip
    zip.addLocalFolder(archiveDir);

    const zipBuffer = zip.toBuffer();

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`,
      },
    });
  } catch (error) {
    console.error("Archive Backup Error: ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
