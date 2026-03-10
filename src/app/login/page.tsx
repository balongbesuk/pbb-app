"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Lock, User, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.status === 429) {
        toast.error("Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.", {
          duration: 8000,
        });
      } else if (result?.error) {
        toast.error("Username atau password salah");
      } else {
        toast.success("Login berhasil");
        router.push("/dashboard");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* ─── Ambient background blobs ───────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        {/* Top-left glow */}
        <div className="bg-primary/10 absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full blur-[120px] dark:bg-blue-500/10" />
        {/* Bottom-right glow */}
        <div className="absolute -right-40 -bottom-40 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-500/10" />
        {/* Center subtle grid texture */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.015] dark:opacity-[0.03]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* ─── Left panel — branding (hidden on mobile) ────────────────────── */}
      <div className="relative z-10 hidden flex-col justify-between p-12 lg:flex lg:w-[45%]">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-2xl shadow-md">
            <Building2 className="text-primary-foreground h-5 w-5" />
          </div>
          <span className="text-foreground text-lg font-black tracking-tight">PBB Manager</span>
        </div>

        {/* Center content */}
        <div className="space-y-8">
          {/* Large decorative icon */}
          <div className="bg-primary/5 dark:bg-primary/10 inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-zinc-100 shadow-sm dark:border-zinc-800">
            <Building2 className="text-primary h-10 w-10" />
          </div>

          <div className="space-y-3">
            <h1 className="text-foreground text-4xl font-black tracking-tighter leading-tight">
              Sistem Manajemen
              <br />
              <span className="text-primary">Pajak Bumi</span> &amp;
              <br />
              Bangunan
            </h1>
            <p className="text-muted-foreground max-w-sm text-base leading-relaxed">
              Platform terintegrasi untuk penarikan, pemantauan, dan pelaporan PBB tingkat
              desa secara real-time.
            </p>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-2">
            {[
              "Multi-pengguna",
              "Laporan Excel",
              "Alokasi Otomatis",
              "Audit Log",
            ].map((f) => (
              <span
                key={f}
                className="bg-primary/5 text-primary dark:bg-primary/10 inline-flex items-center gap-1.5 rounded-full border border-zinc-100 px-3 py-1 text-xs font-bold dark:border-zinc-800"
              >
                <ShieldCheck className="h-3 w-3" />
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-muted-foreground/50 text-xs">
          &copy; {new Date().getFullYear()} Pemerintah Desa. All rights reserved.
        </p>
      </div>

      {/* ─── Right panel — login form ────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-6 lg:p-16">
        {/* Card */}
        <div className="w-full max-w-[420px] overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-xl shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-zinc-900/60">
          {/* Card Header strip */}
          <div className="bg-primary/[0.03] border-b border-zinc-50 px-8 pt-8 pb-6 dark:border-zinc-800/50 dark:bg-white/[0.02]">
            {/* Mobile logo (shown only on mobile) */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-xl shadow">
                <Building2 className="text-primary-foreground h-4 w-4" />
              </div>
              <span className="text-foreground text-base font-black tracking-tight">
                PBB Manager
              </span>
            </div>

            <h2 className="text-foreground text-2xl font-black tracking-tight">Masuk ke Sistem</h2>
            <p className="text-muted-foreground mt-1 text-sm font-medium">
              Masukkan kredensial Anda untuk melanjutkan
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 px-8 py-7">
            {/* Username field */}
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-muted-foreground text-xs font-black tracking-widest uppercase"
              >
                Username
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                  <User className="text-muted-foreground/50 h-4 w-4" />
                </div>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder="Masukkan username..."
                  className={cn(
                    "h-12 rounded-xl border-zinc-200 bg-zinc-50 pl-10 text-sm font-medium",
                    "focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-offset-0",
                    "dark:border-zinc-800 dark:bg-zinc-900 dark:focus:bg-zinc-900/80",
                    "transition-all duration-200"
                  )}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-muted-foreground text-xs font-black tracking-widest uppercase"
              >
                Password
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                  <Lock className="text-muted-foreground/50 h-4 w-4" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn(
                    "h-12 rounded-xl border-zinc-200 bg-zinc-50 pr-12 pl-10 text-sm font-medium",
                    "focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-offset-0",
                    "dark:border-zinc-800 dark:bg-zinc-900 dark:focus:bg-zinc-900/80",
                    "transition-all duration-200"
                  )}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="text-muted-foreground/50 hover:text-muted-foreground absolute inset-y-0 right-3.5 flex items-center transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim()}
              className={cn(
                "shadow-primary/20 mt-2 h-12 w-full rounded-xl font-bold shadow-lg",
                "transition-all duration-200 hover:shadow-xl hover:shadow-primary/25",
                "disabled:opacity-60"
              )}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </span>
              ) : (
                "Masuk ke Sistem"
              )}
            </Button>
          </form>

          {/* Card footer */}
          <div className="border-t border-zinc-50 px-8 py-5 dark:border-zinc-800/50">
            <p className="text-muted-foreground/50 text-center text-xs leading-relaxed">
              Sistem ini hanya untuk pengguna yang berwenang.
              <br />
              Akses tidak sah akan dicatat dan dilaporkan.
            </p>
          </div>
        </div>

        {/* Mobile footer */}
        <p className="text-muted-foreground/40 absolute bottom-6 text-center text-xs lg:hidden">
          &copy; {new Date().getFullYear()} Pemerintah Desa. All rights reserved.
        </p>
      </div>
    </div>
  );
}
