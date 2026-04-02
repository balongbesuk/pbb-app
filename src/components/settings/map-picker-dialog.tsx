"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Target } from "lucide-react";
import "leaflet/dist/leaflet.css";

const fixIcon = () => {
    const L = require("leaflet");
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
};

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });

function MapEvents({ setTempLoc }: { setTempLoc: (loc: { lat: number, lng: number }) => void }) {
    // Cannot `dynamic` import a hook, so we require it at runtime inside the component
    const { useMapEvents } = require("react-leaflet");
    useMapEvents({
        click(e: any) {
            setTempLoc({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
}

export function MapPickerDialog({ 
    open, 
    onOpenChange, 
    defaultLat, 
    defaultLng, 
    onSave 
}: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void, 
    defaultLat: string, 
    defaultLng: string, 
    onSave: (lat: string, lng: string) => void 
}) {
    const defaultCenter = { lat: -7.5744, lng: 112.235 };
    const [tempLoc, setTempLoc] = useState<{lat: number, lng: number}>({ 
        lat: Number(defaultLat) || defaultCenter.lat, 
        lng: Number(defaultLng) || defaultCenter.lng 
    });
    const [showSatellite, setShowSatellite] = useState(false);

    useEffect(() => {
        if (open) {
            setTempLoc({ 
                lat: Number(defaultLat) || defaultCenter.lat, 
                lng: Number(defaultLng) || defaultCenter.lng 
            });
            if (typeof window !== "undefined") {
                 fixIcon();
            }
        }
    }, [open, defaultLat, defaultLng]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl w-[95vw] p-0 overflow-hidden dark:bg-zinc-950 dark:border-slate-800">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Pilih Titik Pusat Peta
                    </DialogTitle>
                    <DialogDescription className="dark:text-slate-400">
                        Klik pada peta untuk mengambil koordinat Latitude dan Longitude secara instan.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="w-full h-[50dvh] min-h-[400px] bg-slate-100 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 relative z-0">
                    <div className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" checked={showSatellite} onChange={e => setShowSatellite(e.target.checked)} className="peer sr-only" />
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 peer-checked:bg-blue-500 transition-all peer-checked:scale-125 shadow-[0_0_10px_rgba(59,130,246,0)] peer-checked:shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 peer-checked:text-blue-600 dark:peer-checked:text-blue-400 uppercase tracking-widest transition-colors">Satelit</span>
                        </label>
                    </div>

                    {open && (
                        // Leaflet runs through a client-only dynamic wrapper here.
                        <MapContainer 
                            center={[tempLoc.lat, tempLoc.lng]} 
                            zoom={15} 
                            style={{ width: "100%", height: "100%", zIndex: 0 }}
                            scrollWheelZoom={true}
                        >
                            {showSatellite ? (
                                <TileLayer 
                                    attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
                                />
                            ) : (
                                <TileLayer
                                    attribution='&copy; OpenStreetMap'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                            )}
                            {/* Marker stays client-side with the dynamic Leaflet wrapper. */}
                            <Marker position={[tempLoc.lat, tempLoc.lng]} />
                            {/* Map click handling is wired through the runtime Leaflet hook. */}
                            <MapEvents setTempLoc={setTempLoc} />
                        </MapContainer>
                    )}
                 </div>

                 <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 gap-4">
                     <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm w-full sm:w-auto overflow-hidden">
                        <span className="text-slate-400">LAT:</span> {tempLoc.lat.toFixed(6)} 
                        <span className="text-slate-400 ml-2">LNG:</span> {tempLoc.lng.toFixed(6)}
                     </div>
                     <DialogFooter className="w-full sm:w-auto mt-0">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="dark:border-slate-700">
                            Batal
                        </Button>
                        <Button type="button" onClick={() => {
                            onSave(tempLoc.lat.toFixed(6), tempLoc.lng.toFixed(6));
                            onOpenChange(false); // Tutup dialog setelah simpan
                        }}>
                            Gunakan Koordinat Ini
                        </Button>
                     </DialogFooter>
                 </div>
            </DialogContent>
        </Dialog>
    );
}
