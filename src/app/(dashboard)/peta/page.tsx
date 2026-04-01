"use client";

import { RegionMap } from "@/components/map/region-map";
import { MapPin, Layers, Satellite } from "lucide-react";
import { useEffect, useState } from "react";

export default function PetaPage() {
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [mapConfig, setMapConfig] = useState<{
    center: [number, number];
    zoom: number;
  }>({ center: [-7.5744, 112.235], zoom: 15 });

  useEffect(() => {
    fetch("/api/village-config")
      .then((r) => r.json())
      .then((d) => {
        if (d.mapCenterLat && d.mapCenterLng) {
          setMapConfig({
            center: [d.mapCenterLat, d.mapCenterLng],
            zoom: d.mapDefaultZoom || 15,
          });
        }
        if (d.tahunPajak) {
          setTahun(d.tahunPajak);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <div className="rounded-xl bg-emerald-500/10 p-2">
              <MapPin className="h-6 w-6 text-emerald-600" />
            </div>
            Peta Wilayah
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Visualisasi peta heatmap pembayaran PBB per wilayah tahun{" "}
            <span className="font-bold text-emerald-600">{tahun}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Layers className="h-4 w-4" />
          <span>RT • RW • Dusun • Desa</span>
        </div>
      </div>

      {/* Map Container - Full Width */}
      <div className="relative w-full overflow-hidden rounded-3xl border border-border bg-white shadow-lg dark:bg-zinc-950" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
        <RegionMap
          tahun={tahun}
          center={mapConfig.center}
          zoom={mapConfig.zoom}
        />
      </div>
    </div>
  );
}
