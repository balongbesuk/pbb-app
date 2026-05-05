import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import type { AppUser } from "@/types/app";
import { resolveSqliteDatabasePath } from "@/lib/database-path";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as AppUser | undefined;
    if (!session || user?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const zip = new AdmZip();
    const dbPath = resolveSqliteDatabasePath();
    const uploadsPath = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads");

    if (!fs.existsSync(dbPath)) {
      return new NextResponse("Database file not found", { status: 404 });
    }

    // 1. Add database file to root of zip
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const zipName = `PBB-MA-Backup-${timestamp}.zip`;
    const dbFileName = `dev.db`; // Use fixed name for easier restore detection, or keeping it in root
    
    zip.addFile(dbFileName, fs.readFileSync(dbPath));

    // 2. Add uploads folder to zip if it exists
    if (fs.existsSync(uploadsPath)) {
      zip.addLocalFolder(uploadsPath, "uploads");
    }

    const zipBuffer = zip.toBuffer();

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`,
      },
    });
  } catch (error) {
    console.error("Backup Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
