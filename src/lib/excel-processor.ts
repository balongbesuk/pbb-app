import * as XLSX from "xlsx";
import { prisma } from "./prisma";
import type {
  PaymentStatus,
  RegionOtomation,
  TaxData,
  TaxMapping,
  VillageRegion,
} from "@prisma/client";
import Fuse from "fuse.js";
import { extractRTRW, detectDusun } from "./address-parser";
import { sanitizeExcelText } from "./export-safety";

export interface ExcelRow {
  nop: string;
  namaWp: string;
  alamatObjek: string;
  luasTanah: number;
  luasBangunan: number;
  ketetapan: number;
  tagihanDenda: number;
  pembayaran: number;
  pokok: number;
  denda: number;
  lebihBayar: number;
  tanggalBayar: Date | null;
  sisaTagihan: number;
  tempatBayar: string;
}

type CellValue = string | number | boolean | Date | null | undefined;
type ExcelSheetRow = CellValue[];
type TaxProcessingPayload = ExcelRow & {
  tahun: number;
  rt: string | null;
  rw: string | null;
  dusun: string | null;
  penarikId: string | null;
  status: string;
  paymentStatus: PaymentStatus;
  updatedAt: Date;
};

type TaxCreatePayload = TaxProcessingPayload & {
  createdAt: Date;
};

export async function parseExcel(buffer: Buffer, _isCsv: boolean = false): Promise<ExcelRow[]> {
  // Use XLSX (SheetJS) as it supports both .xlsx AND old .xls formats
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to array of arrays (index 0 is row 1)
  const rows = XLSX.utils.sheet_to_json<ExcelSheetRow>(worksheet, { header: 1 });

  const data: ExcelRow[] = [];

  // Skip header (i = 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Helper functions to clean data (SheetJS format)
    const getVal = (idx: number): CellValue => {
      const val = row[idx];
      return val === undefined || val === null ? "" : val;
    };
    
    const getNop = (idx: number) => {
      const val = getVal(idx);
      return sanitizeExcelText(String(val).trim());
    };
    
    const getNum = (idx: number): number => {
      const val = getVal(idx);
      if (typeof val === "number") return val;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };
    
    const getDate = (idx: number): Date | null => {
      const val = getVal(idx);
      if (val instanceof Date) return val;
      if (typeof val === "number") {
        // Excel serial date to JS date fallback
        return XLSX.SSF.parse_date_code(val) ? new Date((val - 25569) * 86400 * 1000) : null;
      }
      if (typeof val === "string" && val.trim() !== "") {
        const str = val.trim().toUpperCase();
        
        // 1. Cek format DD-MMM-YY (Contoh: 04-MEI-26)
        const idMonthMatch = str.match(/^(\d{1,2})[/-]([A-Z]{3})[/-](\d{2,4})$/);
        if (idMonthMatch) {
          const day = parseInt(idMonthMatch[1], 10);
          const monthStr = idMonthMatch[2];
          let year = idMonthMatch[3];
          if (year.length === 2) year = "20" + year;

          const months: Record<string, number> = {
            JAN: 0, FEB: 1, MAR: 2, APR: 3, MEI: 4, JUN: 5,
            JUL: 6, AGT: 7, AGS: 7, SEP: 8, OKT: 9, NOV: 10, DES: 11
          };

          if (months[monthStr] !== undefined) {
            return new Date(parseInt(year, 10), months[monthStr], day);
          }
        }

        // 2. Cek format DD-MM-YYYY atau DD/MM/YYYY
        const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
        if (dmyMatch) {
          const day = parseInt(dmyMatch[1], 10);
          const month = parseInt(dmyMatch[2], 10) - 1;
          let year = dmyMatch[3];
          if (year.length === 2) year = "20" + year;
          const d = new Date(parseInt(year, 10), month, day);
          return isNaN(d.getTime()) ? null : d;
        }
        
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
      }
      return null;
    };

    const nop = getNop(0);
    if (!nop || nop === "") continue; // Guard against empty rows

    data.push({
      nop: nop,
      namaWp: sanitizeExcelText(String(getVal(1))),
      alamatObjek: sanitizeExcelText(String(getVal(2))),
      luasTanah: getNum(3),
      luasBangunan: getNum(4),
      ketetapan: getNum(5),
      tagihanDenda: getNum(6),
      pembayaran: getNum(7),
      pokok: getNum(8),
      denda: getNum(9),
      lebihBayar: getNum(10),
      tanggalBayar: getDate(11),
      sisaTagihan: getNum(12),
      tempatBayar: sanitizeExcelText(String(getVal(13))),
    });
  }

  return data;
}

export async function processTaxData(rows: ExcelRow[], tahun: number) {
  // Load references for matching
  // Load references and existing data for the year
  const [dusunRef, mappings, regions, otomations, existingTaxes] = await Promise.all([
    prisma.dusunReference.findMany(),
    prisma.taxMapping.findMany(),
    prisma.villageRegion.findMany(),
    prisma.regionOtomation.findMany(),
    prisma.taxData.findMany({ where: { tahun }, select: { id: true, nop: true, paymentStatus: true } }),
  ]);

  const dusunList = dusunRef.map((d: { name: string }) => d.name);
  const mappingMap = new Map<string, TaxMapping>(mappings.map((mapping) => [mapping.nop, mapping]));
  const regionMap = new Map(
    regions.map((region: VillageRegion) => [`${region.dusun}-${region.rt}-${region.rw}`, true])
  );

  const rwRuleMap = new Map(
    otomations
      .filter((automation: RegionOtomation) => automation.type === "RW")
      .map((rule) => [rule.code, rule.dusun])
  );
  const rtRuleMap = new Map(
    otomations
      .filter((automation: RegionOtomation) => automation.type === "RT")
      .map((rule) => [rule.code, rule.dusun])
  );

  // Map NOP -> Existing Record for quick lookup
  const existingTaxMap = new Map(existingTaxes.map((tax: Pick<TaxData, "id" | "nop" | "paymentStatus">) => [tax.nop, tax]));

  // Pre-initialize Fuse instance for fuzzy matching
  const fuse = new Fuse(dusunList, {
    threshold: 0.2,
    distance: 100,
  });

  // Reduced batch size for SQLite parameter limits on Windows
  // SQLite default limit is 999 parameters. 20+ fields * 40 rows = ~800-900 params.
  const BATCH_SIZE = 40;
  const toCreate: TaxCreatePayload[] = [];
  const toUpdate: { id: number; data: TaxProcessingPayload }[] = [];
  const now = new Date();

  for (const row of rows) {
    const existing = existingTaxMap.get(row.nop);

    let rt: string | null = null;
    let rw: string | null = null;
    let dusun: string | null = null;
    let penarikId: string | null = null;
    let status = "UNMATCHED";

    // 1. Check Historical Mapping
    const existingMapping = mappingMap.get(row.nop);
    if (existingMapping) {
      rt = existingMapping.rt;
      rw = existingMapping.rw;
      dusun = existingMapping.dusun;
      penarikId = existingMapping.penarikId;
      status = "MATCHED";
    } else {
      // 2. Auto Detect
      const extracted = extractRTRW(row.alamatObjek);
      rt = extracted.rt;
      rw = extracted.rw;
      dusun = detectDusun(row.alamatObjek, dusunList, fuse);

      // 3. Fallback to RW/RT Rule if Dusun is still unknown
      if (!dusun && rw) {
        dusun = (rwRuleMap.get(rw) as string) || null;
      }
      if (!dusun && rt) {
        dusun = (rtRuleMap.get(rt) as string) || null;
      }

      if (rt && rw && dusun) {
        if (regionMap.has(`${dusun}-${rt}-${rw}`)) {
          status = "MATCHED";
        }
      }
    }

    // Determine Payment Status based on real numbers
    let paymentStatus: PaymentStatus = "BELUM_LUNAS";
    if (row.ketetapan === 0) {
      paymentStatus = "TIDAK_TERBIT";
    } else if (row.pembayaran >= row.ketetapan && row.ketetapan > 0) {
      paymentStatus = "LUNAS";
    } else if (row.sisaTagihan <= 0 && row.pembayaran > 0) {
      paymentStatus = "LUNAS";
    }

    // Force set tanggalBayar if LUNAS but date is missing
    if (paymentStatus === "LUNAS" && (!row.tanggalBayar || isNaN(new Date(row.tanggalBayar).getTime()))) {
      row.tanggalBayar = now;
    }

    const data: TaxProcessingPayload = {
      ...row,
      tahun,
      rt,
      rw,
      dusun,
      penarikId,
      status,
      paymentStatus,
      updatedAt: now,
    };

    if (existing) {
      // If it exists, we'll update it later
      toUpdate.push({ id: existing.id, data });
    } else {
      // If new, prepare for batch insert
      toCreate.push({ ...data, createdAt: now });
    }
  }

  // 1. Batch insert new records (Faster)
  if (toCreate.length > 0) {
    for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
      const batch = toCreate.slice(i, i + BATCH_SIZE);
      try {
        await prisma.taxData.createMany({ data: batch });
      } catch {
        // Fallback for unique constraint or other issues
        for (const item of batch) {
          try {
            await prisma.taxData.create({ data: item });
          } catch {}
        }
      }
    }
  }

  // 2. Process updates in transactions to speed up sequential updates
  if (toUpdate.length > 0) {
    const UPDATE_BATCH_SIZE = 100;
    for (let i = 0; i < toUpdate.length; i += UPDATE_BATCH_SIZE) {
      const batch = toUpdate.slice(i, i + UPDATE_BATCH_SIZE);
      try {
        await prisma.$transaction(
          batch.map((item) =>
            prisma.taxData.update({
              where: { id: item.id },
              data: item.data,
            })
          )
        );
      } catch (err) {
        console.error("Batch update failed, falling back to individual updates:", err);
        // Fallback to individual updates if batch fails
        for (const item of batch) {
          try {
            await prisma.taxData.update({
              where: { id: item.id },
              data: item.data,
            });
          } catch (itemErr) {
            console.warn(`Failed to update NOP ${item.data.nop}:`, itemErr);
          }
        }
      }
    }
  }

  return toCreate.length + toUpdate.length;
}

export async function processBackupAssignments(
  buffer: Buffer,
  tahun: number,
  _isCsv: boolean = false
) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<ExcelSheetRow>(worksheet, { header: 1 });

  const assignments: { identifier: string; nop: string; dusun: string; rt: string; rw: string }[] =
    [];
  let currentIdentifier = "";

  const getColVal = (row: ExcelSheetRow, colIdx: number): string => {
    if (colIdx === -1) return "";
    const v = row[colIdx];
    return v === undefined || v === null ? "" : sanitizeExcelText(String(v).trim());
  };

  let usernameCol = -1;
  let nameCol = -1;
  let nopCol = -1;
  let dusunCol = -1;
  let rtCol = -1;
  let rwCol = -1;

  // Detect headers with more flexibility
  if (rows.length > 0) {
    const firstRow = rows[0];
    for (let j = 0; j < firstRow.length; j++) {
      const val = String(firstRow[j] || "").toLowerCase();
      if (
        val.includes("username") ||
        val.includes("user id") ||
        (val.includes("user") && !val.includes("name"))
      ) {
        usernameCol = j;
      } else if (
        val.includes("nama") ||
        val.includes("penarik") ||
        val.includes("petugas") ||
        val.includes("collector")
      ) {
        nameCol = j;
      } else if (val.includes("nop") || val.includes("nomor objek")) {
        nopCol = j;
      } else if (val.includes("dusun")) {
        dusunCol = j;
      } else if (val.includes("rt")) {
        rtCol = j;
      } else if (val.includes("rw")) {
        rwCol = j;
      }
    }
  }

  // Fallback defaults if headers not detected
  if (nopCol === -1) nopCol = 0;
  if (usernameCol === -1 && nameCol === -1) usernameCol = 1;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const username = getColVal(row, usernameCol);
    const name = getColVal(row, nameCol);
    const nop = getColVal(row, nopCol);
    const dusun = getColVal(row, dusunCol);
    const rt = getColVal(row, rtCol);
    const rw = getColVal(row, rwCol);

    // Prioritize username, then name
    const identifier = username || name;

    if (identifier) {
      currentIdentifier = identifier;
    }

    if (currentIdentifier && nop && nop !== "-" && nop.trim() !== "") {
      assignments.push({
        identifier: currentIdentifier,
        nop: nop.trim(),
        dusun: dusun,
        rt: rt ? parseInt(rt, 10).toString().padStart(2, "0") : "",
        rw: rw ? parseInt(rw, 10).toString().padStart(2, "0") : "",
      });
    }
  }

  if (assignments.length === 0) {
    console.warn("No valid assignments found in file");
    return 0;
  }

  // Get all users
  const users = await prisma.user.findMany({
    where: { role: "PENARIK" },
    select: { id: true, username: true, name: true },
  });

  const usernameMap = new Map(users.map((u) => [u.username.toLowerCase(), u.id]));
  const nameMap = new Map(users.map((u) => [u.name?.toLowerCase() || "", u.id]));

  let updatedCount = 0;

  // Group by user for efficiency
  const grouped = new Map<string, typeof assignments>();
  for (const item of assignments) {
    const idLower = item.identifier.toLowerCase();
    const userId = usernameMap.get(idLower) || nameMap.get(idLower);

    if (userId) {
      if (!grouped.has(userId)) grouped.set(userId, []);
      grouped.get(userId)!.push(item);
    }
  }

  // Fetch all existing NOPs for this year
  const existingTaxData = await prisma.taxData.findMany({
    where: { tahun },
    select: { id: true, nop: true },
  });

  // Map of cleaned NOP -> Database ID
  const cleanToId = new Map(existingTaxData.map((t) => [t.nop.replace(/[^0-9]/g, ""), t.id]));
  const allNopsToMap = new Map<
    string,
    { nop: string; penarikId: string; dusun: string; rt: string; rw: string }
  >();

  for (const [userId, items] of grouped.entries()) {
    const idsToUpdate: number[] = [];

    for (const item of items) {
      const cleanNop = item.nop.replace(/[^0-9]/g, "");
      const dbId = cleanToId.get(cleanNop);
      if (dbId) {
        idsToUpdate.push(dbId);
      }

      // Deduplicate by NOP
      if (!allNopsToMap.has(item.nop)) {
        allNopsToMap.set(item.nop, {
          nop: item.nop,
          penarikId: userId,
          dusun: item.dusun || "",
          rt: item.rt || "",
          rw: item.rw || "",
        });
      }
    }

    if (idsToUpdate.length > 0) {
      const updateResult = await prisma.taxData.updateMany({
        where: { id: { in: idsToUpdate } },
        data: { penarikId: userId },
      });
      updatedCount += updateResult.count;
    }
  }

  // Optimized TaxMapping Sync
  const uniqueMappings = Array.from(allNopsToMap.values());
  if (uniqueMappings.length > 0) {
    const nops = uniqueMappings.map((a) => a.nop);

    try {
      await prisma.$transaction([
        prisma.taxMapping.deleteMany({
          where: { nop: { in: nops } },
        }),
        prisma.taxMapping.createMany({
          data: uniqueMappings,
        }),
      ]);
    } catch (txError) {
      console.error("Mapping sync failed, falling back to individual upserts:", txError);
      for (const mapItem of uniqueMappings) {
        await prisma.taxMapping.upsert({
          where: { nop: mapItem.nop },
          update: { ...mapItem },
          create: { ...mapItem },
        });
      }
    }
  }
  return updatedCount;
}
