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
    select: { name: true, username: true, email: true, role: true, dusun: true, rt: true, rw: true }
  });

  if (!user) {
    return <div>Data pengguna tidak ditemukan.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="w-8 h-8 text-primary" />
            Profil Akun Saya
          </h1>
          <p className="text-muted-foreground mt-1">Kelola informasi pribadi dan keamanan akun Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Informasi Pengguna
              <Badge variant="outline" className="ml-2 uppercase">{user.role}</Badge>
            </CardTitle>
            <CardDescription>
              Detail informasi diri dan area tugas Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 bg-white/30 dark:bg-black/20 p-4 rounded-xl">
               <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
                  {user.name?.charAt(0) || "U"}
               </div>
               <div>
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <p className="text-muted-foreground text-sm">@{user.username}</p>
               </div>
            </div>

            <div className="space-y-3 pt-2">
               <div className="flex flex-col">
                 <span className="text-xs text-muted-foreground mb-1">Email / Kontak</span>
                 <span className="font-medium">{user.email || "-"}</span>
               </div>
               {user.role === "PENARIK" && (
                 <div className="flex flex-col">
                   <span className="text-xs text-muted-foreground mb-1">Area Penugasan Pajak</span>
                   <span className="font-medium flex items-center gap-2">
                     <MapPin className="w-4 h-4 text-primary" />
                     {user.dusun || "Dusun (N/A)"}, RT {user.rt || "(N/A)"} / RW {user.rw || "(N/A)"}
                   </span>
                 </div>
               )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-lg bg-amber-50/10 dark:bg-amber-900/10 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
              <KeyRound className="w-5 h-5" />
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
