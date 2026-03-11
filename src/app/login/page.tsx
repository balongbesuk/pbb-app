"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Lock, User, Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PublicThemeWrapper } from "@/components/public/public-theme-wrapper";
import { PublicModeToggle } from "@/components/public/public-mode-toggle";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [village, setVillage] = useState<{
    namaDesa: string;
    kecamatan: string;
    kabupaten: string;
    logoUrl: string | null;
  }>({ namaDesa: "", kecamatan: "", kabupaten: "", logoUrl: null });
  const router = useRouter();

  useEffect(() => {
    fetch("/api/village-config")
      .then((r) => r.json())
      .then((d) => setVillage(d))
      .catch(() => {});
  }, []);

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

  const displayName = village.namaDesa
    ? `Desa ${village.namaDesa}`
    : "PBB Manager";

  const subName = village.kecamatan && village.kabupaten
    ? `Kec. ${village.kecamatan}, Kab. ${village.kabupaten}`
    : "Sistem Manajemen Pajak Bumi & Bangunan";

  return (
    <PublicThemeWrapper>
    <div className="text-foreground relative flex min-h-screen overflow-hidden gradient-bg public-dark:bg-[#050B14] public-dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] public-dark:from-[#0F203B] public-dark:via-[#050B14] public-dark:to-[#02060D] shadow-inner selection:bg-primary/20 public-dark:selection:bg-blue-500/30 transition-colors duration-500">
      {/* ─── Ambient background blobs ───────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        {/* Top-left glow */}
        <div className="bg-primary/10 absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full blur-[120px] public-dark:bg-blue-500/10" />
        {/* Bottom-right glow */}
        <div className="absolute -right-40 -bottom-40 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px] public-dark:bg-indigo-500/10" />
        {/* Center subtle grid texture */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.015] public-dark:opacity-[0.03]"
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
        {/* Logo + App name */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-zinc-100 public-dark:ring-zinc-800">
            {village.logoUrl ? (
              <Image
                src={`${village.logoUrl}?v=1`}
                alt="Logo Desa"
                width={48}
                height={48}
                className="h-full w-full object-contain p-1"
                unoptimized
              />
            ) : (
              <Building2 className="text-primary h-6 w-6" />
            )}
          </div>
          <div>
            <span className="text-foreground block text-lg font-black leading-tight tracking-tight">
              {displayName}
            </span>
            {village.kecamatan && (
              <span className="text-muted-foreground block text-xs font-medium">
                {subName}
              </span>
            )}
          </div>
        </div>

        {/* Center content */}
        <div className="space-y-8">
          {/* Large decorative logo */}
          <div className="inline-flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-md public-dark:border-white/10 public-dark:bg-[#0A192F]">
            {village.logoUrl ? (
              <Image
                src={`${village.logoUrl}?v=1`}
                alt="Logo Desa"
                width={112}
                height={112}
                className="h-full w-full object-contain p-3"
                unoptimized
              />
            ) : (
              <Building2 className="text-primary h-14 w-14" />
            )}
          </div>

          <div className="space-y-3">
            <h1 className="text-foreground text-4xl font-black leading-tight tracking-tighter">
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
                className="bg-primary/5 text-primary public-dark:bg-primary/10 inline-flex items-center gap-1.5 rounded-full border border-zinc-100 px-3 py-1 text-xs font-bold public-dark:border-zinc-800"
              >
                <ShieldCheck className="h-3 w-3" />
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-muted-foreground/50 text-xs">
          &copy; {new Date().getFullYear()} Pemerintah Desa {village.namaDesa || ""}. All rights reserved.
        </p>
      </div>

      {/* ─── Right panel — login form ────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-6 lg:p-16">
        
        {/* Back to Portal Button */}
        <div className="absolute top-6 right-6 lg:top-10 lg:right-10 z-20 flex items-center gap-3">
          <PublicModeToggle />
          <Link
            href="/"
            className="group flex items-center gap-2 bg-white/50 public-dark:bg-[#0A192F]/50 backdrop-blur-md text-zinc-600 public-dark:text-blue-100 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest border border-zinc-200 public-dark:border-white/10 shadow-sm hover:bg-white public-dark:hover:bg-[#0A192F] hover:text-primary public-dark:hover:text-blue-50 transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Portal Warga
          </Link>
        </div>

        {/* Card */}
        <div className="w-full max-w-[420px] overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-xl shadow-zinc-200/60 public-dark:border-white/5 public-dark:bg-[#0A192F]/60 public-dark:backdrop-blur-xl public-dark:shadow-[#02060D]/60 relative">
          {/* Card Header strip */}
          <div className="bg-primary/[0.03] border-b border-zinc-50 px-8 pt-8 pb-6 public-dark:border-white/5 public-dark:bg-[#0F203B]/80">
            {/* Mobile logo (shown only on mobile) */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white shadow ring-1 ring-zinc-100 public-dark:ring-white/10">
                {village.logoUrl ? (
                  <Image
                    src={`${village.logoUrl}?v=1`}
                    alt="Logo Desa"
                    width={36}
                    height={36}
                    className="h-full w-full object-contain p-0.5"
                    unoptimized
                  />
                ) : (
                  <Building2 className="text-primary h-5 w-5" />
                )}
              </div>
              <span className="text-foreground text-base font-black tracking-tight">
                {displayName}
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
                    "public-dark:border-white/10 public-dark:bg-[#050B14] public-dark:focus:bg-[#050B14]/80 public-dark:focus:border-blue-500/50 public-dark:text-blue-50",
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
                    "public-dark:border-white/10 public-dark:bg-[#050B14] public-dark:focus:bg-[#050B14]/80 public-dark:focus:border-blue-500/50 public-dark:text-blue-50",
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
          <div className="border-t border-zinc-50 px-8 py-5 public-dark:border-white/5 relative z-10">
            <p className="text-muted-foreground/50 text-center text-xs leading-relaxed">
              Sistem ini hanya untuk pengguna yang berwenang.
              <br />
              Akses tidak sah akan dicatat dan dilaporkan.
            </p>
          </div>
        </div>

        {/* Mobile footer */}
        <p className="text-muted-foreground/40 absolute bottom-6 text-center text-xs lg:hidden">
          &copy; {new Date().getFullYear()} Pemerintah Desa {village.namaDesa || ""}. All rights reserved.
        </p>
      </div>
    </div>
    </PublicThemeWrapper>
  );
}
