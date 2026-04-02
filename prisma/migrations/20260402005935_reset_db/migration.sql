/*
  Warnings:

  - You are about to drop the `AddressLearning` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[type,code]` on the table `RegionOtomation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "AddressLearning_addressPattern_key";

-- DropIndex
DROP INDEX "AuditLog_userId_idx";

-- DropIndex
DROP INDEX "AuditLog_action_idx";

-- DropIndex
DROP INDEX "RegionOtomation_code_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AddressLearning";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VillageConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "namaDesa" TEXT NOT NULL DEFAULT '',
    "kecamatan" TEXT NOT NULL DEFAULT '',
    "kabupaten" TEXT NOT NULL DEFAULT '',
    "alamatKantor" TEXT,
    "email" TEXT,
    "kodePos" TEXT,
    "namaKades" TEXT,
    "tahunPajak" INTEGER NOT NULL DEFAULT 2026,
    "jatuhTempo" TEXT NOT NULL DEFAULT '31 Agustus',
    "bapendaUrl" TEXT,
    "isJombangBapenda" BOOLEAN NOT NULL DEFAULT false,
    "enableBapendaSync" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "mapCenterLat" REAL NOT NULL DEFAULT -7.5744,
    "mapCenterLng" REAL NOT NULL DEFAULT 112.235,
    "mapDefaultZoom" INTEGER NOT NULL DEFAULT 15,
    "showNominalPajak" BOOLEAN NOT NULL DEFAULT false,
    "enableDigitalArchive" BOOLEAN NOT NULL DEFAULT false,
    "archiveOnlyLunas" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_VillageConfig" ("id", "kabupaten", "kecamatan", "logoUrl", "namaDesa", "showNominalPajak", "tahunPajak") SELECT "id", "kabupaten", "kecamatan", "logoUrl", "namaDesa", "showNominalPajak", "tahunPajak" FROM "VillageConfig";
DROP TABLE "VillageConfig";
ALTER TABLE "new_VillageConfig" RENAME TO "VillageConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RegionOtomation_type_code_key" ON "RegionOtomation"("type", "code");

-- CreateIndex
CREATE INDEX "TaxData_tahun_paymentStatus_dusun_idx" ON "TaxData"("tahun", "paymentStatus", "dusun");

-- CreateIndex
CREATE INDEX "TaxData_tahun_paymentStatus_penarikId_idx" ON "TaxData"("tahun", "paymentStatus", "penarikId");
