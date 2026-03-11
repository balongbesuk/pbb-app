import { getVillageConfig } from "@/app/actions/settings-actions";
import { PublicSearch } from "@/components/public/public-search";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { PublicThemeWrapper } from "@/components/public/public-theme-wrapper";
import { PublicModeToggle } from "@/components/public/public-mode-toggle";

export default async function IndexPage() {
  const config = await getVillageConfig();
  const namaDesa = config?.namaDesa || "Belum Diatur";
  const tahunPajak = config?.tahunPajak || new Date().getFullYear();
  const kecamatan = config?.kecamatan || "";
  const kabupaten = config?.kabupaten || "";

  return (
    <PublicThemeWrapper>
      <div className="relative min-h-screen gradient-bg text-foreground public-public-dark:bg-[#050B14] public-public-dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] public-public-dark:from-[#0F203B] public-public-dark:via-[#050B14] public-public-dark:to-[#02060D] flex flex-col items-center pt-24 pb-12 px-6 sm:px-10 font-sans selection:bg-primary/20 public-public-dark:selection:bg-blue-500/30 transition-colors duration-500">
      <nav className="fixed top-0 w-full p-4 sm:p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-3 bg-white/50 public-public-dark:bg-[#0A192F]/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/40 public-public-dark:border-white/10 shadow-sm transition hover:shadow-md">
          {config?.logoUrl ? (
            <Image
              src={config.logoUrl}
              alt={`Logo ${namaDesa}`}
              width={28}
              height={28}
              className="object-contain"
            />
          ) : (
            <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-black text-xs">
              M
            </div>
          )}
          <span className="font-bold text-sm tracking-tight text-zinc-900 public-public-dark:text-blue-50">
            {namaDesa}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <PublicModeToggle />
          <Link
            href="/login"
            className="group flex items-center gap-2 bg-zinc-900 public-public-dark:bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg shadow-zinc-900/20 public-public-dark:shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all hover:bg-zinc-800 public-public-dark:hover:bg-blue-500"
          >
            Masuk Admin
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </nav>

      <main className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center gap-12 mt-12 sm:mt-20">
        <div className="text-center space-y-4 max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 public-public-dark:bg-blue-500/20 text-primary public-public-dark:text-blue-300 mb-2">
             <MapPin className="w-3.5 h-3.5" />
             <span className="text-[10px] font-black tracking-widest uppercase">Portal Pajak Bumi dan Bangunan</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 public-public-dark:text-white tracking-tight leading-[1.1]">
            Cek Tagihan & Bayar <span className="block sm:inline mt-1 sm:mt-0 px-2 bg-gradient-to-r from-emerald-500 to-teal-600 public-public-dark:from-blue-400 public-public-dark:to-emerald-400 bg-clip-text text-transparent pb-2 font-black">PBB</span> Lebih Mudah.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground/80 public-public-dark:text-blue-200/60 font-medium">
            Sistem Informasi Pelayanan Pajak Desa {namaDesa}, Kecamatan {kecamatan}, {kabupaten}. Cukup ketik nama atau NOP Anda.
          </p>
        </div>

        <div className="w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 fill-mode-both">
          <PublicSearch tahunPajak={tahunPajak} />
        </div>
      </main>

      <footer className="mt-auto pt-24 text-center pb-6 opacity-60 hover:opacity-100 transition-opacity text-muted-foreground public-public-dark:text-blue-200/50">
        <p className="text-xs font-bold uppercase tracking-widest mb-1.5"><span className="text-primary public-public-dark:text-blue-400">PBB Manager</span> &copy; {new Date().getFullYear()}</p>
        <p className="text-[10px] font-medium">Pemerintah Desa {namaDesa}</p>
      </footer>
    </div>
    </PublicThemeWrapper>
  );
}
