import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const filePath = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "maps", "village.json");
    const emptyGeoJSON = {
      type: "FeatureCollection",
      features: [],
    };

    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(emptyGeoJSON, null, 2), "utf-8");

    revalidatePath("/peta");
    revalidatePath("/peta/settings");

    return NextResponse.redirect(new URL("/peta/settings?mapCleared=1", req.url));
  } catch (error) {
    console.error("Gagal mengosongkan data peta:", error);
    return NextResponse.redirect(new URL("/peta/settings?mapError=1", req.url));
  }
}
