import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/app/actions/log-actions";
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
    const userId = currentUser?.id;
    if (!userId) {
      return NextResponse.json({ error: "ID pengguna tidak valid." }, { status: 400 });
    }

    const formData = (await req.formData()) as any;
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Tidak ada file yang dikirim." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format tidak didukung. Gunakan JPG, PNG, atau WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Ukuran file maksimal 2MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    assertValidImageUpload(buffer, file.type);

    const ext = EXTENSION_BY_TYPE[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Ekstensi file tidak valid." }, { status: 400 });
    }
    const filename = `avatar-${userId}.${ext}`;

    const uploadDir = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    // Update user avatarUrl in DB
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    
    // Paksa refresh cache halaman yang menampilkan profil
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/");

    await createAuditLog(
      "UPDATE_AVATAR",
      "USER",
      userId,
      "Berhasil memperbarui foto profil."
    );

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error) {
    console.error("Upload avatar error:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
