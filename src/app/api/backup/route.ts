import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const zip = new AdmZip();
        const dbPath = path.join(process.cwd(), "prisma", "dev.db");

        if (!fs.existsSync(dbPath)) {
            return new NextResponse("Database file not found", { status: 404 });
        }

        // Copy the database file into the zip
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const zipName = `PBB-MA-Backup-${timestamp}.zip`;
        const dbFileName = `pbb-manager-${timestamp}.db`;

        zip.addFile(dbFileName, fs.readFileSync(dbPath));

        const zipBuffer = zip.toBuffer();

        return new NextResponse(new Uint8Array(zipBuffer), {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="${zipName}"`,
            },
        });
    } catch (error: any) {
        console.error("Backup Error: ", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
