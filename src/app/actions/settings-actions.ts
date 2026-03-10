"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";

export async function deleteAllTaxData() {
  try {
    await requireAdmin();

    // Delete related transactional records
    await prisma.$executeRawUnsafe('DELETE FROM "TransferRequest"');
    await prisma.taxData.deleteMany();

    // Delete configuration and settings records based on user request
    await prisma.$executeRawUnsafe('DELETE FROM "DusunReference"');
    await prisma.$executeRawUnsafe('DELETE FROM "RegionOtomation"');
    await prisma.$executeRawUnsafe('DELETE FROM "TaxMapping"');
    await prisma.$executeRawUnsafe('DELETE FROM "VillageRegion"');
    await prisma.$executeRawUnsafe('DELETE FROM "AddressLearning"');
    await prisma.$executeRawUnsafe('DELETE FROM "Notification"');

    // Reset Village Config / Profile to empty defaults
    await prisma.$executeRawUnsafe('DELETE FROM "VillageConfig"');
    await prisma.$executeRawUnsafe(`
      INSERT INTO "VillageConfig" (id, namaDesa, kecamatan, kabupaten, tahunPajak) 
      VALUES (1, '', '', '', 2026)
    `);

    revalidatePath("/data-pajak");
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getVillageConfig() {
  try {
    const config = (await prisma.$queryRawUnsafe(`SELECT * FROM "VillageConfig" LIMIT 1`)) as any[];
    if (config.length > 0) return config[0];

    // If empty, create empty default and return it
    await prisma.$executeRawUnsafe(`
      INSERT OR IGNORE INTO "VillageConfig" (id, namaDesa, kecamatan, kabupaten, tahunPajak) 
      VALUES (1, '', '', '', 2026)
    `);
    return { id: 1, namaDesa: "", kecamatan: "", kabupaten: "", tahunPajak: 2026 };
  } catch (e) {
    console.error(e);
    return { id: 1, namaDesa: "", kecamatan: "", kabupaten: "", tahunPajak: 2026 };
  }
}

import { VillageConfigSchema, formatZodError } from "@/lib/validations/schemas";

export async function updateVillageConfig(raw: any) {
  try {
    await requireAdmin();
    const data = VillageConfigSchema.parse(raw);
    await prisma.$executeRawUnsafe(
      `
      UPDATE "VillageConfig" 
      SET namaDesa = ?, kecamatan = ?, kabupaten = ?
      WHERE id = 1
    `,
      data.namaDesa.toUpperCase(),
      data.kecamatan.toUpperCase(),
      data.kabupaten.toUpperCase()
    );

    if (data.tahunPajak) {
      await prisma.$executeRawUnsafe(
        `UPDATE "VillageConfig" SET tahunPajak = ? WHERE id = 1`,
        data.tahunPajak
      );
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: formatZodError(error) };
  }
}

export async function getDusuns() {
  return await prisma.dusunReference.findMany({
    orderBy: { name: "asc" },
  });
}

export async function addDusun(name: string) {
  try {
    await requireAdmin();
    const normalized = name.trim().toUpperCase();
    if (!normalized) throw new Error("Nama dusun tidak boleh kosong");

    await prisma.dusunReference.create({
      data: { name: normalized },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") return { success: false, message: "Nama dusun sudah ada" };
    return { success: false, message: error.message };
  }
}

export async function deleteDusun(id: string) {
  try {
    await requireAdmin();
    await prisma.dusunReference.delete({
      where: { id },
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Fallback to Raw Queries because Prisma Generate might fail on Windows due to file locks
export async function getRegionOtomations(): Promise<
  { id: string; code: string; dusun: string; type: string }[]
> {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "RegionOtomation" ORDER BY type ASC, code ASC`
    );
    return rows as { id: string; code: string; dusun: string; type: string }[];
  } catch (e) {
    console.error("Raw Query Error:", e);
    return [];
  }
}

export async function addRegionOtomation(type: "RT" | "RW", code: string, dusun: string) {
  try {
    await requireAdmin();
    const normCode = code.trim().padStart(2, "0");
    if (!normCode || !dusun) throw new Error("Kode dan Dusun harus diisi");

    // Manual Upsert using raw queries
    const existing = (await prisma.$queryRawUnsafe(
      `SELECT id FROM "RegionOtomation" WHERE code = ?`,
      normCode
    )) as any[];

    if (existing && existing.length > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE "RegionOtomation" SET dusun = ?, type = ? WHERE code = ?`,
        dusun,
        type,
        normCode
      );
    } else {
      const id = crypto.randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO "RegionOtomation" (id, type, code, dusun) VALUES (?, ?, ?, ?)`,
        id,
        type,
        normCode,
        dusun
      );
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Raw Add Error:", error);
    return { success: false, message: error.message };
  }
}

export async function deleteRegionOtomation(id: string) {
  try {
    await requireAdmin();
    await prisma.$executeRawUnsafe(`DELETE FROM "RegionOtomation" WHERE id = ?`, id);
    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Raw Delete Error:", error);
    return { success: false, message: error.message };
  }
}
