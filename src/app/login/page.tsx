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
import Image from "next/image";
import { PublicThemeWrapper } from "@/components/public/public-theme-wrapper";
import { PublicModeToggle } from "@/components/public/public-mode-toggle";
import { usePublicThemeContext } from "@/components/public/public-theme-provider";

// Outer page: provides the PublicThemeProvider via PublicThemeWrapper
export default function LoginPage() {
  return (
    <PublicThemeWrapper>
      <LoginForm />
    </PublicThemeWrapper>
  );
}

// Inner form: can safely consume usePublicThemeContext
function LoginForm() {
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
  const { theme } = usePublicThemeContext();
  const isDark = theme === "dark";

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

  /** Convert "BALONGBESUK" → "Balongbesuk" */
  const toTitleCase = (str: string) =>
    str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const displayName = village.namaDesa
    ? `Desa ${toTitleCase(village.namaDesa)}`
    : "PBB Manager";

  const subName = village.kecamatan && village.kabupaten
    ? `Kec. ${toTitleCase(village.kecamatan)}, Kab. ${toTitleCase(village.kabupaten)}`
    : "Sistem Manajemen Pajak Bumi & Bangunan";

  // Dynamic color classes based on theme — hardcoded to avoid CSS variable cascade issues from next-themes
  const cardBg = isDark
    ? "bg-[#0A192F]/60 border-white/5 backdrop-blur-xl shadow-[#02060D]/60"
    : "bg-white border-zinc-200 shadow-zinc-300/60";
  const cardHeaderBg = isDark
    ? "bg-[#0F203B]/80 border-white/5"
    : "bg-zinc-50 border-zinc-100";
  const inputCls = isDark
    ? "border-white/10 bg-[#050B14] text-blue-50 focus:border-blue-500/50 focus:bg-[#050B14]/80 placeholder:text-blue-200/20"
    : "border-zinc-300 bg-white text-zinc-900 focus:border-blue-400 focus:bg-white placeholder:text-zinc-400";
  const cardFooterBorder = isDark ? "border-white/5" : "border-zinc-100";
  const backBtnCls = isDark
    ? "bg-[#0A192F]/50 text-blue-100 border-white/10 hover:bg-[#0A192F] hover:text-blue-50"
    : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900";
  const ringColor = isDark ? "ring-zinc-800" : "ring-zinc-200";
  const logoCardBorder = isDark
    ? "ring-white/10 border-white/10 bg-[#0A192F]"
    : "ring-zinc-100 bg-white border-zinc-100";
  const featureBadgeCls = isDark
    ? "bg-blue-500/10 border-blue-900/50 text-blue-300"
    : "bg-blue-50 border-blue-100 text-blue-700";
  const gridOpacity = isDark ? "opacity-[0.03]" : "opacity-[0.02]";
  const blob1Bg = isDark ? "bg-blue-500/10" : "bg-blue-300/20";
  const nameCls = isDark ? "text-white" : "text-zinc-900";
  const mutedCls = isDark ? "text-blue-200/60" : "text-zinc-500";
  const subtitleCls = isDark ? "text-blue-200/70" : "text-zinc-600";
  const submitBtnCls = isDark
    ? "bg-blue-600 hover:bg-blue-700 text-white"
    : "bg-zinc-900 hover:bg-zinc-800 text-white";
  const labelCls = isDark ? "text-blue-200/70" : "text-zinc-600";


  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* ─── Ambient background blobs ───────────────────────────────────── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className={`absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full blur-[120px] ${blob1Bg}`} />
        <div className="absolute -right-40 -bottom-40 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <svg className={`absolute inset-0 h-full w-full ${gridOpacity}`} xmlns="http://www.w3.org/2000/svg">
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
          <div className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl shadow-md ring-1 ${ringColor} bg-white`}>
            {village.logoUrl ? (
              <Image src={`${village.logoUrl}?v=1`} alt="Logo Desa" width={48} height={48} className="h-full w-full object-contain p-1" unoptimized />
            ) : (
              <Building2 className="text-primary h-6 w-6" />
            )}
          </div>
          <div>
            <span className={`block text-lg font-black leading-tight tracking-tight ${nameCls}`}>
              {displayName}
            </span>
            {village.kecamatan && (
              <span className={`block text-xs font-medium ${mutedCls}`}>
                {subName}
              </span>
            )}
          </div>
        </div>

        {/* Center content */}
        <div className="space-y-8">
          {/* Large decorative logo */}
          <div className={`inline-flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border shadow-md ${logoCardBorder}`}>
            {village.logoUrl ? (
              <Image src={`${village.logoUrl}?v=1`} alt="Logo Desa" width={112} height={112} className="h-full w-full object-contain p-3" unoptimized />
            ) : (
              <Building2 className="text-primary h-14 w-14" />
            )}
          </div>

          <div className="space-y-3">
            <h1 className={`text-4xl font-black leading-tight tracking-tighter ${nameCls}`}>
              Sistem Manajemen
              <br />
              <span className="text-primary">Pajak Bumi</span> &amp;
              <br />
              Bangunan
            </h1>
            <p className={`max-w-sm text-base leading-relaxed ${subtitleCls}`}>
              Platform terintegrasi untuk penarikan, pemantauan, dan pelaporan PBB tingkat desa secara real-time.
            </p>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-2">
            {["Multi-pengguna", "Laporan Excel", "Alokasi Otomatis", "Audit Log"].map((f) => (
              <span key={f} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${featureBadgeCls}`}>
                <ShieldCheck className="h-3 w-3" />
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className={`text-xs opacity-50 ${nameCls}`}>
          &copy; {new Date().getFullYear()} Pemerintah Desa {village.namaDesa || ""}. All rights reserved.
        </p>
      </div>

      {/* ─── Right panel — login form ────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-6 lg:p-16">
        
        {/* Back to Portal + Theme Toggle */}
        <div className="absolute top-6 right-6 lg:top-10 lg:right-10 z-20 flex items-center gap-3">
          <PublicModeToggle />
          <Link
            href="/"
            className={`group flex items-center gap-2 backdrop-blur-md px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest border shadow-sm hover:scale-105 active:scale-95 transition-all ${backBtnCls}`}
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Portal Warga
          </Link>
        </div>

        {/* Card */}
        <div className={`w-full max-w-[420px] overflow-hidden rounded-3xl border shadow-xl relative ${cardBg}`}>
          {/* Card Header strip */}
          <div className={`border-b px-8 pt-8 pb-6 ${cardHeaderBg}`}>
            {/* Mobile logo */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white shadow ring-1 ${ringColor}`}>
                {village.logoUrl ? (
                  <Image src={`${village.logoUrl}?v=1`} alt="Logo Desa" width={36} height={36} className="h-full w-full object-contain p-0.5" unoptimized />
                ) : (
                  <Building2 className="text-primary h-5 w-5" />
                )}
              </div>
              <span className={`text-base font-black tracking-tight ${nameCls}`}>
                {displayName}
              </span>
            </div>

            <h2 className={`text-2xl font-black tracking-tight ${nameCls}`}>Masuk ke Sistem</h2>
            <p className={`mt-1 text-sm font-medium ${subtitleCls}`}>
              Masukkan kredensial Anda untuk melanjutkan
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 px-8 py-7">
            <div className="space-y-2">
              <Label htmlFor="username" className={`text-xs font-black tracking-widest uppercase ${labelCls}`}>
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
                  className={`h-12 rounded-xl pl-10 text-sm font-medium transition-all duration-200 ${inputCls}`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className={`text-xs font-black tracking-widest uppercase ${labelCls}`}>
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
                  className={`h-12 rounded-xl pr-12 pl-10 text-sm font-medium transition-all duration-200 ${inputCls}`}
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim()}
              className={`mt-2 h-12 w-full rounded-xl font-bold shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-60 ${submitBtnCls}`}
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
          <div className={`border-t px-8 py-5 relative z-10 ${cardFooterBorder}`}>
            <p className={`text-center text-xs leading-relaxed opacity-50 ${mutedCls}`}>
              Sistem ini hanya untuk pengguna yang berwenang.
              <br />
              Akses tidak sah akan dicatat dan dilaporkan.
            </p>
          </div>
        </div>

        {/* Mobile footer */}
        <p className={`absolute bottom-6 text-center text-xs lg:hidden opacity-40 ${nameCls}`}>
          &copy; {new Date().getFullYear()} Pemerintah Desa {village.namaDesa || ""}. All rights reserved.
        </p>
      </div>
    </div>
  );
}
