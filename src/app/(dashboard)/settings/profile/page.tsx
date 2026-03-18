import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, KeyRound, MapPin } from "lucide-react";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { Badge } from "@/components/ui/badge";
import { ProfileAvatarCard } from "@/components/settings/profile-avatar-card";
import { EditableProfileRow } from "@/components/settings/editable-profile-row";
import { Phone, Mail, User as UserIcon } from "lucide-react";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return <div>Sesi tidak valid. Silakan login kembali.</div>;
  }

  if ((session.user as any).role === "PENARIK") {
    redirect("/data-pajak");
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id as string },
    select: {
      name: true,
      username: true,
      email: true,
      phoneNumber: true,
      role: true,
      dusun: true,
      rt: true,
      rw: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    return <div>Data pengguna tidak ditemukan.</div>;
  }

  const userData = {
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <UserIcon className="text-primary h-8 w-8" />
            Profil Akun Saya
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola informasi pribadi dan keamanan akun Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Kartu Informasi + Foto Profil */}
        <Card className="glass border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between uppercase tracking-tight">
              Informasi Pengguna
              <Badge variant="outline" className="ml-2 uppercase">
                {user.role}
              </Badge>
            </CardTitle>
            <CardDescription>Detail profil dan area tugas Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload Section */}
            <div className="pb-4">
              <ProfileAvatarCard
                name={user.name}
                username={user.username}
                avatarUrl={user.avatarUrl ?? null}
              />
            </div>

            <div className="space-y-1 divide-y divide-zinc-50 border-t border-zinc-100 dark:divide-zinc-900 dark:border-zinc-800">
              {/* Field Editable (Inline Edit) */}
              <EditableProfileRow 
                label="Nama Lengkap" 
                value={user.name} 
                fieldName="name" 
                iconName="user" 
                userData={userData}
              />
              
              <EditableProfileRow 
                label="Alamat Email" 
                value={user.email} 
                fieldName="email" 
                iconName="mail" 
                userData={userData}
              />
              
              <EditableProfileRow 
                label="Nomor HP / WhatsApp" 
                value={user.phoneNumber} 
                fieldName="phoneNumber" 
                iconName="phone" 
                userData={userData}
              />

              {/* Area Tugas (Read-only, assigned by Admin) */}
              <div className="flex items-center justify-between py-3">
                <div className="flex-1 space-y-1">
                   <span className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                    <MapPin className="h-3 w-3 text-primary/60" />
                    Area Penugasan Pajak
                  </span>
                  <p className="text-foreground text-sm font-bold tracking-tight">
                    {user.role === "PENARIK" 
                      ? `${user.dusun || "Dusun (N/A)"}, RT ${user.rt || "(N/A)"}/${user.rw || "(N/A)"}`
                      : "Seluruh Area Desa"}
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-muted-foreground/40 text-center text-[10px] font-medium italic">
              Arahkan ke baris atau klik icon edit untuk mengubah data.
            </p>
          </CardContent>
        </Card>

        {/* Keamanan Password */}
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
