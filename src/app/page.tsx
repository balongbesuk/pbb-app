import { getVillageConfig } from "@/app/actions/settings-actions";
import { PublicSearch } from "@/components/public/public-search";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { PublicThemeWrapper } from "@/components/public/public-theme-wrapper";
import { PublicModeToggle } from "@/components/public/public-mode-toggle";

// Always fetch fresh data (logo, village name, etc) on every request
export const dynamic = "force-dynamic";

export default async function IndexPage() {
  const config = await getVillageConfig();
  const namaDesa = config?.namaDesa || "Belum Diatur";
  const tahunPajak = config?.tahunPajak || new Date().getFullYear();
  const kecamatan = config?.kecamatan || "";
  const kabupaten = config?.kabupaten || "";

  return (
    // PublicThemeWrapper itself IS the background — it has inline style with backgroundImage
    // No separate wrapper div needed
    <PublicThemeWrapper className="relative flex flex-col items-center pt-24 pb-12 px-6 sm:px-10 font-sans">
      <nav className="fixed top-0 w-full p-4 sm:p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-white/20">
            {config?.logoUrl ? (
              <Image
                src={`${config.logoUrl}?v=${Date.now()}`}
                alt={`Logo ${namaDesa}`}
                width={44}
                height={44}
                className="h-full w-full object-contain p-1"
                unoptimized
              />
            ) : (
              <div className="w-full h-full rounded-2xl flex items-center justify-center font-black text-xs" style={{background: "var(--primary)", color: "var(--primary-foreground)"}}>
                M
              </div>
            )}
          </div>
          <div>
            <span className="public-nav-name block text-base font-black leading-tight tracking-tight">
              Desa {namaDesa}
            </span>
            {kecamatan && kabupaten && (
              <span className="public-nav-sub block text-[11px] font-medium opacity-60">
                Kec. {kecamatan}, Kab. {kabupaten}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PublicModeToggle />
          <Link
            href="/login"
            className="public-cta-btn group flex items-center gap-2 text-white px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
          >
            Masuk Admin
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </nav>

      <main className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center gap-12 mt-12 sm:mt-20">
        <div className="text-center space-y-4 max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
          <div className="public-badge inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2">
             <MapPin className="w-3.5 h-3.5" />
             <span className="text-[10px] font-black tracking-widest uppercase">Portal Pajak Bumi dan Bangunan</span>
          </div>
          <h1 className="public-heading text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1]">
            Cek Tagihan &amp; Bayar <span className="public-heading-accent block sm:inline mt-1 sm:mt-0 px-2 bg-clip-text text-transparent pb-2 font-black">PBB</span> Lebih Mudah.
          </h1>
          <p className="public-subtext text-base sm:text-lg font-medium">
            Sistem Informasi Pelayanan Pajak Desa {namaDesa}, Kecamatan {kecamatan}, {kabupaten}. Cukup ketik nama atau NOP Anda.
          </p>
        </div>

        <div className="w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 fill-mode-both">
          <PublicSearch tahunPajak={tahunPajak} />
        </div>
      </main>

      <footer className="mt-auto pt-24 text-center pb-6 opacity-60 hover:opacity-100 transition-opacity">
        <p className="public-footer-text text-xs font-bold uppercase tracking-widest mb-1.5">PBB Manager &copy; {new Date().getFullYear()}</p>
        <p className="public-footer-text text-[10px] font-medium">Pemerintah Desa {namaDesa}</p>
      </footer>
    </PublicThemeWrapper>
  );
}
