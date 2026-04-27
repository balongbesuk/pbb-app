import { getVillageConfig } from "@/app/actions/settings-actions";
import { toTitleCase } from "@/lib/utils";
import { PublicThemeWrapper } from "@/components/public/public-theme-wrapper";
import { PublicNav } from "@/components/public/public-nav";
import { FileText, ArrowLeft, Github } from "lucide-react";
import { SpopFormStandalone } from "@/components/public/spop-form-standalone";
import Link from "next/link";
import { Suspense } from "react";
import "../public.css";

export default async function SpopPage() {
  const config = await getVillageConfig();
  const rawNamaDesa = config?.namaDesa || "";
  const namaDesa = rawNamaDesa ? toTitleCase(rawNamaDesa) : "";
  const kecamatan = config?.kecamatan ? toTitleCase(config.kecamatan) : "";
  const kabupaten = config?.kabupaten ? toTitleCase(config.kabupaten) : "";

  return (
    <PublicThemeWrapper className="relative flex flex-col items-center pt-32 pb-12 px-6 sm:px-10 font-sans min-h-screen">
      <PublicNav 
        namaDesa={namaDesa}
        kecamatan={kecamatan}
        kabupaten={kabupaten}
        logoUrl={config?.logoUrl || null}
        updatedAt={config?.updatedAt}
      />

      <main className="w-full max-w-6xl flex-1 flex flex-col items-center gap-8 mt-12">
        <div className="w-full flex justify-start mb-4">
          <Link 
            href="/" 
            className="group flex items-center gap-2 backdrop-blur-md px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-primary/10 bg-primary/5 text-primary hover:bg-primary/10 hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </Link>
        </div>

        <div className="text-center space-y-4 max-w-2xl px-4">
          <div className="public-badge inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black tracking-widest uppercase">Layanan Mandiri</span>
          </div>
          <h1 className="public-heading text-4xl sm:text-5xl font-black tracking-tight leading-[1.1]">
            Isi Formulir <span className="public-heading-accent px-2 bg-clip-text text-transparent pb-2 font-black">SPOP / LSPOP</span>
          </h1>
          <p className="public-subtext text-base sm:text-lg font-medium">
            Formulir Tanya Jawab untuk pengajuan Mutasi, Koreksi, atau Pendaftaran Objek Pajak di wilayah Desa {namaDesa}.
          </p>
        </div>

        <div className="w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 fill-mode-both">
           <Suspense fallback={<div className="h-40 flex items-center justify-center opacity-40 uppercase font-black tracking-widest text-xs">Memuat Formulir...</div>}>
              <SpopFormStandalone />
           </Suspense>
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
