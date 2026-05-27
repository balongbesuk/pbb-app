import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, MapPin } from "lucide-react";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { Badge } from "@/components/ui/badge";
import { ProfileAvatarCard } from "@/components/settings/profile-avatar-card";
import { SignatureUpload } from "@/components/settings/signature-upload";
import { EditableProfileRow } from "@/components/settings/editable-profile-row";
import { User as UserIcon } from "lucide-react";
import type { AppUser } from "@/types/app";
import { formatSignatureUrl } from "@/lib/utils";


export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return <div>Sesi tidak valid. Silakan login kembali.</div>;
  }

  const currentUser = session.user as AppUser | undefined;
  if (!currentUser?.id) {
    return <div>Data sesi pengguna tidak lengkap.</div>;
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
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
      signatureUrl: true,
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Kolom Kiri: Tampilan Profil & TTD */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="glass border-none shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="uppercase tracking-tight text-lg">Foto Profil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="mb-4">
                <ProfileAvatarCard
                  name={user.name}
                  username={user.username}
                  avatarUrl={user.avatarUrl ?? null}
                />
              </div>
              <Badge variant="outline" className="uppercase tracking-widest text-[10px] mb-6">
                {user.role}
              </Badge>

              <div className="w-full pt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col items-center">
                <h3 className="text-sm font-bold tracking-tight mb-4 uppercase">Tanda Tangan Digital</h3>
                <SignatureUpload initialSignatureUrl={formatSignatureUrl(user.signatureUrl)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Data Pribadi & Keamanan */}
        <div className="space-y-6 lg:col-span-8">
          {/* Informasi Pengguna */}
          <Card className="glass border-none shadow-lg">
            <CardHeader>
              <CardTitle className="uppercase tracking-tight flex items-center gap-2 text-lg">
                <UserIcon className="h-5 w-5 text-primary" />
                Informasi Pribadi
              </CardTitle>
              <CardDescription>Sesuaikan data profil dan kontak Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1 divide-y divide-zinc-50 border-t border-zinc-100 dark:divide-zinc-900 dark:border-zinc-800">
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

                {/* Area Tugas (Read-only) */}
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
                Arahkan ke baris data atau klik ikon edit untuk mengubahnya.
              </p>
            </CardContent>
          </Card>

          {/* Keamanan Password */}
          <Card className="glass border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-tight">
                <KeyRound className="h-5 w-5 text-primary" />
                Keamanan Password
              </CardTitle>
              <CardDescription>
                Ubah kata sandi Anda secara berkala untuk menjaga keamanan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
