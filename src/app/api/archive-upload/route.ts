import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import { assertSafeFilename, resolveSafeChildPath } from "@/lib/file-security";
import type { AppUser } from "@/types/app";
import { ensureArchiveDir } from "@/lib/archive-utils";

export const dynamic = "force-dynamic";

const MAX_ARCHIVE_UPLOAD_FILES = 100;
const MAX_ARCHIVE_UPLOAD_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_ARCHIVE_EXTENSIONS = new Set([".pdf"]);
const ALLOWED_ARCHIVE_MIME_TYPES = new Set(["application/pdf"]);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as AppUser | undefined;
    if (!session || user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files").filter((value): value is File => value instanceof File);
    const yearRaw = formData.get("year");
    const year = yearRaw ? parseInt(yearRaw.toString()) : new Date().getFullYear();

    if (!files.length) {
      return NextResponse.json({ success: false, message: "File arsip tidak ditemukan." }, { status: 400 });
    }

    if (files.length > MAX_ARCHIVE_UPLOAD_FILES) {
      return NextResponse.json(
        { success: false, message: `Maksimal ${MAX_ARCHIVE_UPLOAD_FILES} file PDF per unggahan.` },
        { status: 400 }
      );
    }

    const archiveDir = ensureArchiveDir(year);

    let count = 0;
    for (const file of files) {
      if (!(file instanceof File) || file.size <= 0) {
        continue;
      }

      const normalizedName = file.name.trim().toLowerCase();
      const isAllowedExtension = [...ALLOWED_ARCHIVE_EXTENSIONS].some((extension) =>
        normalizedName.endsWith(extension)
      );

      if (!isAllowedExtension) {
        return NextResponse.json(
          { success: false, message: `File ${file.name} harus berformat PDF.` },
          { status: 400 }
        );
      }

      if (file.type && !ALLOWED_ARCHIVE_MIME_TYPES.has(file.type)) {
        return NextResponse.json(
          { success: false, message: `Tipe file ${file.name} tidak didukung.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_ARCHIVE_UPLOAD_FILE_SIZE) {
        return NextResponse.json(
          { success: false, message: `File ${file.name} melebihi batas 10 MB.` },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const safeFilename = assertSafeFilename(file.name);
      const filePath = resolveSafeChildPath(archiveDir, safeFilename);
      fs.writeFileSync(filePath, buffer);
      count++;
    }

    return NextResponse.json({ success: true, message: `${count} file berhasil diunggah.` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
