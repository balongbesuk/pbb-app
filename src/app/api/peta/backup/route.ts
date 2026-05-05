import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import type { AppUser } from "@/types/app";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as AppUser | undefined;
    if (!session || user?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const mapDir = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "maps");

    if (!fs.existsSync(mapDir)) {
      return new NextResponse("No map data found", { status: 404 });
    }

    const zip = new AdmZip();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const zipName = `Backup-Peta-PBB-${timestamp}.zip`;

    // Add everything inside the maps folder to the zip
    // Filter only .gpx files or everything? Maps usually only has .gpx 
    const entries = fs.readdirSync(mapDir);
    if (entries.length === 0) {
        return new NextResponse("Map directory is empty", { status: 404 });
    }

    zip.addLocalFolder(mapDir);

    const zipBuffer = zip.toBuffer();

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`,
      },
    });
  } catch (error) {
    console.error("Map Backup Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
