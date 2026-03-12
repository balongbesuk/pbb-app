import * as XLSX from "xlsx";
import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import { extractRTRW, detectDusun } from "./address-parser";

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

export async function parseExcel(buffer: Buffer | any, isCsv: boolean = false): Promise<ExcelRow[]> {
  // Use XLSX (SheetJS) as it supports both .xlsx AND old .xls formats
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to array of arrays (index 0 is row 1)
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  const data: ExcelRow[] = [];

  // Skip header (i = 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Helper functions to clean data (SheetJS format)
    const getVal = (idx: number) => {
      const val = row[idx];
      return val === undefined || val === null ? "" : val;
    };
    
    const getNop = (idx: number) => {
      const val = getVal(idx);
      return String(val).trim();
    };
    
    const getNum = (idx: number) => {
      const val = getVal(idx);
      if (typeof val === "number") return val;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };
    
    const getDate = (idx: number) => {
      const val = getVal(idx);
      if (val instanceof Date) return val;
      if (typeof val === "number") {
        // Excel serial date to JS date fallback
        return XLSX.SSF.parse_date_code(val) ? new Date((val - 25569) * 86400 * 1000) : null;
      }
      if (typeof val === "string" && val.trim() !== "") {
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
      }
      return null;
    };

    const nop = getNop(0);
    if (!nop || nop === "") continue; // Guard against empty rows

    data.push({
      nop: nop,
      namaWp: String(getVal(1)),
      alamatObjek: String(getVal(2)),
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
      tempatBayar: String(getVal(13)),
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
  const mappingMap = new Map<string, any>(mappings.map((m: any) => [m.nop, m]));
  const regionMap = new Map(regions.map((r: any) => [`${r.dusun}-${r.rt}-${r.rw}`, true]));

  const rwRuleMap = new Map(
    otomations.filter((o: any) => o.type === "RW").map((ru: any) => [ru.code, ru.dusun])
  );
  const rtRuleMap = new Map(
    otomations.filter((o: any) => o.type === "RT").map((ru: any) => [ru.code, ru.dusun])
  );

  // Map NOP -> Existing Record for quick lookup
  const existingTaxMap = new Map(existingTaxes.map((t: any) => [t.nop, t]));

  // Set existing NOPs for this year
  const existingNopsSet = new Set(existingTaxes.map((t: any) => t.nop));
  const newExcelNopsSet = new Set(rows.map((r: any) => r.nop));

  // Reduced batch size for SQLite parameter limits on Windows
  // and ensured dates for createdAt/updatedAt
  const BATCH_SIZE = 100;
  const toCreate: any[] = [];
  const toUpdate: { id: number; data: any }[] = [];
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
      dusun = detectDusun(row.alamatObjek, dusunList);

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

    // Determine Payment Status
    // Determine PaymentStatus based on real numbers
    let paymentStatus = "BELUM_LUNAS";
    if (row.ketetapan === 0) {
      paymentStatus = "TIDAK_TERBIT";
    } else if (row.pembayaran >= row.ketetapan && row.ketetapan > 0) {
      paymentStatus = "LUNAS";
    } else if (row.sisaTagihan <= 0 && row.pembayaran > 0) {
      paymentStatus = "LUNAS";
    }

    const data = {
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
      } catch (e) {
        // Fallback for unique constraint or other issues
        for (const item of batch) {
          try {
            await prisma.taxData.create({ data: item });
          } catch (inner) {}
        }
      }
    }
  }

  // 2. Process updates (Sequential or chunks to avoid locking)
  if (toUpdate.length > 0) {
    // We update payment status and amounts - this is what makes "Update via Excel" work
    for (const item of toUpdate) {
      try {
        await prisma.taxData.update({
          where: { id: item.id },
          data: item.data,
        });
      } catch (e) {
        console.warn(`Failed to update NOP ${item.data.nop}`);
      }
    }
  }

  return toCreate.length + toUpdate.length;
}

export async function processBackupAssignments(
  buffer: Buffer | any,
  tahun: number,
  isCsv: boolean = false
) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  const assignments: { username: string; nop: string; dusun: string; rt: string; rw: string }[] =
    [];
  let currentUsername = "";

  const getColVal = (row: any[], colIdx: number) => {
    const v = row[colIdx];
    return v === undefined || v === null ? "" : String(v).trim();
  };

  let usernameCol = 1; // Col B
  let nopCol = 3;      // Col D
  let dusunCol = 4;    // Col E
  let rtCol = 5;       // Col F
  let rwCol = 6;       // Col G

  // Detect headers
  if (rows.length > 0) {
    const firstRow = rows[0];
    for (let j = 0; j < firstRow.length; j++) {
      const val = String(firstRow[j] || "").toLowerCase();
      if (val.includes("username")) usernameCol = j;
      else if (val.includes("nop")) nopCol = j;
      else if (val === "dusun") dusunCol = j;
      else if (val === "rt") rtCol = j;
      else if (val === "rw") rwCol = j;
    }
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const username = getColVal(row, usernameCol);
    const nop = getColVal(row, nopCol);
    const dusun = getColVal(row, dusunCol);
    const rt = getColVal(row, rtCol);
    const rw = getColVal(row, rwCol);

    if (username) {
      currentUsername = username;
    }

    if (currentUsername && nop && nop !== "-" && nop.trim() !== "") {
      assignments.push({
        username: currentUsername,
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
    select: { id: true, username: true },
  });

  const userMap = new Map(users.map((u) => [u.username.toLowerCase(), u.id]));
  let updatedCount = 0;

  // Group by user for efficiency
  const grouped = new Map<string, typeof assignments>();
  for (const item of assignments) {
    const userId = userMap.get(item.username.toLowerCase());
    if (userId) {
      if (!grouped.has(userId)) grouped.set(userId, []);
      grouped.get(userId)!.push(item);
    }
  }

  console.info(`Processing ${grouped.size} users with total assignments: ${assignments.length}`);

  // Fetch all existing NOPs for this year to do a flexible matching
  const existingTaxData = await prisma.taxData.findMany({
    where: { tahun },
    select: { id: true, nop: true },
  });

  console.info(`DB has ${existingTaxData.length} tax records for year ${tahun}`);

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

      // Deduplicate by NOP - last one wins or first one wins? Let's keep the mapping
      if (!allNopsToMap.has(item.nop)) {
        allNopsToMap.set(item.nop, {
          nop: item.nop,
          penarikId: userId,
          dusun: item.dusun || "",
          rt: item.rt ? parseInt(item.rt, 10).toString().padStart(2, "0") : "",
          rw: item.rw ? parseInt(item.rw, 10).toString().padStart(2, "0") : "",
        });
      }
    }

    if (idsToUpdate.length > 0) {
      const updateResult = await prisma.taxData.updateMany({
        where: { id: { in: idsToUpdate } },
        data: { penarikId: userId },
      });
      updatedCount += updateResult.count;
      console.info(`Updated ${updateResult.count} records for user ${userId}`);
    }
  }

  // 2. Optimized TaxMapping Sync (Delete then CreateMany)
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
          console.info(`Synced ${uniqueMappings.length} mappings to TaxMapping table`);
    } catch (txError) {
      console.error("Mapping sync failed, falling back to individual upserts:", txError);
      // Fallback to individual upserts if createMany fails for some reason
      for (const mapItem of uniqueMappings) {
        await prisma.taxMapping.upsert({
          where: { nop: mapItem.nop },
          update: { ...mapItem },
          create: { ...mapItem },
        });
      }
    }
  }

  console.info(`Successfully finished restore. Total updated TaxData: ${updatedCount}`);
  return updatedCount;
}
