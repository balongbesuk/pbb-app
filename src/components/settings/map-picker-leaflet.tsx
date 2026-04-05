"use client";

import { useEffect } from "react";
import { Icon } from "leaflet";
import {
    MapContainer,
    Marker,
    TileLayer,
    useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type LatLng = { lat: number; lng: number };

function fixIcon() {
    delete (Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
    Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
}

function MapEvents({ setTempLoc }: { setTempLoc: (loc: LatLng) => void }) {
    useMapEvents({
        click(event) {
            setTempLoc({ lat: event.latlng.lat, lng: event.latlng.lng });
        },
    });

    return null;
}

export function MapPickerLeaflet({
    tempLoc,
    setTempLoc,
    showSatellite,
}: {
    tempLoc: LatLng;
    setTempLoc: (loc: LatLng) => void;
    showSatellite: boolean;
}) {
    useEffect(() => {
        fixIcon();
    }, []);

    return (
        <MapContainer
            center={[tempLoc.lat, tempLoc.lng]}
            zoom={15}
            style={{ width: "100%", height: "100%", zIndex: 0 }}
            scrollWheelZoom
        >
            {showSatellite ? (
                <TileLayer
                    attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
            ) : (
                <TileLayer
                    attribution="&copy; OpenStreetMap"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
            )}
            <Marker position={[tempLoc.lat, tempLoc.lng]} />
            <MapEvents setTempLoc={setTempLoc} />
        </MapContainer>
    );
}
