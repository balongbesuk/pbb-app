import ExcelJS from "exceljs";
import { prisma } from "./prisma";
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

export async function parseExcel(buffer: Buffer | any): Promise<ExcelRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const worksheet = workbook.worksheets[0];

  const data: ExcelRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    // Clean data Helper
    const getNop = (val: any) => String(val || "").trim();
    const getNum = (val: any) => {
      // Handle Excel Formula results
      if (typeof val === "object" && val !== null && "result" in val)
        return Number((val as any).result || 0);
      return Number(val || 0);
    };
    const getDate = (val: any) => {
      if (val instanceof Date) return val;
      if (typeof val === "string" && val.trim() !== "") return new Date(val);
      return null;
    };

    const nop = getNop(row.getCell(1).value);
    if (!nop || nop === "") return; // Guard against empty rows

    data.push({
      nop: nop,
      namaWp: String(row.getCell(2).value || ""),
      alamatObjek: String(row.getCell(3).value || ""),
      luasTanah: getNum(row.getCell(4).value),
      luasBangunan: getNum(row.getCell(5).value),
      ketetapan: getNum(row.getCell(6).value),
      tagihanDenda: getNum(row.getCell(7).value),
      pembayaran: getNum(row.getCell(8).value),
      pokok: getNum(row.getCell(9).value),
      denda: getNum(row.getCell(10).value),
      lebihBayar: getNum(row.getCell(11).value),
      tanggalBayar: getDate(row.getCell(12).value),
      sisaTagihan: getNum(row.getCell(13).value),
      tempatBayar: String(row.getCell(14).value || ""),
    });
  });

  return data;
}

export async function processTaxData(rows: ExcelRow[], tahun: number) {
  // Load references for matching
  // Load references and existing data for the year
  const [dusunRef, mappings, regions, otomations, existingTaxes] = await Promise.all([
    prisma.dusunReference.findMany(),
    prisma.taxMapping.findMany(),
    prisma.villageRegion.findMany(),
    prisma.$queryRawUnsafe(`SELECT * FROM "RegionOtomation"`) as Promise<any[]>,
    prisma.taxData.findMany({ where: { tahun }, select: { nop: true, paymentStatus: true } }),
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

  // Set existing NOPs for this year
  const existingNopsSet = new Set(existingTaxes.map((t: any) => t.nop));
  const newExcelNopsSet = new Set(rows.map((r: any) => r.nop));

  // Reduced batch size for SQLite parameter limits on Windows
  // and ensured dates for createdAt/updatedAt
  const BATCH_SIZE = 100;
  const processedData: any[] = [];
  const now = new Date();

  for (const row of rows) {
    // 1. JIKA NOP SUDAH ADA DI SISTEM TAHUN INI --> HIRAUKAN
    if (existingNopsSet.has(row.nop)) {
      continue;
    }

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
    let paymentStatus = "BELUM_LUNAS";
    if (row.ketetapan === 0) paymentStatus = "TIDAK_TERBIT";
    else if (row.sisaTagihan <= 0 && row.pembayaran > 0) paymentStatus = "LUNAS";

    processedData.push({
      ...row,
      tahun,
      rt,
      rw,
      dusun,
      penarikId,
      status,
      paymentStatus,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Batch insert valid new rows
  for (let i = 0; i < processedData.length; i += BATCH_SIZE) {
    const batch = processedData.slice(i, i + BATCH_SIZE);
    try {
      await prisma.taxData.createMany({
        data: batch,
      });
    } catch (e: any) {
      console.error(`Error in batch ${i}:`, e);
      // Fallback
      for (const item of batch) {
        try {
          await prisma.taxData.create({ data: item });
        } catch (innerError) {
          console.warn(`Skipping row ${item.nop} due to error`);
        }
      }
    }
  }

  // 4. JIKA NOP ADA DI SISTEM, TAPI TIDAK ADA DI EXCEL BARU -> UBAH JADI LUNAS
  const nopsToMarkLunas: string[] = [];
  for (const t of existingTaxes) {
    if (!newExcelNopsSet.has(t.nop) && t.paymentStatus !== "LUNAS") {
      nopsToMarkLunas.push(t.nop);
    }
  }

  if (nopsToMarkLunas.length > 0) {
    // Update them to LUNAS indicating they've been paid and removed from latest DHKP
    await prisma.taxData.updateMany({
      where: {
        tahun: tahun,
        nop: { in: nopsToMarkLunas },
      },
      data: {
        paymentStatus: "LUNAS",
        pembayaran: 0,
        sisaTagihan: 0,
      },
    });
  }

  return processedData.length + nopsToMarkLunas.length;
}

export async function processBackupAssignments(buffer: Buffer | any, tahun: number) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];

  const assignments: { username: string; nop: string; dusun: string; rt: string; rw: string }[] =
    [];
  let currentUsername = "";

  const getVal = (row: ExcelJS.Row, col: number) => {
    const v = row.getCell(col).value;
    if (v === null || v === undefined) return "";
    if (typeof v === "object") {
      if ("richText" in v && Array.isArray(v.richText))
        return v.richText
          .map((rt: any) => rt.text)
          .join("")
          .trim();
      if ("text" in v) return String(v.text).trim();
      return "";
    }
    return String(v).trim();
  };

  let usernameCol = 2;
  let nopCol = 4;
  let dusunCol = 5;
  let rtCol = 6;
  let rwCol = 7;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell, colNumber) => {
        const val = String(cell.value || "").toLowerCase();
        if (val.includes("username")) usernameCol = colNumber;
        else if (val.includes("nop")) nopCol = colNumber;
        else if (val === "dusun") dusunCol = colNumber;
        else if (val === "rt") rtCol = colNumber;
        else if (val === "rw") rwCol = colNumber;
      });
      return;
    }

    const username = getVal(row, usernameCol);
    const nop = getVal(row, nopCol);
    const dusun = getVal(row, dusunCol);
    const rt = getVal(row, rtCol);
    const rw = getVal(row, rwCol);

    if (username) {
      currentUsername = username;
    }

    if (currentUsername && nop && nop !== "-" && nop.trim() !== "") {
      assignments.push({
        username: currentUsername,
        nop: nop.trim(),
        dusun: dusun,
        rt: rt,
        rw: rw,
      });
    }
  });

  if (assignments.length === 0) {
    console.log("No valid assignments found in file");
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

  console.log(`Processing ${grouped.size} users with total assignments: ${assignments.length}`);

  // Fetch all existing NOPs for this year to do a flexible matching
  const existingTaxData = await prisma.taxData.findMany({
    where: { tahun },
    select: { id: true, nop: true },
  });

  console.log(`DB has ${existingTaxData.length} tax records for year ${tahun}`);

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
      console.log(`Updated ${updateResult.count} records for user ${userId}`);
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
      console.log(`Synced ${uniqueMappings.length} mappings to TaxMapping table`);
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

  console.log(`Successfully finished restore. Total updated TaxData: ${updatedCount}`);
  return updatedCount;
}
