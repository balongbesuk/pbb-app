-- Migration: init_baseline
-- Description: Baseline migration capturing the complete schema as of 2026-03-12.
-- This migration was generated from the existing database schema.

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PENGGUNA',
    "dusun" TEXT,
    "rt" TEXT,
    "rw" TEXT,
    "avatarUrl" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TaxData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nop" TEXT NOT NULL,
    "namaWp" TEXT NOT NULL,
    "alamatObjek" TEXT NOT NULL,
    "luasTanah" REAL NOT NULL,
    "luasBangunan" REAL NOT NULL,
    "ketetapan" REAL NOT NULL,
    "tagihanDenda" REAL NOT NULL,
    "pembayaran" REAL NOT NULL,
    "pokok" REAL NOT NULL,
    "denda" REAL NOT NULL,
    "lebihBayar" REAL NOT NULL,
    "tanggalBayar" DATETIME,
    "sisaTagihan" REAL NOT NULL,
    "tempatBayar" TEXT,
    "tahun" INTEGER NOT NULL,
    "dusun" TEXT,
    "rt" TEXT,
    "rw" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNMATCHED',
    "paymentStatus" TEXT NOT NULL DEFAULT 'BELUM_LUNAS',
    "penarikId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaxData_penarikId_fkey" FOREIGN KEY ("penarikId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransferRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taxId" INTEGER NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GIVE',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TransferRequest_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "TaxData" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TransferRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TransferRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VillageRegion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dusun" TEXT NOT NULL,
    "rt" TEXT NOT NULL,
    "rw" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "DusunReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TaxMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nop" TEXT NOT NULL,
    "rt" TEXT NOT NULL,
    "rw" TEXT NOT NULL,
    "dusun" TEXT NOT NULL,
    "penarikId" TEXT,
    CONSTRAINT "TaxMapping_penarikId_fkey" FOREIGN KEY ("penarikId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AddressLearning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "addressPattern" TEXT NOT NULL,
    "rt" TEXT NOT NULL,
    "rw" TEXT NOT NULL,
    "dusun" TEXT NOT NULL,
    "confidence" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "RegionOtomation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'RW',
    "code" TEXT NOT NULL,
    "dusun" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "VillageConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "namaDesa" TEXT NOT NULL DEFAULT '',
    "kecamatan" TEXT NOT NULL DEFAULT '',
    "kabupaten" TEXT NOT NULL DEFAULT '',
    "tahunPajak" INTEGER NOT NULL DEFAULT 2026,
    "logoUrl" TEXT,
    "showNominalPajak" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "TaxData_nop_idx" ON "TaxData"("nop");

-- CreateIndex
CREATE INDEX "TaxData_tahun_idx" ON "TaxData"("tahun");

-- CreateIndex
CREATE INDEX "TaxData_rt_rw_idx" ON "TaxData"("rt", "rw");

-- CreateIndex
CREATE INDEX "TaxData_status_idx" ON "TaxData"("status");

-- CreateIndex
CREATE INDEX "TaxData_paymentStatus_idx" ON "TaxData"("paymentStatus");

-- CreateIndex
CREATE INDEX "TaxData_penarikId_idx" ON "TaxData"("penarikId");

-- CreateIndex
CREATE INDEX "TaxData_tahun_penarikId_idx" ON "TaxData"("tahun", "penarikId");

-- CreateIndex
CREATE UNIQUE INDEX "VillageRegion_dusun_rt_rw_key" ON "VillageRegion"("dusun", "rt", "rw");

-- CreateIndex
CREATE UNIQUE INDEX "DusunReference_name_key" ON "DusunReference"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TaxMapping_nop_key" ON "TaxMapping"("nop");

-- CreateIndex
CREATE UNIQUE INDEX "AddressLearning_addressPattern_key" ON "AddressLearning"("addressPattern");

-- CreateIndex
CREATE UNIQUE INDEX "RegionOtomation_code_key" ON "RegionOtomation"("code");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

