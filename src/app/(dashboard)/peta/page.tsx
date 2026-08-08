"use client";

import dynamic from "next/dynamic";
const RegionMap = dynamic(() => import("@/components/map/region-map").then((mod) => mod.RegionMap), { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center bg-white dark:bg-zinc-950 rounded-3xl"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div> });
import { MapPin, Layers, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PetaPage() {
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [mapConfig, setMapConfig] = useState<{
    center: [number, number];
    zoom: number;
  }>({ center: [-7.5744, 112.235], zoom: 16 });
  const [showUnpaidGis, setShowUnpaidGis] = useState(false);

  useEffect(() => {
    fetch("/api/village-config")
      .then((r) => r.json())
      .then((d) => {
        if (d.mapCenterLat && d.mapCenterLng) {
          setMapConfig({
            center: [d.mapCenterLat, d.mapCenterLng],
            zoom: d.mapDefaultZoom || 16,
          });
        }
        if (d.tahunPajak) {
          setTahun(d.tahunPajak);
        }
        setShowUnpaidGis(!!d.showUnpaidDetailsGis);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <div className="rounded-xl bg-emerald-500/10 p-2">
              <MapPin className="h-6 w-6 text-emerald-600" />
            </div>
            Peta Wilayah
          </h1>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-1.5 flex-wrap">
            Visualisasi peta heatmap pembayaran PBB per wilayah tahun{" "}
            <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
              {tahun}
            </span>.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Year Selector */}
          <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-900 p-2 px-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <Label htmlFor="map-year-select" className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-zinc-400 whitespace-nowrap">
              Tahun Data:
            </Label>
            <Input
              id="map-year-select"
              type="number"
              value={tahun}
              onChange={(e) => setTahun(parseInt(e.target.value) || new Date().getFullYear())}
              className="h-8 w-20 bg-slate-50 dark:bg-zinc-950 font-black text-center border-slate-200 dark:border-zinc-700 shadow-inner rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-slate-100 dark:bg-zinc-900 px-3.5 py-2.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800">
            <Layers className="h-4 w-4 text-slate-500" />
            <span>RT • RW • Dusun • Desa</span>
          </div>
        </div>
      </div>

      {/* Map Container - Full Width */}
      <div className="relative w-full overflow-hidden rounded-3xl border border-border bg-white shadow-lg dark:bg-zinc-950" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
        <RegionMap
          tahun={tahun}
          center={mapConfig.center}
          zoom={mapConfig.zoom}
          showUnpaidDetailsGis={showUnpaidGis}
        />
      </div>
    </div>
  );
}
