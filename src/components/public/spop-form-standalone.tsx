"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  buildSpopFormDefaults,
  type SpopAtapType,
  type SpopDindingType,
  type SpopFormData,
  type SpopJenisBangunanType,
  type SpopJenisTanahType,
  type SpopKondisiType,
  type SpopKonstruksiType,
  type SpopLangitLangitType,
  type SpopLantaiType,
  type SpopPekerjaanType,
  type SpopSourceTaxData,
  type SpopStatusType,
  type SpopTransactionType,
} from "@/lib/spop-form";
import { buildSpopPrintHtml } from "@/lib/spop-print";
import { getVillageConfig } from "@/app/actions/settings-actions";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, Eye, Printer, Search, FileText } from "lucide-react";
import { toast } from "sonner";
import { usePublicThemeContext } from "./public-theme-provider";

const MAX_NAME = 21;
const MAX_ADDR = 21;
const MAX_VILLAGE = 11;
const MAX_REGENCY = 8;

const sanitizeInput = (val: string, max: number) => 
  val.replace(/[<>]/g, "").trimStart().slice(0, max).toUpperCase();


interface SpopFormStandaloneProps {
  initialTaxData?: SpopSourceTaxData | null;
}

const steps = [
  { id: 1, label: "Objek Pajak" },
  { id: 2, label: "Subjek Pajak" },
  { id: 3, label: "Data Bangunan" },
  { id: 4, label: "Preview SPOP" },
];

type BuildingCategoryKey =
  | "kondisi"
  | "konstruksi"
  | "atap"
  | "dinding"
  | "lantai"
  | "langitLangit";

type BuildingCategoryValueMap = {
  kondisi: SpopKondisiType;
  konstruksi: SpopKonstruksiType;
  atap: SpopAtapType;
  dinding: SpopDindingType;
  lantai: SpopLantaiType;
  langitLangit: SpopLangitLangitType;
};

const transactionOptions: Array<{ value: SpopTransactionType; label: string }> = [
  { value: "PEMUTAKHIRAN", label: "Pemutakhiran" },
  { value: "PEREKAMAN", label: "Perekaman" },
  { value: "PENGHAPUSAN", label: "Penghapusan" },
];

const jenisTanahOptions: Array<{ value: SpopJenisTanahType; label: string }> = [
  { value: "TANAH_BANGUNAN", label: "Tanah + Bangunan" },
  { value: "KAVLING_SIAP_BANGUN", label: "Kavling Siap Bangun" },
  { value: "TANAH_KOSONG", label: "Tanah Kosong" },
  { value: "FASILITAS_UMUM", label: "Fasilitas Umum" },
];

const statusSubjekOptions: Array<{ value: SpopStatusType; label: string }> = [
  { value: "PEMILIK", label: "Pemilik" },
  { value: "PENYEWA", label: "Penyewa" },
  { value: "PENGELOLA", label: "Pengelola" },
  { value: "PEMAKAI", label: "Pemakai" },
  { value: "SENGKETA", label: "Sengketa" },
];

const pekerjaanOptions: Array<{ value: SpopPekerjaanType; label: string }> = [
  { value: "PNS", label: "PNS" },
  { value: "TNI", label: "TNI / POLRI" },
  { value: "PENSIUNAN", label: "Pensiunan" },
  { value: "BADAN", label: "Badan" },
  { value: "LAINNYA", label: "Lainnya" },
];

const jenisBangunanOptions: Array<{ value: SpopJenisBangunanType; label: string }> = [
  { value: "PERUMAHAN", label: "Perumahan" },
  { value: "PERKANTORAN", label: "Perkantoran" },
  { value: "PABRIK", label: "Pabrik" },
  { value: "TOKO", label: "Toko / Ruko" },
  { value: "RUMAH_SAKIT", label: "RS / Klinik" },
  { value: "OLAHRAGA", label: "Olahraga" },
  { value: "HOTEL", label: "Hotel / Wisma" },
  { value: "BENGKEL", label: "Bengkel / Gd." },
  { value: "GEDUNG_PEMERINTAH", label: "Gedung Pem." },
  { value: "LAINNYA", label: "Lain-lain" },
  { value: "BANGUNAN_TIDAK_KENA_PAJAK", label: "Bng. Non Pajak" },
  { value: "BANGUN_PARKIR", label: "Bangunan Parkir" },
  { value: "APARTEMEN", label: "Apartemen" },
  { value: "POMPA_BENSIN", label: "Pompa Bensin" },
  { value: "TANGKI_MINYAK", label: "Tangki Minyak" },
  { value: "GEDUNG_SEKOLAH", label: "Gedung Sekolah" },
];

const buildingCategories: Array<{
  id: BuildingCategoryKey;
  label: string;
  options: Array<{ value: BuildingCategoryValueMap[BuildingCategoryKey]; label: string }>;
}> = [
  {
    id: "kondisi",
    label: "Kondisi Pada Umumnya",
    options: [
      { value: "SANGAT_BAIK", label: "Sangat Baik" },
      { value: "BAIK", label: "Baik" },
      { value: "SEDANG", label: "Sedang" },
      { value: "JELEK", label: "Jelek" },
    ],
  },
  {
    id: "konstruksi",
    label: "Konstruksi",
    options: [
      { value: "BAJA", label: "Baja" },
      { value: "BETON", label: "Beton" },
      { value: "BATU_BATA", label: "Batu Bata" },
      { value: "KAYU", label: "Kayu" },
    ],
  },
  {
    id: "atap",
    label: "Atap",
    options: [
      { value: "DECRABON", label: "Decrabor/Beton" },
      { value: "GENTENG_BETON", label: "Gtg Beton" },
      { value: "GENTENG_BIASA", label: "Gtg Biasa/Sirap" },
      { value: "ASBES", label: "Asbes" },
      { value: "SENG", label: "Seng" },
    ],
  },
  {
    id: "dinding",
    label: "Dinding",
    options: [
      { value: "KACA", label: "Kaca/Alumunium" },
      { value: "BETON", label: "Beton" },
      { value: "BATA", label: "Bata/Conblok" },
      { value: "KAYU", label: "Kayu" },
      { value: "SENG", label: "Seng" },
      { value: "TANPA_DINDING", label: "Tanpa Dinding" },
    ],
  },
  {
    id: "lantai",
    label: "Lantai",
    options: [
      { value: "MARMER", label: "Marmer" },
      { value: "KERAMIK", label: "Keramik" },
      { value: "TERASO", label: "Teraso" },
      { value: "UBIN", label: "Ubin PC/Papan" },
      { value: "SEMEN", label: "Semen" },
    ],
  },
  {
    id: "langitLangit",
    label: "Langit-langit",
    options: [
      { value: "AKUSTIK", label: "Akustik/Jati" },
      { value: "TRIPLEK", label: "Triplek/Asbes/Bambu" },
      { value: "TANPA_LANGIT", label: "Tidak Ada" },
    ],
  },
];

export function SpopFormStandalone({
  initialTaxData = null,
}: SpopFormStandaloneProps) {
  const { theme } = usePublicThemeContext();
  const searchParams = useSearchParams();
  const isDark = theme === "dark";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SpopFormData | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [villageConfig, setVillageConfig] = useState<any>(null);

  useEffect(() => {
    getVillageConfig().then((cfg) => {
      setVillageConfig(cfg);
    });
  }, []);

  useEffect(() => {
    // Priority 1: initialTaxData prop
    // Priority 2: query parameters
    // Priority 3: empty defaults
    
    let taxData: SpopSourceTaxData;
    
    if (initialTaxData) {
        taxData = initialTaxData;
    } else {
        const qNop = searchParams.get("nop") || "";
        const qNama = searchParams.get("nama") || "";
        const qAlamat = searchParams.get("alamat") || "";
        const qLuasTanah = searchParams.get("luasTanah") || "0";
        const qLuasBangunan = searchParams.get("luasBangunan") || "0";
        
        taxData = {
            nop: qNop,
            namaWp: qNama,
            alamat: qAlamat,
            luasTanah: Number(qLuasTanah),
            luasBangunan: Number(qLuasBangunan),
            rt: "",
            rw: "",
            dusun: "",
            tahun: new Date().getFullYear().toString()
        };
    }
    
    const defaults = buildSpopFormDefaults(taxData);
    if (villageConfig) {
      defaults.desaObjek = villageConfig.namaDesa || defaults.desaObjek || "";
    }
    
    setForm(defaults);
    setStep(1);
    setPreviewHtml("");
  }, [initialTaxData, villageConfig, searchParams]);

  const setField = <K extends keyof SpopFormData>(key: K, value: SpopFormData[K]) => {
    setPreviewHtml("");
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const setBuildingCategoryField = <K extends BuildingCategoryKey>(
    key: K,
    value: BuildingCategoryValueMap[K]
  ) => {
    setField(key, value as SpopFormData[K]);
  };

  const handlePreview = async () => {
    if (!form) return;
    try {
      const html = buildSpopPrintHtml(form, villageConfig ?? undefined);
      setPreviewHtml(html);
      setStep(4);
      toast.success("Preview SPOP siap dilihat.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyiapkan preview.");
    }
  };

  const handleHtmlPrint = () => {
    if (!form) return;
    const html = buildSpopPrintHtml(form, villageConfig ?? undefined);
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Gagal membuka jendela cetak. Pastikan pop-up tidak diblokir.");
      return;
    }
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const styles = useMemo(() => ({
    panel: isDark ? "bg-[#111827] border-white/5 text-white" : "bg-slate-50 border-slate-200 text-slate-900",
    input: isDark ? "bg-[#030712] border-white/10 text-white placeholder:text-white/20 focus:bg-[#030712]" : "bg-white border-slate-200 text-slate-900 focus:bg-slate-50",
    buttonSelected: isDark ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/20" : "bg-primary border-primary text-white shadow-lg shadow-primary/10",
    buttonUnselected: isDark ? "border-transparent bg-[#1f2937] text-white/40 hover:bg-[#374151]" : "border-transparent bg-slate-200 text-slate-400 hover:bg-slate-300",
    stepCircle: {
      active: "bg-primary text-white shadow-lg shadow-primary/30 scale-110",
      completed: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
      pending: isDark ? "bg-white/10 text-white/30" : "bg-slate-200 text-slate-500"
    }
  }), [isDark]);

  const validateAndProceed = () => {
    if (step === 1) {
      const isMandatoryNop = form?.transactionType === "PEMUTAKHIRAN" || form?.transactionType === "PENGHAPUSAN";
      
      if (isMandatoryNop && (!form?.nop || form.nop.length < 13)) {
        return toast.error("Untuk transaksi ini, NOP wajib diisi (Min. 13 digit)");
      }
      
      if (!isMandatoryNop && form?.nop && form.nop.length < 13) {
        return toast.error("Jika diisi, NOP minimal 13 digit (sampai No. Blok)");
      }
      if (!form?.namaJalanObjek) return toast.error("Nama Jalan Objek wajib diisi");
      if (!form?.desaObjek) return toast.error("Desa Objek wajib diisi");
      if (!form?.rwObjek) return toast.error("RW Objek wajib diisi");
      if (!form?.rtObjek) return toast.error("RT Objek wajib diisi");
      if (!form?.luasTanah || form.luasTanah === "0") return toast.error("Luas Tanah wajib diisi");
      setStep(2);
    } else if (step === 2) {
      if (!form?.namaSubjekPajak) return toast.error("Nama Subjek Pajak wajib diisi");
      
      const isNikPlaceholder = form?.nomorKtp === "0" || form?.nomorKtp === "-";
      if (!isNikPlaceholder && (!form?.nomorKtp || form.nomorKtp.length < 16)) {
        return toast.error("Nomor KTP wajib 16 digit atau isi '0' / '-'");
      }
      if (!form?.namaJalanSubjek) return toast.error("Nama Jalan Subjek wajib diisi");
      if (!form?.desaSubjek) return toast.error("Desa Subjek wajib diisi");
      if (!form?.rwSubjek) return toast.error("RW Subjek wajib diisi");
      if (!form?.rtSubjek) return toast.error("RT Subjek wajib diisi");
      if (!form?.kabupaten) return toast.error("Kabupaten Subjek wajib diisi");
      if (!form?.kodePosSubjek) return toast.error("Kode Pos Subjek wajib diisi");
      if (!form?.namaPenandatangan) return toast.error("Nama Penandatangan wajib diisi");

      if (form?.jenisTanah === "TANAH_KOSONG") handlePreview();
      else setStep(3);
    } else if (step === 3) {
      if (!form?.jumlahBangunan || form.jumlahBangunan === "0") return toast.error("Jumlah Bangunan wajib diisi");
      if (!form?.bangunanKe) return toast.error("Urutan Bangunan Ke- wajib diisi");
      if (!form?.tahunDibangun) return toast.error("Tahun Bangunan wajib diisi");
      if (!form?.luasBangunan || form.luasBangunan === "0") return toast.error("Luas Bangunan wajib diisi");
      if (!form?.jumlahLantai || form.jumlahLantai === "0") return toast.error("Jumlah Lantai wajib diisi");
      if (!form?.dayaListrik || form.dayaListrik === "0") return toast.error("Daya Listrik wajib diisi");
      if (!form?.jenisBangunan) return toast.error("Jenis Bangunan wajib dipilih");
      if (!form?.kondisi) return toast.error("Kondisi Bangunan wajib dipilih");
      if (!form?.konstruksi) return toast.error("Konstruksi wajib dipilih");
      if (!form?.atap) return toast.error("Atap wajib dipilih");
      if (!form?.dinding) return toast.error("Dinding wajib dipilih");
      if (!form?.lantai) return toast.error("Lantai wajib dipilih");
      if (!form?.langitLangit) return toast.error("Langit-langit wajib dipilih");

      handlePreview();
    }
  };

  if (!form) return null;

  return (
    <div className="w-full space-y-8">
      {/* Steps Progress */}
      <div className={cn("p-6 rounded-[2rem] flex items-center justify-between", isDark ? "bg-[#030712] border border-white/5" : "bg-slate-100")}>
        {steps.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black transition-all duration-300", step === item.id ? styles.stepCircle.active : step > item.id ? styles.stepCircle.completed : styles.stepCircle.pending)}>
              {step > item.id ? <Check className="h-4 w-4" /> : item.id}
            </div>
            <span className={cn("text-[10px] font-black uppercase tracking-widest transition-all duration-300", step === item.id ? "text-primary scale-105" : "opacity-40", step !== item.id && "hidden sm:block")}>
              {item.label}
            </span>
            {item.id < steps.length && <ChevronRight className="w-4 h-4 opacity-10 mx-1" />}
          </div>
        ))}
      </div>

      <div className="min-h-[400px]">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid gap-6 md:grid-cols-12">
              <div className="space-y-2 md:col-span-12">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Jenis Transaksi</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {transactionOptions.map((t) => (
                    <button key={t.value} type="button" onClick={() => setField("transactionType", t.value)} className={cn("p-4 rounded-3xl border-2 transition-all active:scale-[0.98] font-black uppercase tracking-widest text-xs", form.transactionType === t.value ? styles.buttonSelected : styles.buttonUnselected)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 md:col-span-6">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">
                  {form.transactionType === "PEREKAMAN" 
                    ? "NOP (Kosongkan jika Pengajuan Baru)" 
                    : "NOP (Wajib Diisi)"}
                </Label>
                <Input value={form.nop} onChange={(e) => setField("nop", e.target.value.replace(/\D/g, "").slice(0, 18))} className={cn("h-12 rounded-2xl font-mono text-lg tracking-widest", styles.input)} placeholder="3515... (Min. 13 digit)" />
              </div>

              <div className="space-y-2 md:col-span-6">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Nama Jalan Objek</Label>
                <Input value={form.namaJalanObjek} onChange={(e) => setField("namaJalanObjek", sanitizeInput(e.target.value, MAX_ADDR))} className={cn("h-12 rounded-2xl font-bold uppercase", styles.input)} maxLength={MAX_ADDR} />
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">RW</Label>
                  <Input value={form.rwObjek} onChange={(e) => setField("rwObjek", e.target.value.replace(/\D/g, "").slice(0, 2))} className={cn("h-12 rounded-2xl font-bold text-center", styles.input)} maxLength={2} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">RT</Label>
                  <Input value={form.rtObjek} onChange={(e) => setField("rtObjek", e.target.value.replace(/\D/g, "").slice(0, 2))} className={cn("h-12 rounded-2xl font-bold text-center", styles.input)} maxLength={2} />
                </div>
              </div>

              <div className="space-y-2 md:col-span-4">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Luas Tanah (m²)</Label>
                <Input value={form.luasTanah} onChange={(e) => setField("luasTanah", e.target.value.replace(/\D/g, "").slice(0, 10))} className={cn("h-12 rounded-2xl font-black text-primary text-lg", styles.input)} maxLength={10} />
              </div>

              <div className="space-y-2 md:col-span-12">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Jenis Tanah</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {jenisTanahOptions.map((t) => (
                    <button key={t.value} type="button" onClick={() => setField("jenisTanah", t.value)} className={cn("p-4 rounded-3xl border-2 transition-all active:scale-[0.98] font-black uppercase tracking-widest text-xs", form.jenisTanah === t.value ? styles.buttonSelected : styles.buttonUnselected)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid gap-6 md:grid-cols-12">
              <div className="space-y-2 md:col-span-12">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Nama Subjek Pajak (Wajib Pajak)</Label>
                <Input value={form.namaSubjekPajak} onChange={(e) => {
                  const val = sanitizeInput(e.target.value, MAX_NAME);
                  setForm(prev => prev ? { ...prev, namaSubjekPajak: val, namaPenandatangan: val } : prev);
                }} className={cn("h-14 rounded-2xl font-black text-lg uppercase", styles.input)} maxLength={MAX_NAME} />
              </div>

              <div className="space-y-2 md:col-span-6">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">NIK (Nomor KTP)</Label>
                <Input value={form.nomorKtp} onChange={(e) => setField("nomorKtp", e.target.value.replace(/[^0-9-]/g, ""))} className={cn("h-12 rounded-2xl font-mono tracking-widest", styles.input)} maxLength={16} />
              </div>

              <div className="space-y-2 md:col-span-6">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Status Subjek</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {statusSubjekOptions.map((t) => (
                    <button key={t.value} type="button" onClick={() => setField("statusSubjek", t.value)} className={cn("py-3 rounded-2xl border transition-all font-black uppercase tracking-widest text-[9px]", form.statusSubjek === t.value ? styles.buttonSelected : styles.buttonUnselected)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 md:col-span-8">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Alamat Subjek Pajak</Label>
                <Input value={form.namaJalanSubjek} onChange={(e) => setField("namaJalanSubjek", sanitizeInput(e.target.value, MAX_ADDR))} className={cn("h-12 rounded-2xl font-bold uppercase", styles.input)} placeholder="DUSUN / JALAN" maxLength={MAX_ADDR} />
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">RW</Label>
                  <Input value={form.rwSubjek} onChange={(e) => setField("rwSubjek", e.target.value.replace(/\D/g, "").slice(0, 2))} className={cn("h-12 rounded-2xl font-bold text-center", styles.input)} maxLength={2} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">RT</Label>
                  <Input value={form.rtSubjek} onChange={(e) => setField("rtSubjek", e.target.value.replace(/\D/g, "").slice(0, 2))} className={cn("h-12 rounded-2xl font-bold text-center", styles.input)} maxLength={2} />
                </div>
              </div>

              <div className="space-y-2 md:col-span-4">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Desa / Kelurahan</Label>
                <Input value={form.desaSubjek} onChange={(e) => setField("desaSubjek", sanitizeInput(e.target.value, MAX_VILLAGE))} className={cn("h-12 rounded-2xl font-bold uppercase", styles.input)} maxLength={MAX_VILLAGE} />
              </div>

              <div className="space-y-2 md:col-span-4">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Kabupaten / Kota</Label>
                <Input value={form.kabupaten} onChange={(e) => setField("kabupaten", sanitizeInput(e.target.value, MAX_REGENCY))} className={cn("h-12 rounded-2xl font-bold uppercase", styles.input)} maxLength={MAX_REGENCY} />
              </div>

              <div className="space-y-2 md:col-span-4">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Kode Pos</Label>
                <Input value={form.kodePosSubjek} onChange={(e) => setField("kodePosSubjek", e.target.value.replace(/\D/g, ""))} className={cn("h-12 rounded-2xl font-bold text-center", styles.input)} maxLength={5} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid gap-6 md:grid-cols-12">
              <div className="space-y-2 md:col-span-4">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Jumlah Bangunan</Label>
                <Input value={form.jumlahBangunan} onChange={(e) => setField("jumlahBangunan", e.target.value.replace(/\D/g, "").slice(0, 3))} className={cn("h-12 rounded-2xl font-black", styles.input)} maxLength={3} />
              </div>
              <div className="space-y-2 md:col-span-4">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Luas Bangunan (m²)</Label>
                <Input value={form.luasBangunan} onChange={(e) => setField("luasBangunan", e.target.value.replace(/\D/g, "").slice(0, 10))} className={cn("h-12 rounded-2xl font-black text-rose-500", styles.input)} maxLength={10} />
              </div>
              <div className="space-y-2 md:col-span-4">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Tahun Bangunan</Label>
                <Input value={form.tahunDibangun} onChange={(e) => setField("tahunDibangun", e.target.value.replace(/\D/g, ""))} className={cn("h-12 rounded-2xl font-bold", styles.input)} maxLength={4} />
              </div>

              <div className="space-y-2 md:col-span-4">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Bangunan Ke-</Label>
                <Input value={form.bangunanKe} onChange={(e) => setField("bangunanKe", e.target.value.replace(/\D/g, "").slice(0, 3))} className={cn("h-12 rounded-2xl font-bold", styles.input)} maxLength={3} />
              </div>

              <div className="space-y-2 md:col-span-4">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Jumlah Lantai</Label>
                <Input value={form.jumlahLantai} onChange={(e) => setField("jumlahLantai", e.target.value.replace(/\D/g, "").slice(0, 3))} className={cn("h-12 rounded-2xl font-bold", styles.input)} maxLength={3} />
              </div>

              <div className="space-y-2 md:col-span-4">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Daya Listrik (Watt)</Label>
                <Input value={form.dayaListrik} onChange={(e) => setField("dayaListrik", e.target.value.replace(/\D/g, "").slice(0, 7))} className={cn("h-12 rounded-2xl font-bold", styles.input)} maxLength={7} />
              </div>

              <div className="space-y-2 md:col-span-12">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Jenis Bangunan</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {jenisBangunanOptions.map((t) => (
                    <button key={t.value} type="button" onClick={() => setField("jenisBangunan", t.value)} className={cn("p-4 rounded-3xl border-2 transition-all font-black uppercase tracking-widest text-[9px]", form.jenisBangunan === t.value ? styles.buttonSelected : styles.buttonUnselected)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {buildingCategories.map((cat) => (
                <div key={cat.id} className="space-y-2 md:col-span-6">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">{cat.label}</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {cat.options.map((opt) => (
                      <button key={opt.value} type="button" onClick={() => setBuildingCategoryField(cat.id, opt.value)} className={cn("py-3 rounded-2xl border transition-all font-black uppercase tracking-widest text-[9px]", form[cat.id] === opt.value ? styles.buttonSelected : styles.buttonUnselected)}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className={cn("p-6 rounded-[2.5rem] overflow-hidden border-2 border-primary/20 bg-white shadow-inner relative h-[65vh]")}>
                <iframe title="Preview SPOP" srcDoc={previewHtml} className="w-full h-full border-none" />
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className={cn("pt-6 border-t", isDark ? "border-white/5" : "border-slate-200")}>
        <div className="flex items-center gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((prev) => prev - 1)} className={cn("h-14 min-w-40 rounded-2xl font-black uppercase tracking-widest text-[10px]", isDark ? "border-white/10 text-white/60" : "border-slate-200 text-slate-500")}>
              <ChevronLeft className="h-5 w-5 mr-2" /> Kembali
            </Button>
          )}
          <div className="flex flex-1 items-center gap-3 justify-end">
            {step < 4 ? (
              <Button onClick={validateAndProceed} className={cn("h-14 min-w-56 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all", isDark ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-primary hover:bg-primary/90 text-white")}>
                {step === 3 ? "Preview SPOP" : "Lanjut ke " + steps[step].label} <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button onClick={handleHtmlPrint} className="h-14 min-w-64 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-emerald-500/40">
                  <Printer className="mr-3 h-6 w-6" /> Cetak SPOP / LSPOP
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
