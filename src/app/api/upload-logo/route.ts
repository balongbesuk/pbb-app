import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { assertValidImageUpload } from "@/lib/file-security";
import type { AppUser } from "@/types/app";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = session.user as AppUser | undefined;
    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin yang dapat mengubah logo desa." }, { status: 403 });
    }

    const formData = (await req.formData()) as any;
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Tidak ada file yang dikirim." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan JPG, PNG, atau WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Ukuran file maksimal 2MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    assertValidImageUpload(buffer, file.type);

    const ext = EXTENSION_BY_TYPE[file.type] || "png";
    const filename = `logo-desa.${ext}`;

    // Save to public/uploads/logos
    const uploadDir = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads", "logos");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const logoUrl = `/uploads/logos/${filename}`;

    // Update VillageConfig
    await prisma.villageConfig.update({
      where: { id: 1 },
      data: { logoUrl },
    });

    revalidatePath("/settings");
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true, logoUrl });
  } catch (error) {
    console.error("Upload logo error:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
