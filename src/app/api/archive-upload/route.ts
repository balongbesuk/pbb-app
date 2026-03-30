import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import path from "path";
import fs from "fs";
import { assertSafeFilename, resolveSafeChildPath } from "@/lib/file-security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const yearRaw = formData.get("year");
    const year = yearRaw ? parseInt(yearRaw.toString()) : new Date().getFullYear();
    
    const { getArchivePath } = require("@/lib/storage");
    const archiveDir = getArchivePath(year.toString());

    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    let count = 0;
    for (const file of files) {
      if (file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const safeFilename = assertSafeFilename(file.name);
        const filePath = resolveSafeChildPath(archiveDir, safeFilename);
        fs.writeFileSync(filePath, buffer);
        count++;
      }
    }

    return NextResponse.json({ success: true, message: `${count} file berhasil diunggah.` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
