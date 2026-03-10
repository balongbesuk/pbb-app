import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, KeyRound, MapPin } from "lucide-react";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { Badge } from "@/components/ui/badge";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return <div>Sesi tidak valid. Silakan login kembali.</div>;
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id as string },
    select: {
      name: true,
      username: true,
      email: true,
      role: true,
      dusun: true,
      rt: true,
      rw: true,
    },
  });

  if (!user) {
    return <div>Data pengguna tidak ditemukan.</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <User className="text-primary h-8 w-8" />
            Profil Akun Saya
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola informasi pribadi dan keamanan akun Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="glass border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Informasi Pengguna
              <Badge variant="outline" className="ml-2 uppercase">
                {user.role}
              </Badge>
            </CardTitle>
            <CardDescription>Detail informasi diri dan area tugas Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl bg-white/30 p-4 dark:bg-black/20">
              <div className="bg-primary/10 text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold">
                {user.name?.charAt(0) || "U"}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{user.name}</h3>
                <p className="text-muted-foreground text-sm">@{user.username}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex flex-col">
                <span className="text-muted-foreground mb-1 text-xs">Email / Kontak</span>
                <span className="font-medium">{user.email || "-"}</span>
              </div>
              {user.role === "PENARIK" && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground mb-1 text-xs">Area Penugasan Pajak</span>
                  <span className="flex items-center gap-2 font-medium">
                    <MapPin className="text-primary h-4 w-4" />
                    {user.dusun || "Dusun (N/A)"}, RT {user.rt || "(N/A)"} / RW {user.rw || "(N/A)"}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/10 shadow-lg dark:border-amber-900 dark:bg-amber-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
              <KeyRound className="h-5 w-5" />
              Keamanan Password
            </CardTitle>
            <CardDescription>
              Ubah kata sandi secara berkala untuk menjaga keamanan akun Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
