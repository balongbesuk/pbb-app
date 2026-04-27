"use client";

import { FilePlus2, FileText } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PublicSelfServiceProps {
  isDark?: boolean;
}

export function PublicSelfService({ isDark = false }: PublicSelfServiceProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 fill-mode-both">
      <div className="flex items-center gap-4 w-full">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Layanan Mandiri</span>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-primary/20 to-transparent" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full px-4">
        <Link
          href="/pengajuan"
          className="group flex items-center gap-4 p-4 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/20 transition-all hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98] text-left w-full"
          title="Pengajuan SPPT PBB Baru"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FilePlus2 className="w-6 h-6 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-widest text-primary">Pengajuan Baru</p>
            <p className="text-[10px] font-medium opacity-50 group-hover:opacity-80 transition-opacity">Daftarkan Objek Pajak Baru</p>
          </div>
        </Link>

        <Link
          href="/spop"
          className="group flex items-center gap-4 p-4 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/20 transition-all hover:shadow-2xl hover:shadow-amber-500/5 active:scale-[0.98] text-left w-full"
          title="Isi Formulir SPOP / LSPOP"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-amber-500" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-widest text-amber-500">Mutasi / SPOP</p>
            <p className="text-[10px] font-medium opacity-50 group-hover:opacity-80 transition-opacity">Form SPOP / LSPOP Mandiri</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
