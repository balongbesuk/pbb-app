"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

const MapPickerLeaflet = dynamic(
    () => import("./map-picker-leaflet").then((mod) => mod.MapPickerLeaflet),
    { ssr: false }
);

type LatLng = { lat: number; lng: number };

export function MapPickerDialog({
    open,
    onOpenChange,
    defaultLat,
    defaultLng,
    onSave,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultLat: string;
    defaultLng: string;
    onSave: (lat: string, lng: string) => void;
}) {
    const defaultCenter: LatLng = { lat: -7.5744, lng: 112.235 };
    const [tempLoc, setTempLoc] = useState<LatLng>({
        lat: Number(defaultLat) || defaultCenter.lat,
        lng: Number(defaultLng) || defaultCenter.lng,
    });
    const [showSatellite, setShowSatellite] = useState(false);

    useEffect(() => {
        if (!open) return;

        setTempLoc({
            lat: Number(defaultLat) || defaultCenter.lat,
            lng: Number(defaultLng) || defaultCenter.lng,
        });
    }, [open, defaultLat, defaultLng, defaultCenter.lat, defaultCenter.lng]);

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
                            <input
                                type="checkbox"
                                checked={showSatellite}
                                onChange={(e) => setShowSatellite(e.target.checked)}
                                className="peer sr-only"
                            />
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 peer-checked:bg-blue-500 transition-all peer-checked:scale-125 shadow-[0_0_10px_rgba(59,130,246,0)] peer-checked:shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 peer-checked:text-blue-600 dark:peer-checked:text-blue-400 uppercase tracking-widest transition-colors">
                                Satelit
                            </span>
                        </label>
                    </div>

                    {open ? (
                        <MapPickerLeaflet
                            tempLoc={tempLoc}
                            setTempLoc={setTempLoc}
                            showSatellite={showSatellite}
                        />
                    ) : null}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 gap-4">
                    <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm w-full sm:w-auto overflow-hidden">
                        <span className="text-slate-400">LAT:</span> {tempLoc.lat.toFixed(6)}
                        <span className="text-slate-400 ml-2">LNG:</span> {tempLoc.lng.toFixed(6)}
                    </div>
                    <DialogFooter className="w-full sm:w-auto mt-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="dark:border-slate-700"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                onSave(tempLoc.lat.toFixed(6), tempLoc.lng.toFixed(6));
                                onOpenChange(false);
                            }}
                        >
                            Gunakan Koordinat Ini
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
