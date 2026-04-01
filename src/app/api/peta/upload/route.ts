import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const togeojson = require("togeojson");
    const { DOMParser } = require("@xmldom/xmldom");

    const formData = await req.formData();
    const files = formData.getAll("file") as File[];
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

    // Baca data LAMA yang sudah ada
    let existingFeatures: any[] = [];
    const filePath = path.join(process.cwd(), "public", "maps", "village.json");
    if (fs.existsSync(filePath)) {
        try {
            const oldData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            existingFeatures = oldData.features || [];
        } catch (e) {
            console.error("Gagal baca data lama:", e);
        }
    }

    const combinedMap = new Map();
    existingFeatures.forEach(f => {
        const nameKey = f.properties.name || "UNNAMED";
        combinedMap.set(nameKey, f);
    });

    // PROSES SEMUA FILE YAG DIUNGGAH
    for (const file of files) {
        const filename = file.name || "upload.gpx";
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const gpxString = buffer.toString();
        const gpxDoc = new DOMParser().parseFromString(gpxString, "text/xml");
        const converted = togeojson.gpx(gpxDoc);

        converted.features.forEach((f: any) => {
            let name = (f.properties.name || "").trim();
            if (!name) {
                name = filename.replace(/\.gpx$/i, "").replace(/_/g, " ").toUpperCase();
            }

            let regionType = "LAINNYA";
            let rt = "", rw = "", dusun = "";
            const rtMatch = name.match(/RT\s*(\d+)/i);
            const rwMatch = name.match(/RW\s*(\d+)/i);
            const dusunMatch = name.match(/DUSUN\s*([\w\s]+)/i) || name.match(/Dusun\s+([\w\s]+)/i);

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
            } else if (name.toUpperCase().includes("BALONGBESUK") || name.toUpperCase().includes("DESA")) {
                regionType = "DESA";
            }

            let geometry = f.geometry;
            if (geometry.type === "LineString") {
                const coords = [...geometry.coordinates];
                if (coords.length > 2) {
                    const first = coords[0];
                    const last = coords[coords.length - 1];
                    if (first[0] !== last[0] || first[1] !== last[1]) {
                        coords.push([first[0], last[1]]);
                    }
                    geometry = { type: "Polygon", coordinates: [coords] };
                }
            }

            const processedFeature = {
                ...f,
                geometry,
                properties: { ...f.properties, name, regionType, rt, rw, dusun }
            };
            
            combinedMap.set(name, processedFeature);
        });
    }

    const finalFeatures = Array.from(combinedMap.values());
    const finalGeoJSON = { type: "FeatureCollection", features: finalFeatures };
    
    if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(finalGeoJSON, null, 2));
    revalidatePath("/peta");

    return NextResponse.json({ success: true, message: `${files.length} file berhasil diproses ke peta!` });
  } catch (error: any) {
    console.error("Gagal proses:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}




export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filePath = path.join(process.cwd(), "public", "maps", "village.json");
    const emptyGeoJSON = {
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
