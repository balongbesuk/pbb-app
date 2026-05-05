"use server";
import fs from "fs";
import path from "path";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { VillageConfigSchema, formatZodError } from "@/lib/validations/schemas";
import { Prisma } from "@prisma/client";

type VillageConfigInput = Parameters<typeof VillageConfigSchema.parse>[0];

const supportsEnablePbbMobile = Prisma.dmmf.datamodel.models
  .find((model) => model.name === "VillageConfig")
  ?.fields.some((field) => field.name === "enablePbbMobile") ?? false;

export async function deleteAllTaxData() {
  try {
    await requireAdmin();

    // Delete related transactional records
    await prisma.transferRequest.deleteMany();
    await prisma.taxData.deleteMany();

    // Delete configuration and settings records based on user request
    await prisma.dusunReference.deleteMany();
    await prisma.regionOtomation.deleteMany();
    await prisma.taxMapping.deleteMany();
    await prisma.villageRegion.deleteMany();
    await prisma.notification.deleteMany();

    // Reset Village Config / Profile to empty defaults
    await prisma.villageConfig.deleteMany();
    await prisma.villageConfig.create({
      data: {
        id: 1,
        namaDesa: "",
        kecamatan: "",
        kabupaten: "",
        tahunPajak: 2026,
        jatuhTempo: "31 Agustus",
        bapendaUrl: null,
        isJombangBapenda: true,
        logoUrl: null,
        ...(supportsEnablePbbMobile ? { enablePbbMobile: true } : {}),
      },
    });

    // 1. Reset all users avatarUrl
    await prisma.user.updateMany({
      data: { avatarUrl: null }
    });

    // 2. Physical file deletion (Cleaning public/uploads)
    try {
      const uploadsPath = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads");
      if (fs.existsSync(uploadsPath)) {
        const rootFiles = fs.readdirSync(uploadsPath);
        for (const entry of rootFiles) {
          const entryPath = path.join(uploadsPath, entry);
          if (fs.statSync(entryPath).isFile()) {
            fs.unlinkSync(entryPath);
          }
        }

        // We delete subfolders content but keep the folders structure
        const subfolders = ["avatars", "logos"];
        for (const sub of subfolders) {
          const subPath = path.join(uploadsPath, sub);
          if (fs.existsSync(subPath)) {
            const files = fs.readdirSync(subPath);
            for (const file of files) {
              const filePath = path.join(subPath, file);
              if (fs.statSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to delete physical upload files:", error);
    }

    revalidatePath("/data-pajak");
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    return { success: true };
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}

export const getVillageConfig = cache(async () => {
  try {
    const config = await prisma.villageConfig.findFirst({
      where: { id: 1 },
    });

    if (config) return config;

    // If empty, create empty default and return it
    return await prisma.villageConfig.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        namaDesa: "",
        kecamatan: "",
        kabupaten: "",
        alamatKantor: "",
        email: "",
        kodePos: "",
        namaKades: "",
        tahunPajak: 2026,
        jatuhTempo: "31 Agustus",
        bapendaUrl: null,
        bapendaPaymentUrl: null,
        bapendaRegionName: "Bapenda",
        enableBapendaPayment: true,
        isJombangBapenda: true,
        enableBapendaSync: true,
        showNominalPajak: false,
        enableDigitalArchive: true,
        archiveOnlyLunas: true,
        enablePublicGis: true,
        showUnpaidDetailsGis: false,
        ...(supportsEnablePbbMobile ? { enablePbbMobile: true } : {}),
      },
    });
  } catch (error) {
    console.error(error);
    return { 
      id: 1, 
      namaDesa: "", 
      kecamatan: "", 
      kabupaten: "", 
      alamatKantor: "",
      email: "",
      kodePos: "",
      namaKades: "",
      tahunPajak: 2026, 
      jatuhTempo: "31 Agustus", 
      bapendaUrl: null, 
      bapendaPaymentUrl: null,
      enableBapendaPayment: true,
      bapendaRegionName: "Bapenda",
      isJombangBapenda: true, 
      enableBapendaSync: true,
      logoUrl: null, 
      showNominalPajak: false, 
      enableDigitalArchive: true,
      archiveOnlyLunas: true,
      enablePublicGis: true,
      showUnpaidDetailsGis: false,
      enablePbbMobile: true,
      updatedAt: new Date() 
    };
  }
});

export async function updateVillageConfig(raw: VillageConfigInput) {
  try {
    await requireAdmin();
    const data = VillageConfigSchema.parse(raw);

    const updateData: Prisma.VillageConfigUpdateInput = {};
    if (data.namaDesa !== undefined) updateData.namaDesa = data.namaDesa;
    if (data.kecamatan !== undefined) updateData.kecamatan = data.kecamatan;
    if (data.kabupaten !== undefined) updateData.kabupaten = data.kabupaten;
    if (data.alamatKantor !== undefined) updateData.alamatKantor = data.alamatKantor;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.kodePos !== undefined) updateData.kodePos = data.kodePos;
    if (data.namaKades !== undefined) updateData.namaKades = data.namaKades;

    if (data.tahunPajak !== undefined) {
      updateData.tahunPajak = data.tahunPajak;
    }

    if (data.jatuhTempo !== undefined) {
      updateData.jatuhTempo = data.jatuhTempo;
    }

    if (data.bapendaUrl !== undefined) {
      updateData.bapendaUrl = data.bapendaUrl;
    }
    
    if (data.bapendaPaymentUrl !== undefined) {
      updateData.bapendaPaymentUrl = data.bapendaPaymentUrl;
    }

    if (data.enableBapendaPayment !== undefined) {
      updateData.enableBapendaPayment = data.enableBapendaPayment;
    }

    if (data.bapendaRegionName !== undefined) {
      updateData.bapendaRegionName = data.bapendaRegionName;
    }

    if (data.isJombangBapenda !== undefined) {
      updateData.isJombangBapenda = data.isJombangBapenda;
    }
    
    if (data.enableBapendaSync !== undefined) {
      updateData.enableBapendaSync = data.enableBapendaSync;
    }

    if (data.showNominalPajak !== undefined) {
      updateData.showNominalPajak = data.showNominalPajak;
    }

    if (data.enableDigitalArchive !== undefined) {
      updateData.enableDigitalArchive = data.enableDigitalArchive;
    }

    if (data.archiveOnlyLunas !== undefined) {
      updateData.archiveOnlyLunas = data.archiveOnlyLunas;
    }

    if (data.enablePublicGis !== undefined) {
      updateData.enablePublicGis = data.enablePublicGis;
    }

    if (data.showUnpaidDetailsGis !== undefined) {
      updateData.showUnpaidDetailsGis = data.showUnpaidDetailsGis;
    }

    if (data.mapCenterLat !== undefined) {
      updateData.mapCenterLat = data.mapCenterLat;
    }

    if (data.mapCenterLng !== undefined) {
      updateData.mapCenterLng = data.mapCenterLng;
    }

    if (data.mapDefaultZoom !== undefined) {
      updateData.mapDefaultZoom = data.mapDefaultZoom;
    }

    await prisma.villageConfig.update({
      where: { id: 1 },
      data: updateData,
    });

    if (data.enablePbbMobile !== undefined) {
      await prisma.$executeRaw`
        UPDATE "VillageConfig"
        SET "enablePbbMobile" = ${data.enablePbbMobile}
        WHERE "id" = 1
      `;
    }

    revalidatePath("/settings");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Nama dusun sudah ada" };
    }
    return { success: false, message: formatZodError(error) };
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
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}

export async function getRegionOtomations(): Promise<
  { id: string; code: string; dusun: string; type: string }[]
> {
  try {
    const rows = await prisma.regionOtomation.findMany({
      orderBy: [{ type: "asc" }, { code: "asc" }],
    });
    return rows;
  } catch (error) {
    console.error("Region Otomation Query Error:", error);
    return [];
  }
}

export async function addRegionOtomation(type: "RT" | "RW", code: string, dusun: string) {
  try {
    await requireAdmin();
    const normCode = parseInt(code.trim(), 10).toString().padStart(2, "0");
    if (!normCode || !dusun) throw new Error("Kode dan Dusun harus diisi");

    await prisma.regionOtomation.upsert({
      where: {
        type_code: {
          type: type,
          code: normCode,
        },
      },
      update: { dusun },
      create: { type, code: normCode, dusun },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Add Region Otomation Error:", error);
    return { success: false, message: formatZodError(error) };
  }
}

export async function deleteRegionOtomation(id: string) {
  try {
    await requireAdmin();
    await prisma.regionOtomation.delete({
      where: { id },
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Delete Region Otomation Error:", error);
    return { success: false, message: formatZodError(error) };
  }
}

export async function checkImportRequirements(tahun: number) {
  try {
    const dusunCount = await prisma.dusunReference.count();
    const otomationCount = await prisma.regionOtomation.count();

    const taxCount = await prisma.taxData.count({
      where: { tahun },
    });

    return {
      success: true,
      dusunCount,
      otomationCount,
      taxCount,
    };
  } catch (error) {
    console.error("Check Requirements Error:", error);
    return { success: false, message: "Gagal mengecek persyaratan import" };
  }
}
