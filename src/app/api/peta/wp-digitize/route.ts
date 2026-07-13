import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

const WP_JSON_PATH = path.join(process.cwd(), "public/maps/wp.json");

function readWpJson() {
  if (!fs.existsSync(WP_JSON_PATH)) {
    return { type: "FeatureCollection", features: [] };
  }
  return JSON.parse(fs.readFileSync(WP_JSON_PATH, "utf-8"));
}

function writeWpJson(data: any) {
  fs.writeFileSync(WP_JSON_PATH, JSON.stringify(data), "utf-8");
}

// POST - Tambah polygon baru ke wp.json
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { geometry, properties } = await req.json();

    if (!geometry || !properties?.fullNop) {
      return NextResponse.json({ error: "geometry dan fullNop diperlukan" }, { status: 400 });
    }

    const wpData = readWpJson();

    // Cek duplikasi
    const cleanNop = properties.fullNop.replace(/\D/g, "");
    const exists = wpData.features.some(
      (f: any) => (f.properties?.fullNop || "").replace(/\D/g, "") === cleanNop
    );
    if (exists) {
      return NextResponse.json({ error: "NOP ini sudah ada di peta" }, { status: 409 });
    }

    const newFeature = {
      type: "Feature",
      geometry,
      properties: {
        name: properties.name || "",
        nop: properties.nop || "",
        blok: properties.blok || "",
        fullNop: properties.fullNop,
      },
    };

    wpData.features.push(newFeature);
    writeWpJson(wpData);

    return NextResponse.json({ success: true, feature: newFeature });
  } catch (err) {
    console.error("[wp-digitize] Error:", err);
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}

// DELETE - Hapus polygon dari wp.json berdasarkan fullNop
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fullNop } = await req.json();
    if (!fullNop) {
      return NextResponse.json({ error: "fullNop diperlukan" }, { status: 400 });
    }

    const wpData = readWpJson();
    const cleanNop = fullNop.replace(/\D/g, "");
    const before = wpData.features.length;
    wpData.features = wpData.features.filter(
      (f: any) => (f.properties?.fullNop || "").replace(/\D/g, "") !== cleanNop
    );

    if (wpData.features.length === before) {
      return NextResponse.json({ error: "NOP tidak ditemukan di peta" }, { status: 404 });
    }

    writeWpJson(wpData);
    return NextResponse.json({ success: true, removed: before - wpData.features.length });
  } catch (err) {
    console.error("[wp-digitize] Delete Error:", err);
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}

// PUT - Update geometry polygon di wp.json berdasarkan fullNop
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { geometry, fullNop } = await req.json();

    if (!geometry || !fullNop) {
      return NextResponse.json({ error: "geometry dan fullNop diperlukan" }, { status: 400 });
    }

    const wpData = readWpJson();
    const cleanNop = fullNop.replace(/\D/g, "");
    
    let found = false;
    wpData.features = wpData.features.map((f: any) => {
      if ((f.properties?.fullNop || "").replace(/\D/g, "") === cleanNop) {
        found = true;
        return {
          ...f,
          geometry
        };
      }
      return f;
    });

    if (!found) {
      return NextResponse.json({ error: "NOP tidak ditemukan di peta" }, { status: 404 });
    }

    writeWpJson(wpData);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[wp-digitize] Put Error:", err);
    return NextResponse.json({ error: "Gagal memperbarui data" }, { status: 500 });
  }
}

