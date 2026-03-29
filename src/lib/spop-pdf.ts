import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { SpopFormData } from "@/lib/spop-form";

const execFileAsync = promisify(execFile);
const TEMPLATE_PATH = path.join(process.cwd(), "public", "templates", "spop-lspop-template.xlsx");

type CellUpdate = {
  cell: string;
  sheet: "SPOP1" | "SPOP2" | "LSPOP1" | "LSPOP2";
  value: string;
};

type WorkbookPayload = {
  pdfPath: string;
  updates: CellUpdate[];
  visibleSheets: Array<"SPOP1" | "SPOP2" | "LSPOP1" | "LSPOP2">;
  workbookPath: string;
};

const SPOP_NOP_CELLS = ["I13", "J13", "L13", "M13", "O13", "P13", "Q13", "S13", "T13", "U13", "W13", "X13", "Y13", "AA13", "AB13", "AC13", "AD13", "AF13"];
const SPOP_NOP_BERSAMA_CELLS = ["I15", "J15", "L15", "M15", "O15", "P15", "Q15", "S15", "T15", "U15", "W15", "X15", "Y15", "AA15", "AB15", "AC15", "AD15", "AF15"];
const SPOP_NOP_ASAL_CELLS = ["I19", "J19", "L19", "M19", "O19", "P19", "Q19", "S19", "T19", "U19", "W19", "X19", "Y19", "AA19", "AB19", "AC19", "AD19", "AF19"];
const SPOP_SPPT_LAMA_CELLS = ["I21", "J21", "K21", "L21"];
const SPOP_NAMA_JALAN_OBJEK_CELLS = rangeCells("A", "V", 26);
const SPOP_NOMOR_BLOK_OBJEK_CELLS = rangeCells("X", "AI", 26);
const SPOP_DESA_OBJEK_CELLS = rangeCells("A", "L", 29);
const SPOP_RW_OBJEK_CELLS = ["X29", "Y29"];
const SPOP_RT_OBJEK_CELLS = ["AC29", "AD29"];
const SPOP_NAMA_SUBJEK_CELLS = rangeCells("A", "V", 38);
const SPOP_NPWP_CELLS = rangeCells("X", "AL", 38);
const SPOP_NAMA_JALAN_SUBJEK_CELLS = rangeCells("A", "V", 41);
const SPOP_BLOK_SUBJEK_CELLS = rangeCells("X", "AL", 41);
const SPOP_DESA_SUBJEK_CELLS = rangeCells("A", "V", 44);
const SPOP_RW_SUBJEK_CELLS = ["X44", "Y44"];
const SPOP_RT_SUBJEK_CELLS = ["AC44", "AD44"];
const SPOP_KABKOTA_KODEPOS_CELLS = rangeCells("A", "O", 47);
const SPOP_KTP_CELLS = rangeCells("A", "Q", 50);
const SPOP_LUAS_TANAH_CELLS = ["I54", "J54", "K54", "L54", "M54", "N54", "O54", "P54", "Q54", "R54"];

const LSPOP_NOP_CELLS = ["F14", "G14", "I14", "J14", "L14", "M14", "N14", "P14", "Q14", "R14", "T14", "U14", "V14", "X14", "Y14", "Z14", "AA14", "AC14"];
const LSPOP_LUAS_BANGUNAN_CELLS = ["H31", "I31", "J31", "K31", "L31", "M31", "N31", "O31", "P31"];
const LSPOP_JUMLAH_LANTAI_CELLS = ["Z31", "AA31", "AB31"];
const LSPOP_TAHUN_DIBANGUN_CELLS = ["H35", "I35", "J35", "K35"];
const LSPOP_TAHUN_RENOVASI_CELLS = ["H37", "I37", "J37", "K37"];
const LSPOP_DAYA_LISTRIK_CELLS = ["AD37", "AE37", "AF37", "AG37", "AH37", "AI37", "AJ37", "AK37"];
const LSPOP_LEFT_DATE_CELLS = ["J76", "K76", "L76", "M76", "N76", "O76", "P76", "Q76"];
const LSPOP_RIGHT_DATE_CELLS = ["AD79", "AE79", "AF79", "AG79", "AH79", "AI79", "AJ79", "AK79"];

function rangeCells(start: string, end: string, row: number) {
  const startIndex = columnToNumber(start);
  const endIndex = columnToNumber(end);
  const cells: string[] = [];

  for (let column = startIndex; column <= endIndex; column += 1) {
    cells.push(`${numberToColumn(column)}${row}`);
  }

  return cells;
}

function columnToNumber(column: string) {
  return column
    .toUpperCase()
    .split("")
    .reduce((value, char) => value * 26 + char.charCodeAt(0) - 64, 0);
}

function numberToColumn(value: number) {
  let result = "";
  let current = value;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }

  return result;
}

function cleanText(value: string, maxLength = 120) {
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().toUpperCase().slice(0, maxLength);
}

function cleanDigits(value: string, maxLength = 32) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function normalizeRegion(value?: string | null) {
  const digits = cleanDigits(value || "", 3);
  if (!digits) return "";
  return digits.padStart(2, "0");
}

function compactDate(value: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return cleanDigits(value, 8);

  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = String(parsed.getFullYear());
  return `${day}${month}${year}`;
}

function slashDate(value: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return cleanText(value, 10);

  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = String(parsed.getFullYear());
  return `${day}/${month}/${year}`;
}

function sanitizeFormData(input: SpopFormData): SpopFormData {
  return {
    transactionType: input.transactionType,
    nop: cleanDigits(input.nop, 18),
    nopBersama: cleanDigits(input.nopBersama, 18),
    nopAsal: cleanDigits(input.nopAsal, 18),
    noSpptLama: cleanDigits(input.noSpptLama, 18),
    namaJalanObjek: cleanText(input.namaJalanObjek, 48),
    nomorBlokObjek: cleanText(input.nomorBlokObjek, 20),
    desaObjek: cleanText(input.desaObjek, 30),
    rwObjek: normalizeRegion(input.rwObjek),
    rtObjek: normalizeRegion(input.rtObjek),
    statusSubjek: input.statusSubjek,
    pekerjaan: input.pekerjaan,
    namaSubjekPajak: cleanText(input.namaSubjekPajak, 48),
    npwp: cleanDigits(input.npwp, 20),
    namaJalanSubjek: cleanText(input.namaJalanSubjek, 48),
    blokSubjek: cleanText(input.blokSubjek, 20),
    desaSubjek: cleanText(input.desaSubjek, 30),
    rwSubjek: normalizeRegion(input.rwSubjek),
    rtSubjek: normalizeRegion(input.rtSubjek),
    kabupatenKotaKodePos: cleanText(input.kabupatenKotaKodePos, 30),
    nomorKtp: cleanDigits(input.nomorKtp, 20),
    luasTanah: cleanDigits(input.luasTanah, 10),
    zonaNilaiTanah: cleanText(input.zonaNilaiTanah, 4),
    jenisTanah: input.jenisTanah,
    jumlahBangunan: cleanDigits(input.jumlahBangunan, 3),
    namaPenandatangan: cleanText(input.namaPenandatangan, 48),
    tanggalTandaTangan: input.tanggalTandaTangan,
    petugasPendata: cleanText(input.petugasPendata, 48),
    nipPetugasPendata: cleanDigits(input.nipPetugasPendata, 24),
    pejabatBerwenang: cleanText(input.pejabatBerwenang, 48),
    nipPejabatBerwenang: cleanDigits(input.nipPejabatBerwenang, 24),
    jenisBangunan: input.jenisBangunan,
    bangunanKe: cleanDigits(input.bangunanKe, 3),
    luasBangunan: cleanDigits(input.luasBangunan, 9),
    jumlahLantai: cleanDigits(input.jumlahLantai, 3),
    tahunDibangun: cleanDigits(input.tahunDibangun, 4),
    tahunRenovasi: cleanDigits(input.tahunRenovasi, 4),
    dayaListrik: cleanDigits(input.dayaListrik, 8),
  };
}

function pushValue(updates: CellUpdate[], sheet: CellUpdate["sheet"], cell: string, value: string) {
  updates.push({ cell, sheet, value });
}

function pushMark(updates: CellUpdate[], sheet: CellUpdate["sheet"], cell?: string) {
  if (!cell) return;
  pushValue(updates, sheet, cell, "X");
}

function pushChars(updates: CellUpdate[], sheet: CellUpdate["sheet"], cells: string[], value: string) {
  const chars = Array.from((value || "").slice(0, cells.length).padEnd(cells.length, " "));
  cells.forEach((cell, index) => {
    pushValue(updates, sheet, cell, chars[index] === " " ? "" : chars[index]);
  });
}

function pushText(updates: CellUpdate[], sheet: CellUpdate["sheet"], cell: string, value: string) {
  if (!value) return;
  pushValue(updates, sheet, cell, value);
}

function buildWorkbookPayload(form: SpopFormData): WorkbookPayload {
  const updates: CellUpdate[] = [];
  const hasBuilding = Number(form.luasBangunan || "0") > 0 || Number(form.jumlahBangunan || "0") > 0;

  const transactionMarks: Record<SpopFormData["transactionType"], string> = {
    PENGHAPUSAN: "Z10",
    PEMUTAKHIRAN: "Q10",
    PEREKAMAN: "I10",
  };

  const statusMarks: Record<SpopFormData["statusSubjek"], string> = {
    PEMILIK: "G33",
    PENYEWA: "L33",
    PENGELOLA: "R33",
    PEMAKAI: "X33",
    SENGKETA: "AD33",
  };

  const pekerjaanMarks: Record<SpopFormData["pekerjaan"], string> = {
    PNS: "G35",
    TNI: "L35",
    PENSIUNAN: "R35",
    BADAN: "X35",
    LAINNYA: "AD35",
  };

  const jenisTanahMarks: Record<SpopFormData["jenisTanah"], string> = {
    TANAH_BANGUNAN: "H58",
    KAVLING_SIAP_BANGUN: "P58",
    TANAH_KOSONG: "X58",
    FASILITAS_UMUM: "AE58",
  };

  const lsTransactionMarks: Partial<Record<SpopFormData["transactionType"], string>> = {
    PENGHAPUSAN: "Q7",
    PEMUTAKHIRAN: "F9",
    PEREKAMAN: "F7",
  };

  const jenisBangunanMarks: Record<SpopFormData["jenisBangunan"], string> = {
    PERUMAHAN: "H18",
    PERKANTORAN: "R18",
    PABRIK: "AD18",
    TOKO: "H20",
    RUMAH_SAKIT: "R20",
    OLAHRAGA: "AD20",
    HOTEL: "H22",
    BENGKEL: "R22",
    GEDUNG_PEMERINTAH: "AD22",
    LAINNYA: "H24",
  };

  pushMark(updates, "SPOP1", transactionMarks[form.transactionType]);
  pushChars(updates, "SPOP1", SPOP_NOP_CELLS, form.nop);
  pushChars(updates, "SPOP1", SPOP_NOP_BERSAMA_CELLS, form.nopBersama);
  pushChars(updates, "SPOP1", SPOP_NOP_ASAL_CELLS, form.nopAsal);
  pushChars(updates, "SPOP1", SPOP_SPPT_LAMA_CELLS, form.noSpptLama.slice(-4));
  pushChars(updates, "SPOP1", SPOP_NAMA_JALAN_OBJEK_CELLS, form.namaJalanObjek);
  pushChars(updates, "SPOP1", SPOP_NOMOR_BLOK_OBJEK_CELLS, form.nomorBlokObjek);
  pushChars(updates, "SPOP1", SPOP_DESA_OBJEK_CELLS, form.desaObjek);
  pushChars(updates, "SPOP1", SPOP_RW_OBJEK_CELLS, form.rwObjek);
  pushChars(updates, "SPOP1", SPOP_RT_OBJEK_CELLS, form.rtObjek);
  pushMark(updates, "SPOP1", statusMarks[form.statusSubjek]);
  pushMark(updates, "SPOP1", pekerjaanMarks[form.pekerjaan]);
  pushChars(updates, "SPOP1", SPOP_NAMA_SUBJEK_CELLS, form.namaSubjekPajak);
  pushChars(updates, "SPOP1", SPOP_NPWP_CELLS, form.npwp);
  pushChars(updates, "SPOP1", SPOP_NAMA_JALAN_SUBJEK_CELLS, form.namaJalanSubjek);
  pushChars(updates, "SPOP1", SPOP_BLOK_SUBJEK_CELLS, form.blokSubjek);
  pushChars(updates, "SPOP1", SPOP_DESA_SUBJEK_CELLS, form.desaSubjek);
  pushChars(updates, "SPOP1", SPOP_RW_SUBJEK_CELLS, form.rwSubjek);
  pushChars(updates, "SPOP1", SPOP_RT_SUBJEK_CELLS, form.rtSubjek);
  pushChars(updates, "SPOP1", SPOP_KABKOTA_KODEPOS_CELLS, form.kabupatenKotaKodePos);
  pushChars(updates, "SPOP1", SPOP_KTP_CELLS, form.nomorKtp);
  pushChars(updates, "SPOP1", SPOP_LUAS_TANAH_CELLS, form.luasTanah);
  pushText(updates, "SPOP1", "AG54", form.zonaNilaiTanah.slice(0, 2));
  pushMark(updates, "SPOP1", jenisTanahMarks[form.jenisTanah]);

  pushChars(updates, "SPOP2", ["L3", "M3", "N3"], form.jumlahBangunan);
  pushText(updates, "SPOP2", "A12", form.namaPenandatangan);
  pushText(updates, "SPOP2", "O12", slashDate(form.tanggalTandaTangan));
  pushText(updates, "SPOP2", "K22", slashDate(form.tanggalTandaTangan));
  pushText(updates, "SPOP2", "AD22", slashDate(form.tanggalTandaTangan));
  pushText(updates, "SPOP2", "H26", form.petugasPendata);
  pushText(updates, "SPOP2", "AA26", form.pejabatBerwenang);
  pushText(updates, "SPOP2", "H28", form.nipPetugasPendata);
  pushText(updates, "SPOP2", "AA28", form.nipPejabatBerwenang);

  if (hasBuilding) {
    pushMark(updates, "LSPOP1", lsTransactionMarks[form.transactionType]);
    pushChars(updates, "LSPOP1", LSPOP_NOP_CELLS, form.nop);
    pushMark(updates, "LSPOP1", jenisBangunanMarks[form.jenisBangunan]);
    pushChars(updates, "LSPOP1", LSPOP_LUAS_BANGUNAN_CELLS, form.luasBangunan);
    pushChars(updates, "LSPOP1", LSPOP_JUMLAH_LANTAI_CELLS, form.jumlahLantai);
    pushChars(updates, "LSPOP1", LSPOP_TAHUN_DIBANGUN_CELLS, form.tahunDibangun);
    pushChars(updates, "LSPOP1", LSPOP_TAHUN_RENOVASI_CELLS, form.tahunRenovasi);
    pushChars(updates, "LSPOP1", LSPOP_DAYA_LISTRIK_CELLS, form.dayaListrik);
    pushMark(updates, "LSPOP1", "O39");
    pushMark(updates, "LSPOP1", "O42");
    pushMark(updates, "LSPOP1", "T44");
    pushMark(updates, "LSPOP1", "T46");
    pushMark(updates, "LSPOP1", "O48");
    pushMark(updates, "LSPOP1", "O50");

    pushChars(updates, "LSPOP2", LSPOP_LEFT_DATE_CELLS, compactDate(form.tanggalTandaTangan));
    pushChars(updates, "LSPOP2", LSPOP_RIGHT_DATE_CELLS, compactDate(form.tanggalTandaTangan));
    pushText(updates, "LSPOP2", "J79", slashDate(form.tanggalTandaTangan));
    pushText(updates, "LSPOP2", "J84", form.petugasPendata);
    pushText(updates, "LSPOP2", "AD84", form.pejabatBerwenang);
    pushText(updates, "LSPOP2", "J86", form.nipPetugasPendata);
    pushText(updates, "LSPOP2", "AD86", form.nipPejabatBerwenang);
  }

  return {
    pdfPath: "",
    updates,
    visibleSheets: hasBuilding ? ["SPOP1", "SPOP2", "LSPOP1", "LSPOP2"] : ["SPOP1", "SPOP2"],
    workbookPath: "",
  };
}

function getPowerShellPath() {
  const systemRoot = process.env.SystemRoot || "C:\\Windows";
  return path.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
}

function buildPowerShellScript(payloadPath: string) {
  return `
$ErrorActionPreference = 'Stop'
$payload = Get-Content -LiteralPath '${payloadPath.replace(/'/g, "''")}' -Raw | ConvertFrom-Json
$excel = $null
$workbook = $null
try {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $excel.DisplayAlerts = $false
  $workbook = $excel.Workbooks.Open([string]$payload.workbookPath)
  foreach ($sheet in $workbook.Worksheets) {
    if ($payload.visibleSheets -contains $sheet.Name) {
      $sheet.Visible = -1
    } else {
      $sheet.Visible = 0
    }
  }
  $firstSheet = $workbook.Worksheets.Item([string]$payload.visibleSheets[0])
  $firstSheet.Activate() | Out-Null
  foreach ($update in $payload.updates) {
    $sheet = $workbook.Worksheets.Item([string]$update.sheet)
    $sheet.Range([string]$update.cell).Value2 = [string]$update.value
  }
  $workbook.ExportAsFixedFormat(0, [string]$payload.pdfPath)
} finally {
  if ($workbook) {
    $workbook.Close($false) | Out-Null
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) | Out-Null
  }
  if ($excel) {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
  }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
`;
}

export async function generateSpopPdf(data: SpopFormData) {
  if (process.platform !== "win32") {
    throw new Error("Generator PDF berbasis Excel hanya tersedia di Windows.");
  }

  const formData = sanitizeFormData(data);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "spop-excel-"));
  const workbookPath = path.join(tempDir, `${randomUUID()}.xlsx`);
  const pdfPath = path.join(tempDir, `${randomUUID()}.pdf`);
  const payloadPath = path.join(tempDir, `${randomUUID()}.json`);

  try {
    await fs.copyFile(TEMPLATE_PATH, workbookPath);

    const payload = buildWorkbookPayload(formData);
    payload.workbookPath = workbookPath;
    payload.pdfPath = pdfPath;

    await fs.writeFile(payloadPath, JSON.stringify(payload), "utf8");

    const script = buildPowerShellScript(payloadPath);
    const encodedCommand = Buffer.from(script, "utf16le").toString("base64");

    await execFileAsync(
      getPowerShellPath(),
      ["-NoLogo", "-NoProfile", "-EncodedCommand", encodedCommand],
      { windowsHide: true },
    );

    return await fs.readFile(pdfPath);
  } finally {
    await fs.rm(tempDir, { force: true, recursive: true });
  }
}
