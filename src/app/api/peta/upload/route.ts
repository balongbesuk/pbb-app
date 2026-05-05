import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DOMParser } from "@xmldom/xmldom";
import * as togeojson from "togeojson";
import type { AppUser } from "@/types/app";
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry, LineString, Polygon } from "geojson";

type RegionType = "RT" | "RW" | "DUSUN" | "DESA" | "BLOK" | "LAINNYA";

type MapFeatureProperties = GeoJsonProperties & {
  name?: string;
  regionType?: RegionType;
  rt?: string;
  rw?: string;
  dusun?: string;
  blok?: string;
};

type MapFeature = Feature<Geometry, MapFeatureProperties>;
type MapFeatureCollection = FeatureCollection<Geometry, MapFeatureProperties>;

function isAdmin(user?: AppUser): boolean {
  return user?.role === "ADMIN";
}

const MAX_MAP_UPLOAD_FILES = 20;
const MAX_MAP_UPLOAD_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MAP_EXTENSIONS = new Set([".gpx"]);
const ALLOWED_MAP_MIME_TYPES = new Set([
  "application/gpx+xml",
  "application/xml",
  "text/xml",
  "application/octet-stream",
]);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as AppUser | undefined;
    if (!session || !isAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("file").filter((value): value is File => value instanceof File);
    const lat = formData.get("lat") as string;
    const lng = formData.get("lng") as string;
    const zoom = formData.get("zoom") as string;

    // Simpan koordinat
    await prisma.villageConfig.update({
      where: { id: 1 },
      data: {
        mapCenterLat: parseFloat(lat || "-7.5744"),
        mapCenterLng: parseFloat(lng || "112.235"),
        mapDefaultZoom: parseInt(zoom || "15"),
      }
    });

    if (!files || files.length === 0) {
      return NextResponse.json({ success: true, message: "Koordinat diperbarui" });
    }

    if (files.length > MAX_MAP_UPLOAD_FILES) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_MAP_UPLOAD_FILES} file GPX per unggahan.` },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!(file instanceof File) || file.size <= 0) {
        return NextResponse.json({ error: "Ada file GPX yang kosong atau tidak valid." }, { status: 400 });
      }

      const normalizedName = file.name.trim().toLowerCase();
      const isAllowedExtension = [...ALLOWED_MAP_EXTENSIONS].some((extension) =>
        normalizedName.endsWith(extension)
      );

      if (!isAllowedExtension) {
        return NextResponse.json({ error: `File ${file.name} harus berformat GPX.` }, { status: 400 });
      }

      if (file.type && !ALLOWED_MAP_MIME_TYPES.has(file.type)) {
        return NextResponse.json({ error: `Tipe file ${file.name} tidak didukung.` }, { status: 400 });
      }

      if (file.size > MAX_MAP_UPLOAD_FILE_SIZE) {
        return NextResponse.json({ error: `File ${file.name} melebihi batas 5 MB.` }, { status: 400 });
      }
    }

    // Baca data LAMA yang sudah ada
    let existingFeatures: MapFeature[] = [];
    const filePath = path.join(process.cwd(), "public", "maps", "village.json");
    if (fs.existsSync(filePath)) {
        try {
            const oldData = JSON.parse(fs.readFileSync(filePath, "utf-8")) as MapFeatureCollection;
            existingFeatures = oldData.features || [];
        } catch (error) {
            console.error("Gagal baca data lama:", error);
        }
    }

    const combinedMap = new Map<string, MapFeature>();
    existingFeatures.forEach((feature) => {
        const nameKey = feature.properties?.name || "UNNAMED";
        combinedMap.set(nameKey, feature);
    });

    // PROSES SEMUA FILE YAG DIUNGGAH
    for (const file of files) {
        const filename = file.name || "upload.gpx";
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const gpxString = buffer.toString();
        const gpxDoc = new DOMParser().parseFromString(gpxString, "text/xml");
        const converted = togeojson.gpx(gpxDoc) as MapFeatureCollection;

        converted.features.forEach((feature) => {
            let name = (feature.properties?.name || "").trim();
            if (!name) {
                name = filename.replace(/\.gpx$/i, "").replace(/_/g, " ").toUpperCase();
            }

            let regionType: RegionType = "LAINNYA";
            let rt = "", rw = "", dusun = "", blok = "";
            const rtMatch = name.match(/RT\s*(\d+)/i);
            const rwMatch = name.match(/RW\s*(\d+)/i);
            const dusunMatch = name.match(/DUSUN\s*([\w\s]+)/i) || name.match(/Dusun\s+([\w\s]+)/i);
            const blokMatch = name.match(/BLOK\s*(\d+)/i) || name.match(/Blok\s*(\d+)/i);

            if (rtMatch) {
                regionType = "RT";
                rt = rtMatch[1].padStart(2, "0");
                if (rwMatch) rw = rwMatch[1].padStart(2, "0");
                const parts = name.split(/RW\d+/i);
                if (parts.length > 1) dusun = parts[1].replace(/[()]/g, "").trim();
            } else if (rwMatch) {
                regionType = "RW";
                rw = rwMatch[1].padStart(2, "0");
            } else if (dusunMatch || name.toUpperCase().includes("DUSUN")) {
                regionType = "DUSUN";
                dusun = (dusunMatch ? dusunMatch[1] : name.replace(/DUSUN\s*/i, "")).trim();
            } else if (blokMatch) {
                regionType = "BLOK";
                blok = blokMatch[1].padStart(3, "0");
            } else if (name.toUpperCase().includes("BALONGBESUK") || name.toUpperCase().includes("DESA")) {
                regionType = "DESA";
            }

            let geometry = feature.geometry;
            if (geometry.type === "LineString") {
                const coords = [...(geometry as LineString).coordinates];
                if (coords.length > 2) {
                    const first = coords[0];
                    const last = coords[coords.length - 1];
                    if (first[0] !== last[0] || first[1] !== last[1]) {
                        coords.push([first[0], first[1]]);
                    }
                    geometry = { type: "Polygon", coordinates: [coords] } as Polygon;
                }
            }

            const processedFeature: MapFeature = {
                ...feature,
                geometry,
                properties: { ...feature.properties, name, regionType, rt, rw, dusun, blok }
            };
            
            combinedMap.set(name, processedFeature);
        });
    }

    const finalFeatures = Array.from(combinedMap.values());
    const finalGeoJSON: MapFeatureCollection = { type: "FeatureCollection", features: finalFeatures };
    
    if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(finalGeoJSON, null, 2));
    revalidatePath("/peta");

    return NextResponse.json({ success: true, message: `${files.length} file berhasil diproses ke peta!` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal proses";
    console.error("Gagal proses:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}




export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as AppUser | undefined;
    if (!session || !isAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filePath = path.join(process.cwd(), "public", "maps", "village.json");
    const emptyGeoJSON: MapFeatureCollection = {
      type: "FeatureCollection",
      features: [],
    };

    if (!fs.existsSync(path.dirname(filePath))) {
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    }

    await fs.promises.writeFile(filePath, JSON.stringify(emptyGeoJSON, null, 2), "utf-8");
    revalidatePath("/peta");

    return NextResponse.json({ success: true, message: "Data peta berhasil dikosongkan." });
  } catch (error) {
    console.error("Gagal hapus peta:", error);
    return NextResponse.json({ error: "Gagal mengosongkan data peta" }, { status: 500 });
  }
}
