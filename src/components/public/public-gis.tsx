"use client";

import { useEffect, useState } from "react";
import { RegionMap } from "@/components/map/region-map";
import { Loader2, Map as MapIcon, Layers, Maximize, MousePointer2 } from "lucide-react";

interface PublicGisProps {
  tahunPajak: number;
}

export function PublicGis({ tahunPajak }: PublicGisProps) {
  const [mapConfig, setMapConfig] = useState<{
    center: [number, number];
    zoom: number;
    showUnpaidGis: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/village-config")
      .then((r) => r.json())
      .then((d) => {
        if (d.mapCenterLat && d.mapCenterLng) {
          setMapConfig({
            center: [d.mapCenterLat, d.mapCenterLng],
            zoom: d.mapDefaultZoom || 15,
            showUnpaidGis: !!d.showUnpaidDetailsGis,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[600px] flex flex-col items-center justify-center gap-4 bg-black/20 backdrop-blur-xl rounded-[2.5rem] border border-white/10">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-sm font-bold text-blue-400/60 uppercase tracking-widest animate-pulse">Menyiapkan Peta Desa...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-700">
      <div className="relative w-full h-[650px] overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 shadow-2xl backdrop-blur-sm">


        <RegionMap
          tahun={tahunPajak}
          center={mapConfig?.center}
          zoom={mapConfig?.zoom}
          isPublic={true}
          showUnpaidDetailsGis={mapConfig?.showUnpaidGis}
        />

        {/* Floating Guide */}
        <div className="absolute bottom-10 left-6 z-[1000] max-w-[200px] hidden lg:block">
            <div className="bg-white/95 dark:bg-[#050505] backdrop-blur-md p-4 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl space-y-3">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <MousePointer2 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Panduan</span>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-600 dark:text-white/60 font-medium italic">
                    Arahkan kursor atau klik pada wilayah tertentu untuk melihat persentase pembayaran pajak secara transparan.
                </p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Layers, label: "Multi-Layer", desc: "Tampilan RT, RW, hingga Dusun" },
          { icon: Maximize, label: "Presisi Tinggi", desc: "Batas wilayah sesuai koordinat GPS" },
          { icon: MapIcon, label: "Heatmap", desc: "Warna gradasi sesuai tingkat pelunasan" }
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-3xl shadow-md dark:shadow-none backdrop-blur-md transition-all hover:bg-slate-50 dark:hover:bg-white/10">
            <div className="p-3 bg-blue-600/15 dark:bg-blue-500/10 rounded-2xl">
              <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{item.label}</p>
              <p className="text-[10px] font-semibold text-slate-600 dark:text-white/50">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
