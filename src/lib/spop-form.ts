export type SpopTransactionType = "PEMUTAKHIRAN" | "PEREKAMAN" | "PENGHAPUSAN";
export type SpopStatusType = "PEMILIK" | "PENYEWA" | "PENGELOLA" | "PEMAKAI" | "SENGKETA";
export type SpopPekerjaanType = "PNS" | "TNI" | "PENSIUNAN" | "BADAN" | "LAINNYA";
export type SpopJenisTanahType =
  | "TANAH_BANGUNAN"
  | "KAVLING_SIAP_BANGUN"
  | "TANAH_KOSONG"
  | "FASILITAS_UMUM";
export type SpopJenisBangunanType =
  | "PERUMAHAN"
  | "PERKANTORAN"
  | "PABRIK"
  | "TOKO"
  | "RUMAH_SAKIT"
  | "OLAHRAGA"
  | "HOTEL"
  | "BENGKEL"
  | "GEDUNG_PEMERINTAH"
  | "LAINNYA"
  | "BANGUNAN_TIDAK_KENA_PAJAK"
  | "BANGUN_PARKIR"
  | "APARTEMEN"
  | "POMPA_BENSIN"
  | "TANGKI_MINYAK"
  | "GEDUNG_SEKOLAH";

export type SpopKondisiType = "SANGAT_BAIK" | "BAIK" | "SEDANG" | "JELEK";
export type SpopKonstruksiType = "BAJA" | "BETON" | "BATU_BATA" | "KAYU";
export type SpopAtapType = "DECRABON" | "GENTENG_BETON" | "GENTENG_BIASA" | "ASBES" | "SENG";
export type SpopDindingType = "KACA" | "BETON" | "BATA" | "KAYU" | "SENG" | "TANPA_DINDING";
export type SpopLantaiType = "MARMER" | "KERAMIK" | "TERASO" | "UBIN" | "SEMEN";
export type SpopLangitLangitType = "AKUSTIK" | "TRIPLEK" | "TANPA_LANGIT";

export interface SpopSourceTaxData {
  nop: string;
  namaWp: string;
  alamat: string;
  luasTanah: number;
  luasBangunan: number;
  rt?: string | null;
  rw?: string | null;
  dusun?: string | null;
  tahun?: number;
}

export interface SpopFormData {
  transactionType: SpopTransactionType;
  nop: string;
  nopBersama: string;
  nopAsal: string;
  noSpptLama: string;
  namaJalanObjek: string;
  nomorBlokObjek: string;
  desaObjek: string;
  rwObjek: string;
  rtObjek: string;
  statusSubjek: SpopStatusType;
  pekerjaan: SpopPekerjaanType;
  namaSubjekPajak: string;
  npwp: string;
  namaJalanSubjek: string;
  blokSubjek: string;
  desaSubjek: string;
  rwSubjek: string;
  rtSubjek: string;
  kabupaten: string;
  kodePosSubjek: string;
  nomorKtp: string;
  luasTanah: string;
  zonaNilaiTanah: string;
  jenisTanah: SpopJenisTanahType;
  jumlahBangunan: string;
  namaPenandatangan: string;
  tanggalTandaTangan: string;
  petugasPendata: string;
  nipPetugasPendata: string;
  pejabatBerwenang: string;
  nipPejabatBerwenang: string;
  jenisBangunan: SpopJenisBangunanType;
  bangunanKe: string;
  luasBangunan: string;
  jumlahLantai: string;
  tahunDibangun: string;
  tahunRenovasi: string;
  dayaListrik: string;
  kondisi: SpopKondisiType;
  konstruksi: SpopKonstruksiType;
  atap: SpopAtapType;
  dinding: SpopDindingType;
  lantai: SpopLantaiType;
  langitLangit: SpopLangitLangitType;
}

function cleanText(value: string, maxLength = 120) {
  if (!value) return "";
  return value
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanDigits(value: string, maxLength = 32) {
  if (!value) return "";
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function normalizeRegion(value?: string | null) {
  const digits = cleanDigits(value || "", 3);
  if (!digits) return "";
  return digits.padStart(2, "0");
}

function splitAddress(address: string) {
  const normalized = cleanText(address, 180);
  const parts = normalized
    .split(",")
    .map((part) => cleanText(part, 80))
    .filter(Boolean);

  const firstLine = parts[0] || normalized;
  const nomorMatch = normalized.match(/(?:NO|NOMOR|KAV|BLOK)\s*[:.]?\s*([A-Z0-9/-]+)/i);

  return {
    jalan: firstLine.slice(0, 42),
    nomor: nomorMatch?.[1]?.slice(0, 20) || "",
  };
}

export function buildSpopFormDefaults(source: SpopSourceTaxData): SpopFormData {
  const parsedAddress = splitAddress(source.alamat);
  const today = new Date();
  const yyyyMmDd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return {
    transactionType: "PEMUTAKHIRAN",
    nop: cleanDigits(source.nop, 18),
    nopBersama: "",
    nopAsal: cleanDigits(source.nop, 18),
    noSpptLama: cleanDigits(source.nop, 18),
    namaJalanObjek: parsedAddress.jalan || cleanText(source.alamat, 42),
    nomorBlokObjek: parsedAddress.nomor,
    desaObjek: cleanText(source.dusun || "", 30),
    rwObjek: normalizeRegion(source.rw),
    rtObjek: normalizeRegion(source.rt),
    statusSubjek: "PEMILIK",
    pekerjaan: "LAINNYA",
    namaSubjekPajak: cleanText(source.namaWp, 48),
    npwp: "",
    namaJalanSubjek: parsedAddress.jalan || cleanText(source.alamat, 42),
    blokSubjek: parsedAddress.nomor,
    desaSubjek: cleanText(source.dusun || "", 30),
    rwSubjek: normalizeRegion(source.rw),
    rtSubjek: normalizeRegion(source.rt),
    kabupaten: "",
    kodePosSubjek: "",
    nomorKtp: "",
    luasTanah: String(Math.round(Number(source.luasTanah || 0))),
    zonaNilaiTanah: "",
    jenisTanah: Number(source.luasBangunan || 0) > 0 ? "TANAH_BANGUNAN" : "TANAH_KOSONG",
    jumlahBangunan: Number(source.luasBangunan || 0) > 0 ? "1" : "0",
    namaPenandatangan: cleanText(source.namaWp, 48),
    tanggalTandaTangan: yyyyMmDd,
    petugasPendata: "",
    nipPetugasPendata: "",
    pejabatBerwenang: "",
    nipPejabatBerwenang: "",
    jenisBangunan: "PERUMAHAN",
    bangunanKe: "1",
    luasBangunan: String(Math.round(Number(source.luasBangunan || 0))),
    jumlahLantai: Number(source.luasBangunan || 0) > 0 ? "1" : "",
    tahunDibangun: "",
    tahunRenovasi: "",
    dayaListrik: "",
    kondisi: "BAIK",
    konstruksi: "BETON",
    atap: "GENTENG_BIASA",
    dinding: "BATA",
    lantai: "KERAMIK",
    langitLangit: "TRIPLEK",
  };
}
