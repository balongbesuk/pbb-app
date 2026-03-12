"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldAlert, Eye, EyeOff, KeyRound, CheckCircle } from "lucide-react";
import { changeOwnPassword } from "@/app/actions/profile-actions";
import { toast } from "sonner";

export default function GantiPasswordPage() {
  const { update: updateSession } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const oldPass = formData.get("oldPassword") as string;
    const newPass = formData.get("newPassword") as string;
    const confirmPass = formData.get("confirmPassword") as string;

    if (newPass !== confirmPass) {
      toast.error("Password baru dan konfirmasi tidak cocok");
      setLoading(false);
      return;
    }

    if (newPass.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      setLoading(false);
      return;
    }

    if (newPass === oldPass) {
      toast.error("Password baru tidak boleh sama dengan password lama");
      setLoading(false);
      return;
    }

    const result = await changeOwnPassword(oldPass, newPass);
    if (result.success) {
      setSuccess(true);
      toast.success("Password berhasil diubah!");
      // Refresh data rute dulu
      router.refresh();
      // Refresh session agar mustChangePassword terupdate di JWT
      await updateSession();
      
      // Redirect ke dashboard setelah delay singkat agar user sempat melihat pesan sukses
      setTimeout(() => {
        // Gunakan window.location.href sebagai fallback jika router.push stuck
        window.location.href = "/dashboard";
      }, 1500);
    } else {
      toast.error(`Gagal: ${result.message}`);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 dark:from-zinc-950 dark:to-zinc-900">
        <Card className="w-full max-w-md rounded-3xl border-emerald-200 bg-white shadow-2xl dark:border-emerald-900 dark:bg-zinc-950">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              Password Berhasil Diubah!
            </h2>
            <p className="text-sm text-muted-foreground">
              Mengalihkan ke dashboard...
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 dark:from-zinc-950 dark:to-zinc-900">
      <Card className="w-full max-w-md rounded-3xl border-amber-200 bg-white shadow-2xl dark:border-amber-900 dark:bg-zinc-950">
        <CardHeader className="space-y-4 pb-2 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
            <ShieldAlert className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Ganti Password Anda
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Demi keamanan, Anda <strong className="text-foreground">wajib mengganti password default</strong> sebelum dapat mengakses sistem.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-2">
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Password Lama */}
            <div className="space-y-2">
              <Label htmlFor="oldPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password Saat Ini
              </Label>
              <div className="relative">
                <Input
                  id="oldPassword"
                  name="oldPassword"
                  type={showOldPass ? "text" : "password"}
                  placeholder="Masukkan password default..."
                  required
                  className="h-12 rounded-2xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="text-muted-foreground hover:text-foreground absolute top-3.5 right-3 focus:outline-none"
                >
                  {showOldPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Baru */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password Baru
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPass ? "text" : "password"}
                  placeholder="Minimal 6 karakter..."
                  required
                  minLength={6}
                  className="h-12 rounded-2xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="text-muted-foreground hover:text-foreground absolute top-3.5 right-3 focus:outline-none"
                >
                  {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Konfirmasi */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Konfirmasi Password Baru
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPass ? "text" : "password"}
                  placeholder="Ketik ulang password baru..."
                  required
                  minLength={6}
                  className="h-12 rounded-2xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="text-muted-foreground hover:text-foreground absolute top-3.5 right-3 focus:outline-none"
                >
                  {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-2xl text-sm font-bold shadow-lg"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-5 w-5" />
              )}
              Ubah Password & Lanjutkan
            </Button>
          </form>

          <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
            <p className="text-[11px] font-medium leading-relaxed text-amber-700 dark:text-amber-400">
              <strong>Tips keamanan:</strong> Gunakan kombinasi huruf besar, huruf kecil, dan angka. Jangan gunakan informasi pribadi seperti nama atau tanggal lahir.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
