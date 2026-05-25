import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientLayout } from "./ClientLayout";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login");
  }

  let shouldRedirect = false;

  // Verifikasi apakah user id dari session benar-benar ada di database aktif.
  // Ini krusial jika database sempat di-seed/reset ulang agar tidak memakai ID lama yang basi.
  try {
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!userExists) {
      console.warn(`[DashboardLayout] User ID ${session.user.id} dari session tidak ditemukan di DB baru. Mengarahkan ke halaman login.`);
      shouldRedirect = true;
    }
  } catch (err) {
    console.error("[DashboardLayout] Gagal memverifikasi user di DB:", err);
  }

  if (shouldRedirect) {
    redirect("/login");
  }

  return <ClientLayout>{children}</ClientLayout>;
}

