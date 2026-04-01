"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Filter } from "lucide-react";
import "leaflet/dist/leaflet.css";

// CSS khusus untuk desain premium
const mapStyles = `
  .leaflet-interactive:focus {
    outline: none !important;
    box-shadow: none !important;
  }
  .leaflet-container :focus {
    outline: none !important;
    box-shadow: none !important;
  }
  .leaflet-popup-content-wrapper {
    border-radius: 20px !important;
    padding: 10px !important;
    box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
    border: 1px solid rgba(255,255,255,1) !important;
    background: rgba(255,255,255,0.95) !important;
    backdrop-blur: 10px !important;
  }
  .leaflet-popup-tip {
    background: rgba(255,255,255,0.95) !important;
  }
  .leaflet-tooltip {
    border-radius: 12px !important;
    border: none !important;
    box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
    padding: 8px 12px !important;
    font-weight: 700 !important;
    color: #1e293b !important;
  }
`;

// Lazy load MapContainer because it needs window
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), { ssr: false });
const Tooltip = dynamic(() => import("react-leaflet").then((mod) => mod.Tooltip), { ssr: false });

export function RegionMap({ 
  tahun = 2026, 
  center = [-7.5744, 112.235], 
  zoom = 15 
}: { 
  tahun?: number, 
  center?: [number, number], 
  zoom?: number 
}) {
  const [geoData, setGeoData] = useState<any>(null);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  
  // State untuk kontrol layer
  const [showRT, setShowRT] = useState(false);
  const [showRW, setShowRW] = useState(false);
  const [showDusun, setShowDusun] = useState(false);
  const [showDesa, setShowDesa] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [geoRes, statsRes] = await Promise.all([
          fetch(`/maps/village.json?v=${Date.now()}`, { cache: "no-store" }),
          fetch(`/api/region-stats?tahun=${tahun}`, { cache: "no-store" })
        ]);
        
        if (geoRes.ok) {
            const data = await geoRes.json();
            setGeoData(data);

            // Auto-ON layer hanya jika ada datanya
            const features = data?.features || [];
            if (features.some((f: any) => f.properties.regionType === "RT")) setShowRT(true);
            if (features.some((f: any) => f.properties.regionType === "RW")) setShowRW(true);
            if (features.some((f: any) => f.properties.regionType === "DUSUN")) setShowDusun(true);
            if (features.some((f: any) => f.properties.regionType === "DESA")) setShowDesa(true);
        }

        if (statsRes.ok) setStats(await statsRes.json());
      } catch (err) {
        console.error("Gagal memuat data peta:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [tahun]);

  const getColor = (percent: number) => {
    if (percent === 0) return "#94a3b8";
    if (percent >= 90) return "#10b981";
    if (percent >= 75) return "#84cc16";
    if (percent >= 50) return "#eab308";
    if (percent >= 25) return "#f97316";
    return "#ef4444";
  };

  const getStatsKey = (props: any) => {
    if (props.regionType === "RT") return `RT_${parseInt(props.rt)}RW_${parseInt(props.rw)}`;
    if (props.regionType === "RW") return `RW_${parseInt(props.rw)}`;
    if (props.regionType === "DUSUN") return `DUSUN_${props.dusun.toUpperCase()}`;
    if (props.regionType === "DESA") return `DESA_TOTAL`; 
    return "";
  };

  // Gaya dinamis berdasarkan level mana yang "paling detail" yang sedang aktif
  const getLayerStyle = (feature: any) => {
    const props = feature.properties;
    const type = props.regionType;
    
    // Hirarki prioritas warna: RT > RW > Dusun > Desa
    const isPrimaryFill = 
      (type === "RT" && showRT) ||
      (type === "RW" && showRW && !showRT) ||
      (type === "DUSUN" && showDusun && !showRW && !showRT) ||
      (type === "DESA" && showDesa && !showDusun && !showRW && !showRT);

    const sKey = getStatsKey(props);
    const s = stats[sKey] || { percentage: 0 };
    
    return {
      fillColor: isPrimaryFill ? getColor(s.percentage) : "transparent",
      fillOpacity: isPrimaryFill ? 0.7 : 0,
      weight: type === "DESA" ? 4 : type === "DUSUN" ? 2.5 : type === "RW" ? 1.5 : 1,
      color: type === "DESA" ? "#000" : type === "DUSUN" ? "#475569" : "#94a3b8",
      dashArray: type === "DESA" ? "" : "3",
      interactive: isPrimaryFill // Hanya yang sedang jadi "Heatmap Utama" yang bisa di-hover
    };
  };

  const onEachFeatureGeneric = (feature: any, layer: any) => {
    const props = feature.properties;
    const key = getStatsKey(props);
    const s = stats[key] || { total: 0, lunas: 0, percentage: 0 };
    
    // Keamanan Frontend (Sanitasi String)
    const escapeHtml = (unsafe: string) => {
        return String(unsafe || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    };

    let title = "";
    if (props.regionType === "RT") {
      title = `RT ${escapeHtml(props.rt)} RW ${escapeHtml(props.rw)}${props.dusun ? ` (${escapeHtml(props.dusun)})` : ""}`;
    }
    else if (props.regionType === "RW") title = `RW ${escapeHtml(props.rw)}`;
    else if (props.regionType === "DUSUN") title = `Dusun ${escapeHtml(props.dusun)}`;
    else if (props.regionType === "DESA") title = `Desa Balongbesuk`;

    const color = s.percentage >= 90 ? '#10b981' : s.percentage >= 75 ? '#84cc16' : s.percentage >= 50 ? '#eab308' : '#ef4444';

    let label = `
      <div style="min-width: 180px; font-family: sans-serif;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <div style="background: ${color}20; color: ${color}; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-center; font-size: 14px;">📍</div>
          <span style="font-size: 13px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">${title}</span>
        </div>
        
        <div style="background: #f8fafc; border-radius: 12px; padding: 10px; border: 1px solid #f1f5f9;">
          <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 20px; font-weight: 900; color: #0f172a;">${Math.round(s.percentage)}%</span>
            <span style="font-size: 10px; font-weight: 700; color: ${color}; text-transform: uppercase;">Lunas</span>
          </div>
          
          <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 8px;">
            <div style="width: ${s.percentage}%; height: 100%; background: ${color}; border-radius: 10px;"></div>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; color: #64748b;">
            <span>${s.lunas} Terbayar</span>
            <span>${s.total} Objek</span>
          </div>
        </div>
        
        <div style="margin-top: 10px; text-align: center; font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">
          Pilih Wilayah untuk Info Detail
        </div>
      </div>
    `;

    layer.bindTooltip(label, { sticky: true, className: 'custom-tooltip' });
    layer.bindPopup(label, { closeButton: false });
    
    layer.on({
      mouseover: (e: any) => { 
        if (layer.options.interactive) e.target.setStyle({ fillOpacity: 0.9, weight: 2 }); 
      },
      mouseout: (e: any) => { 
        if (layer.options.interactive) e.target.setStyle({ fillOpacity: 0.7, weight: 1 }); 
      },
      click: (e: any) => {
        // Hilangkan efek 'outline' fokus saat diklik agar tidak muncul kotak putih
        if (e.originalEvent) e.originalEvent.preventDefault();
        layer.openPopup();
      }
    });
  };

  if (loading) return <div className="h-[500px] flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300">Memuat Peta Desa...</div>;
  if (!geoData) return <div className="h-[500px] flex items-center justify-center text-rose-500 font-medium">Batas wilayah tidak ditemukan.</div>;

  // Filter fitur berdasarkan tipe untuk dirender di layer terpisah
  const rtFeatures = geoData.features.filter((f: any) => f.properties.regionType === "RT");
  const rwFeatures = geoData.features.filter((f: any) => f.properties.regionType === "RW");
  const dusunFeatures = geoData.features.filter((f: any) => f.properties.regionType === "DUSUN");
  const desaFeatures = geoData.features.filter((f: any) => f.properties.regionType === "DESA");

  return (
    <div className="relative w-full h-full group">
      <style dangerouslySetInnerHTML={{ __html: mapStyles }} />
      {/* Peta Tanpa Batas */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: "100%", width: "100%", background: "#f1f5f9" }}>
          {showSatellite ? (
            <TileLayer 
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
            />
          ) : (
            <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          )}
          
          {showDesa && <GeoJSON key={`desa-${showDesa}`} data={{ type: "FeatureCollection", features: desaFeatures } as any} style={getLayerStyle} onEachFeature={onEachFeatureGeneric} />}
          {showDusun && <GeoJSON key={`dusun-${showDusun}`} data={{ type: "FeatureCollection", features: dusunFeatures } as any} style={getLayerStyle} onEachFeature={onEachFeatureGeneric} />}
          {showRW && <GeoJSON key={`rw-${showRW}`} data={{ type: "FeatureCollection", features: rwFeatures } as any} style={getLayerStyle} onEachFeature={onEachFeatureGeneric} />}
          {showRT && <GeoJSON key={`rt-${showRT}-${tahun}`} data={{ type: "FeatureCollection", features: rtFeatures } as any} style={getLayerStyle} onEachFeature={onEachFeatureGeneric} />}
        </MapContainer>
      </div>

      {/* Floating Pill Bar - Navigation (Bottom Center) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[2000] flex items-center gap-2 p-2 bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10">
        <div className="flex items-center px-4 py-2 gap-6">
            <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={showDesa} onChange={e => setShowDesa(e.target.checked)} className="peer sr-only" />
                <div className="w-2 h-2 rounded-full bg-slate-600 peer-checked:bg-white transition-all peer-checked:scale-125 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                <span className="text-[10px] font-black text-slate-400 peer-checked:text-white uppercase tracking-tighter transition-colors">Desa</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={showDusun} onChange={e => setShowDusun(e.target.checked)} className="peer sr-only" />
                <div className="w-2 h-2 rounded-full bg-slate-600 peer-checked:bg-white transition-all peer-checked:scale-125 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                <span className="text-[10px] font-black text-slate-400 peer-checked:text-white uppercase tracking-tighter transition-colors">Dusun</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={showRW} onChange={e => setShowRW(e.target.checked)} className="peer sr-only" />
                <div className="w-2 h-2 rounded-full bg-slate-600 peer-checked:bg-white transition-all peer-checked:scale-125 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                <span className="text-[10px] font-black text-slate-400 peer-checked:text-white uppercase tracking-tighter transition-colors">RW</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={showRT} onChange={e => setShowRT(e.target.checked)} className="peer sr-only" />
                <div className="w-2 h-2 rounded-full bg-slate-600 peer-checked:bg-white transition-all peer-checked:scale-125 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                <span className="text-[10px] font-black text-slate-400 peer-checked:text-white uppercase tracking-tighter transition-colors">RT</span>
            </label>

            <div className="w-px h-4 bg-white/10 mx-1" />

            <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={showSatellite} onChange={e => setShowSatellite(e.target.checked)} className="peer sr-only" />
                <div className="w-2 h-2 rounded-full bg-slate-600 peer-checked:bg-blue-400 transition-all peer-checked:scale-125 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                <span className="text-[10px] font-black text-slate-400 peer-checked:text-blue-400 uppercase tracking-tighter transition-colors">Satelit</span>
            </label>
        </div>
      </div>

      {/* Mini Legend (Top Right) */}
      <div className="absolute top-10 right-10 z-[2000] bg-white/80 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border border-white/50 min-w-[160px]">
        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Status Bayar</div>
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-500">Sangat Baik</span>
                <div className="w-4 h-1 rounded-full bg-[#10b981]" />
            </div>
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-500">Cukup</span>
                <div className="w-4 h-1 rounded-full bg-[#eab308]" />
            </div>
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-500">Buruk</span>
                <div className="w-4 h-1 rounded-full bg-[#ef4444]" />
            </div>
        </div>
      </div>
    </div>
  );
}
