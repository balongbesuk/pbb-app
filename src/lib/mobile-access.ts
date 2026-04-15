import { prisma } from "@/lib/prisma";

export async function isPbbMobileEnabled() {
  try {
    const rows = await prisma.$queryRaw<Array<{ enablePbbMobile: boolean | number | null }>>`
      SELECT "enablePbbMobile"
      FROM "VillageConfig"
      WHERE "id" = 1
      LIMIT 1
    `;

    const value = rows[0]?.enablePbbMobile;
    if (value === null || value === undefined) return true;
    if (typeof value === "number") return value !== 0;
    return value;
  } catch (error) {
    console.error("Failed to read PBB Mobile access flag:", error);
    return true;
  }
}
