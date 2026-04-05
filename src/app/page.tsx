import { getVillageConfig } from "@/app/actions/settings-actions";
import { toTitleCase } from "@/lib/utils";
import { PublicTabs } from "@/components/public/public-tabs";
import { Github, MapPin } from "lucide-react";
import { PublicThemeWrapper } from "@/components/public/public-theme-wrapper";
import { PublicNav } from "@/components/public/public-nav";
import "./public.css";


// Enable caching with revalidation every 30 seconds to support BFCache
export const revalidate = 30;




export default async function IndexPage() {
  const config = await getVillageConfig();
  const rawNamaDesa = config?.namaDesa || "";
  const namaDesa = rawNamaDesa ? toTitleCase(rawNamaDesa) : "";
  const tahunPajak = config?.tahunPajak || new Date().getFullYear();
  const kecamatan = config?.kecamatan ? toTitleCase(config.kecamatan) : "";
  const kabupaten = config?.kabupaten ? toTitleCase(config.kabupaten) : "";

  return (
    // PublicThemeWrapper itself IS the background — it has inline style with backgroundImage
    // No separate wrapper div needed
    <PublicThemeWrapper className="relative flex flex-col items-center pt-32 pb-12 px-6 sm:px-10 font-sans">
      <PublicNav 
        namaDesa={namaDesa}
        kecamatan={kecamatan}
        kabupaten={kabupaten}
        logoUrl={config?.logoUrl || null}
      />

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
            {namaDesa 
              ? `Sistem Informasi Pelayanan Pajak Desa ${namaDesa}, Kecamatan ${kecamatan}, ${kabupaten}.` 
              : "Sistem Informasi Pelayanan Pajak Bumi dan Bangunan (PBB Manager)."} Cukup ketik nama atau NOP Anda.
          </p>
        </div>

        <div className="w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 fill-mode-both">
          <PublicTabs 
            tahunPajak={tahunPajak} 
            showNominalPajak={config?.showNominalPajak || false}
            enablePublicGis={config?.enablePublicGis ?? true}
          />
        </div>
      </main>

      <footer className="mt-auto pt-24 text-center pb-8 opacity-60 hover:opacity-100 transition-opacity">
        <p className="public-footer-text text-xs font-bold uppercase tracking-widest mb-1.5">PBB Manager &copy; {new Date().getFullYear()}</p>
        <p className="public-footer-text text-[10px] font-medium mb-3">{namaDesa ? `Pemerintah Desa ${namaDesa}` : "PBB Manager"}</p>
        <div className="flex justify-center mt-3">
          <a
            href="https://github.com/balongbesuk/pbb-app"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-40 hover:opacity-100"
            title="GitHub Repository"
          >
            <Github className="w-5 h-5 text-foreground" />
          </a>
        </div>
      </footer>
    </PublicThemeWrapper>
  );
}
