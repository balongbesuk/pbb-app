"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import { Maximize, Plus, Minus, Layers, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMap } from "react-leaflet";
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import type { GeoJSON as LeafletGeoJSON, Layer } from "leaflet";
import "leaflet/dist/leaflet.css";
import { RegionUnpaidDialog } from "./region-unpaid-dialog";

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
  .leaflet-popup-pane, .leaflet-tooltip-pane {
    z-index: 3000 !important;
  }
  .leaflet-tooltip {
    border-radius: 12px !important;
    border: none !important;
    box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
    padding: 8px 12px !important;
    font-weight: 700 !important;
    color: #1e293b !important;
  }
  .detail-wp-btn {
    width: 100%;
    margin-top: 12px;
    background: #0f172a;
    color: white;
    border: none;
    border-radius: 12px;
    padding: 10px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .detail-wp-btn:hover {
    background: #334155;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
  }
  .detail-wp-btn:active {
    transform: translateY(0);
  }
`;

// Lazy load MapContainer because it needs window
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), { ssr: false });

type RegionType = "RT" | "RW" | "DUSUN" | "DESA" | "BLOK" | "LAINNYA";

type RegionProperties = GeoJsonProperties & {
  regionType: RegionType;
  rt?: string;
  rw?: string;
  dusun?: string;
  blok?: string;
};

type RegionFeature = Feature<Geometry, RegionProperties>;
type RegionFeatureCollection = FeatureCollection<Geometry, RegionProperties>;

type RegionStat = {
  total: number;
  lunas: number;
  percentage: number;
};

type DialogConfig = {
  type: string;
  rt?: string;
  rw?: string;
  dusun?: string;
  blok?: string;
  title: string;
};

// Komponen pembantu untuk sinkronisasi posisi peta saat prop berubah
function MapWatcher({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Custom Map Controls (Zoom + Fullscreen + Satellite + Regions)
function MapControls({ 
  showSatellite, setShowSatellite,
  showDesa, setShowDesa,
  showDusun, setShowDusun,
  showRW, setShowRW,
  showRT, setShowRT,
  showBlok, setShowBlok
}: { 
  showSatellite: boolean; 
  setShowSatellite: (v: boolean) => void;
  showDesa: boolean; setShowDesa: (v: boolean) => void;
  showDusun: boolean; setShowDusun: (v: boolean) => void;
  showRW: boolean; setShowRW: (v: boolean) => void;
  showRT: boolean; setShowRT: (v: boolean) => void;
  showBlok: boolean; setShowBlok: (v: boolean) => void;
}) {
  const map = useMap();

  return (
    <div className="absolute top-6 left-6 z-[450] flex flex-col gap-3">
        {/* Zoom Controls */}
        <div className="flex flex-col bg-white/95 dark:bg-[#050505]/95 backdrop-blur-3xl rounded-2xl shadow-2xl overflow-hidden">
            <button
                onClick={() => map.zoomIn()}
                className="p-2.5 text-slate-600 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-colors border-b border-slate-100 dark:border-white/5"
                title="Zoom In"
            >
                <Plus className="w-5 h-5" />
            </button>
            <button
                onClick={() => map.zoomOut()}
                className="p-2.5 text-slate-600 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                title="Zoom Out"
            >
                <Minus className="w-5 h-5" />
            </button>
        </div>

        {/* Fullscreen Toggle */}
        <button
            onClick={() => {
                const el = document.getElementById("map-container-root");
                if (!document.fullscreenElement) {
                    el?.requestFullscreen().catch(err => console.error(err));
                } else {
                    document.exitFullscreen();
                }
            }}
            className="p-3 bg-white/95 dark:bg-[#050505]/95 backdrop-blur-3xl rounded-2xl shadow-2xl text-slate-600 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95"
            title="Toggle Fullscreen"
        >
            <Maximize className="w-5 h-5" />
        </button>

        {/* Satellite Toggle */}
        <button
            onClick={() => setShowSatellite(!showSatellite)}
            className={cn(
              "p-3 backdrop-blur-3xl rounded-2xl shadow-2xl transition-all active:scale-95",
              showSatellite
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-white/95 dark:bg-[#050505]/95 text-slate-600 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10"
            )}
            title={showSatellite ? "Tampilan Peta" : "Tampilan Satelit"}
        >
            <Layers className="w-5 h-5" />
        </button>

        {/* Region Toggles Section (Administrative) */}
        <div className="flex flex-col bg-white/95 dark:bg-[#050505]/95 backdrop-blur-3xl rounded-2xl shadow-2xl overflow-hidden mt-1">
            {[
                { label: "DS", full: "Desa", state: showDesa, setter: setShowDesa },
                { label: "DN", full: "Dusun", state: showDusun, setter: setShowDusun },
                { label: "RW", full: "RW", state: showRW, setter: setShowRW },
                { label: "RT", full: "RT", state: showRT, setter: setShowRT },
            ].map((item, i) => (
                <button
                    key={item.label}
                    onClick={() => {
                        const nextState = !item.state;
                        item.setter(nextState);
                        if (nextState) {
                            // Jika layer administratif aktif, matikan layer Blok
                            setShowBlok(false);
                        }
                    }}
                    className={cn(
                        "flex flex-col items-center justify-center p-3 transition-all active:scale-95 group",
                        item.state 
                          ? "bg-blue-600 dark:bg-blue-600 text-white" 
                          : "hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-white",
                        i !== 3 && (item.state ? "border-b border-blue-500/20" : "border-b border-slate-100 dark:border-white/5")
                    )}
                    title={`Toggle ${item.full}`}
                >
                    <span className={cn(
                        "text-[10px] font-black tracking-widest transition-colors",
                    )}>
                        {item.label}
                    </span>
                </button>
            ))}
        </div>
        
        {/* Layer PBB (Blok) - Separated but on the Left */}
        <button
            onClick={() => {
                const nextState = !showBlok;
                setShowBlok(nextState);
                if (nextState) {
                    setShowDesa(false);
                    setShowDusun(false);
                    setShowRW(false);
                    setShowRT(false);
                }
            }}
            className={cn(
                "flex flex-col items-center justify-center p-3 backdrop-blur-3xl rounded-2xl shadow-2xl transition-all active:scale-95 group mt-1",
                showBlok 
                  ? "bg-emerald-600 text-white" 
                  : "bg-white/95 dark:bg-[#050505]/95 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-white"
            )}
            title="Toggle Peta Blok PBB"
        >
            <MapIcon className={cn(
                "w-5 h-5 transition-transform duration-300",
                showBlok ? "scale-110" : "scale-100"
            )} />
        </button>
    </div>
  );
}

function MapLegend() {
  return (
    <div className={cn(
        "absolute z-[450] bg-white/95 dark:bg-[#050505]/95 backdrop-blur-3xl p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-slate-200 dark:border-white/10 min-w-[120px] sm:min-w-[160px]",
        "top-8 right-8"
    )}>
      <div className="text-[9px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest mb-3 text-center">Status Bayar</div>
      <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-700 dark:text-white/60">Sangat Baik</span>
              <div className="w-4 h-1 rounded-full bg-[#10b981]" />
          </div>
          <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-700 dark:text-white/60">Cukup</span>
              <div className="w-4 h-1 rounded-full bg-[#eab308]" />
          </div>
          <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-700 dark:text-white/60">Buruk</span>
              <div className="w-4 h-1 rounded-full bg-[#ef4444]" />
          </div>
      </div>
    </div>
  );
}

export function RegionMap({ 
  tahun = 2026, 
  center = [-7.5744, 112.235], 
  zoom = 15,
  isPublic = false,
  showUnpaidDetailsGis = false
}: { 
  tahun?: number, 
  center?: [number, number], 
  zoom?: number,
  isPublic?: boolean,
  showUnpaidDetailsGis?: boolean
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [geoData, setGeoData] = useState<RegionFeatureCollection | null>(null);
  const [stats, setStats] = useState<Record<string, RegionStat>>({});
  const [loading, setLoading] = useState(true);
  
  const [openUnpaidDialog, setOpenUnpaidDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<DialogConfig | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Monitor fullscreen for portaling
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsEl = document.fullscreenElement;
      if (fsEl && mapRef.current && (fsEl === mapRef.current || fsEl.contains(mapRef.current))) {
        setPortalContainer(mapRef.current);
      } else {
        setPortalContainer(null); // Back to Body (default Radix portal)
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // State untuk kontrol layer
  const [showRT, setShowRT] = useState(false);
  const [showRW, setShowRW] = useState(false);
  const [showDusun, setShowDusun] = useState(false);
  const [showBlok, setShowBlok] = useState(false);
  const [showDesa, setShowDesa] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [statusText, setStatusText] = useState("Memuat Peta Desa...");

  useEffect(() => {
    async function fetchData() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      setLoading(true);
      try {
        setStatusText("Memuat Batas Wilayah...");
        const geoRes = await fetch(`/maps/village.json?v=${Date.now()}`, { 
          cache: "no-store",
          signal: controller.signal 
        });
        
        if (geoRes.ok) {
            const data = (await geoRes.json()) as RegionFeatureCollection;
            setGeoData(data);

            const features = data?.features || [];
            if (features.some((feature) => feature.properties?.regionType === "RT")) setShowRT(true);
            if (features.some((feature) => feature.properties?.regionType === "RW")) setShowRW(true);
            if (features.some((feature) => feature.properties?.regionType === "DUSUN")) setShowDusun(true);
            if (features.some((feature) => feature.properties?.regionType === "BLOK")) setShowBlok(true);
            if (features.some((feature) => feature.properties?.regionType === "DESA")) setShowDesa(true);
        }

        setStatusText("Memuat Statistik Pembayaran...");
        const statsRes = await fetch(`/api/region-stats?tahun=${tahun}`, { 
          cache: "no-store",
          signal: controller.signal
        });

        if (statsRes.ok) {
          setStats((await statsRes.json()) as Record<string, RegionStat>);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
           console.error("Fetch timeout");
        }
        console.error("Gagal memuat data peta:", err);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }
    fetchData();
  }, [tahun]);

  const handleRetry = () => {
    setLoading(true);
    setGeoData(null);
    // This will trigger the useEffect because it changes local state if we had a trigger
    window.location.reload();
  };

  // Handle global click for Leaflet buttons
  useEffect(() => {
    const handleMapBtnClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("detail-wp-btn")) {
        const data = target.dataset;
        setDialogConfig({
          type: data.type || "RT",
          rt: data.rt,
          rw: data.rw,
          dusun: data.dusun,
          blok: data.blok,
          title: data.title || "Detail WP"
        });
        setOpenUnpaidDialog(true);
      }
    };

    document.addEventListener("click", handleMapBtnClick);
    return () => document.removeEventListener("click", handleMapBtnClick);
  }, []);

  const getColor = (percent: number) => {
    if (percent === 0) return "#94a3b8";
    if (percent >= 90) return "#10b981";
    if (percent >= 75) return "#84cc16";
    if (percent >= 50) return "#eab308";
    if (percent >= 25) return "#f97316";
    return "#ef4444";
  };

  const getStatsKey = (props: RegionProperties) => {
    if (props.regionType === "RT") return `RT_${parseInt(props.rt ?? "0")}RW_${parseInt(props.rw ?? "0")}`;
    if (props.regionType === "RW") return `RW_${parseInt(props.rw ?? "0")}`;
    if (props.regionType === "DUSUN") return `DUSUN_${(props.dusun ?? "").toUpperCase()}`;
    if (props.regionType === "BLOK") return `BLOK_${props.blok ?? ""}`;
    if (props.regionType === "DESA") return `DESA_TOTAL`; 
    return "";
  };

  // Gaya dinamis berdasarkan level mana yang "paling detail" yang sedang aktif
  const getLayerStyle = (feature?: RegionFeature) => {
    const props = feature?.properties;
    if (!props) {
      return {
        fillColor: "transparent",
        fillOpacity: 0,
        weight: 1,
        color: "#94a3b8",
        dashArray: "3",
        interactive: false,
      };
    }
    const type = props.regionType;
    
    // Hirarki prioritas warna: RT > RW > Dusun > Desa
    const isPrimaryFill = 
      (type === "RT" && showRT) ||
      (type === "RW" && showRW && !showRT) ||
      (type === "BLOK" && showBlok && !showRW && !showRT) ||
      (type === "DUSUN" && showDusun && !showBlok && !showRW && !showRT) ||
      (type === "DESA" && showDesa && !showDusun && !showBlok && !showRW && !showRT);

    const sKey = getStatsKey(props);
    const s = stats[sKey] || { total: 0, lunas: 0, percentage: 0 };
    
    return {
      fillColor: isPrimaryFill ? getColor(s.percentage) : "transparent",
      fillOpacity: isPrimaryFill ? 0.7 : 0,
      weight: type === "DESA" ? 4 : type === "DUSUN" ? 2.5 : type === "RW" ? 1.5 : 1,
      color: type === "DESA" ? "#000" : type === "DUSUN" ? "#475569" : "#94a3b8",
      dashArray: type === "DESA" ? "" : "3",
      interactive: isPrimaryFill // Hanya yang sedang jadi "Heatmap Utama" yang bisa di-hover
    };
  };

  const onEachFeatureGeneric = (feature: RegionFeature, layer: Layer) => {
    const props = feature.properties;
    if (!props) return;
    const key = getStatsKey(props);
    const s = stats[key] || { total: 0, lunas: 0, percentage: 0 };
    const regionLayer = layer as LeafletGeoJSON;
    
    // Keamanan Frontend (Sanitasi String)
    const escapeHtml = (unsafe: string) => {
        return String(unsafe || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    };

    let title = "";
    if (props.regionType === "RT") {
      title = `RT ${escapeHtml(props.rt ?? "")} RW ${escapeHtml(props.rw ?? "")}${props.dusun ? ` (${escapeHtml(props.dusun)})` : ""}`;
    }
    else if (props.regionType === "RW") title = `RW ${escapeHtml(props.rw ?? "")}`;
    else if (props.regionType === "DUSUN") title = `Dusun ${escapeHtml(props.dusun ?? "")}`;
    else if (props.regionType === "BLOK") title = `Blok ${escapeHtml(props.blok ?? "")}`;
    else if (props.regionType === "DESA") title = `Desa Balongbesuk`;

    const color = s.percentage >= 90 ? '#10b981' : s.percentage >= 75 ? '#84cc16' : s.percentage >= 50 ? '#eab308' : '#ef4444';

    // Jika bukan publik, selalu tampil. Jika publik, tampil hanya jika diizinkan di pengaturan.
    const detailButton = (!isPublic || showUnpaidDetailsGis) ? `
        <button 
          class="detail-wp-btn" 
          data-type="${props.regionType}"
          data-rt="${props.rt || ""}"
          data-rw="${props.rw || ""}"
          data-dusun="${props.dusun || ""}"
          data-blok="${props.blok || ""}"
          data-title="${escapeHtml(title)}"
        >
          Detail WP Belum Bayar
        </button>
    ` : "";

    const label = `
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
        ${detailButton}
      </div>
    `;

    if (!isMobile) {
        regionLayer.bindTooltip(label, { sticky: true, className: 'custom-tooltip' });
    }
    regionLayer.bindPopup(label, { closeButton: false, minWidth: isMobile ? 220 : 250 });
    
    regionLayer.on({
      mouseover: (event: { target: LeafletGeoJSON }) => { 
        if (regionLayer.options.interactive) event.target.setStyle({ fillOpacity: 0.9, weight: 2 }); 
      },
      mouseout: (event: { target: LeafletGeoJSON }) => { 
        if (regionLayer.options.interactive) event.target.setStyle({ fillOpacity: 0.7, weight: 1 }); 
      },
      click: (event: { originalEvent?: MouseEvent }) => {
        // Hilangkan efek 'outline' fokus saat diklik agar tidak muncul kotak putih
        if (event.originalEvent) event.originalEvent.preventDefault();
        regionLayer.openPopup();
      }
    });
  };

  if (loading) return (
    <div className="h-[500px] flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-slate-600 font-bold tracking-tight text-lg mb-2">{statusText}</p>
      <p className="text-slate-400 text-xs uppercase tracking-widest font-black">Mohon Tunggu Sebentar...</p>
      
      {/* Tombol bantuan jika terlalu lama */}
      <button 
        onClick={handleRetry}
        className="mt-8 px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
      >
        Muat Ulang Paksa
      </button>
    </div>
  );

  if (!geoData) return (
    <div className="h-[500px] flex flex-col items-center justify-center bg-rose-50 rounded-3xl border border-dashed border-rose-200 px-10 text-center">
      <div className="w-16 h-16 bg-rose-100 rounded-full items-center justify-center flex mb-4">
        <span className="text-2xl">🗺️</span>
      </div>
      <p className="text-rose-600 font-bold mb-2">Batas wilayah tidak ditemukan.</p>
      <p className="text-slate-500 text-xs mb-6 max-w-xs leading-relaxed">Server mungkin sedang sibuk atau data peta belum terkonfigurasi untuk tahun ini.</p>
      <button 
        onClick={handleRetry}
        className="px-8 py-3 bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-200"
      >
        Coba Hubungkan Kembali
      </button>
    </div>
  );

  // Filter fitur berdasarkan tipe untuk dirender di layer terpisah
  const rtFeatures = geoData.features.filter((feature) => feature.properties?.regionType === "RT");
  const rwFeatures = geoData.features.filter((feature) => feature.properties?.regionType === "RW");
  const dusunFeatures = geoData.features.filter((feature) => feature.properties?.regionType === "DUSUN");
  const blokFeatures = geoData.features.filter((feature) => feature.properties?.regionType === "BLOK");
  const desaFeatures = geoData.features.filter((feature) => feature.properties?.regionType === "DESA");

  return (
    <div className="relative w-full h-full group">
      <style dangerouslySetInnerHTML={{ __html: mapStyles }} />
      {/* Peta Tanpa Batas */}
      <div id="map-container-root" ref={mapRef} className="absolute inset-0 z-0 bg-[#f1f5f9]">
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: "100%", width: "100%", background: "#f1f5f9" }} zoomControl={false}>
          {showSatellite ? (
            <TileLayer 
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
            />
          ) : (
            <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          )}

          <MapWatcher center={center} zoom={zoom} />
          <MapControls 
            showSatellite={showSatellite} setShowSatellite={setShowSatellite} 
            showDesa={showDesa} setShowDesa={setShowDesa}
            showDusun={showDusun} setShowDusun={setShowDusun}
            showRW={showRW} setShowRW={setShowRW}
            showRT={showRT} setShowRT={setShowRT}
            showBlok={showBlok} setShowBlok={setShowBlok}
          />
          
          {showDesa && <GeoJSON key={`desa-${showDesa}`} data={{ type: "FeatureCollection", features: desaFeatures } as RegionFeatureCollection} style={getLayerStyle} onEachFeature={onEachFeatureGeneric} />}
          {showDusun && <GeoJSON key={`dusun-${showDusun}`} data={{ type: "FeatureCollection", features: dusunFeatures } as RegionFeatureCollection} style={getLayerStyle} onEachFeature={onEachFeatureGeneric} />}
          {showBlok && <GeoJSON key={`blok-${showBlok}`} data={{ type: "FeatureCollection", features: blokFeatures } as RegionFeatureCollection} style={getLayerStyle} onEachFeature={onEachFeatureGeneric} />}
            {showRW && <GeoJSON key={`rw-${showRW}`} data={{ type: "FeatureCollection", features: rwFeatures } as RegionFeatureCollection} style={getLayerStyle} onEachFeature={onEachFeatureGeneric} />}
            {showRT && <GeoJSON key={`rt-${showRT}-${tahun}`} data={{ type: "FeatureCollection", features: rtFeatures } as RegionFeatureCollection} style={getLayerStyle} onEachFeature={onEachFeatureGeneric} />}
            <MapLegend />
          </MapContainer>
        </div>




      {(!isPublic || showUnpaidDetailsGis) && dialogConfig && (
        <RegionUnpaidDialog
          open={openUnpaidDialog}
          onOpenChange={setOpenUnpaidDialog}
          tahun={tahun}
          type={dialogConfig.type}
          rt={dialogConfig.rt}
          rw={dialogConfig.rw}
          dusun={dialogConfig.dusun}
          blok={dialogConfig.blok}
          title={dialogConfig.title}
          container={portalContainer}
        />
      )}
    </div>
  );
}
