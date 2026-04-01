"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildSpopFormDefaults, type SpopFormData, type SpopSourceTaxData } from "@/lib/spop-form";
import { buildSpopPrintHtml } from "@/lib/spop-print";
import { getVillageConfig } from "@/app/actions/settings-actions";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, Eye, Loader2, Printer, Monitor } from "lucide-react";
import { toast } from "sonner";

interface SpopFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taxItem: SpopSourceTaxData | null;
  isDark?: boolean;
}

const steps = [
  { id: 1, label: "Deteksi" },
  { id: 2, label: "Subjek" },
  { id: 3, label: "Bangunan" },
  { id: 4, label: "Preview" },
];

export function SpopFormDialog({
  open,
  onOpenChange,
  taxItem,
  isDark = false,
}: SpopFormDialogProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SpopFormData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [villageConfig, setVillageConfig] = useState<any>(null);

  useEffect(() => {
    getVillageConfig().then((cfg) => {
      setVillageConfig(cfg);
    });
  }, []);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollAreaRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const clearPreview = () => {
    setPreviewHtml("");
  };



  useEffect(() => {
    if (!taxItem) return;
    const defaults = buildSpopFormDefaults(taxItem);
    if (villageConfig) {
      defaults.desaObjek = villageConfig.namaDesa || defaults.desaObjek || "";
    }
    
    setForm(defaults);
    setStep(1);
    clearPreview();
  }, [taxItem, villageConfig]);

  useEffect(() => {
    if (open) return;
    clearPreview();
    setStep(1);
  }, [open]);



  const panelCls = isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900";
  const inputCls = isDark
    ? "bg-white/5 border-white/10 text-white placeholder:text-white/25"
    : "bg-white border-slate-200 text-slate-900";

  const selectedCls = isDark 
    ? "bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-500/40 ring-1 ring-white/20"
    : "bg-primary text-white border-primary shadow-lg shadow-primary/20";

  const setField = <K extends keyof SpopFormData>(key: K, value: SpopFormData[K]) => {
    clearPreview();
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handlePreview = async () => {
    if (!form) return;
    setIsGenerating(true);
    try {
      const html = buildSpopPrintHtml(form, villageConfig);
      setPreviewHtml(html);
      setStep(4);
      toast.success("Preview siap dilihat.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyiapkan preview.");
    } finally {
      setIsGenerating(false);
    }
  };



  const handleHtmlPrint = () => {
    if (!form) return;
    const html = buildSpopPrintHtml(form, villageConfig);
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Gagal membuka jendela cetak. Pastikan pop-up tidak diblokir.");
      return;
    }

    win.document.write(html);
    win.document.close();
    
    // Auto trigger print for convenience
    setTimeout(() => {
      win.print();
    }, 500);
  };

  const detectedSummary = useMemo(() => {
    if (!taxItem) return [];
    return [
      { label: "NOP", value: taxItem.nop || "-" },
      { label: "Nama", value: taxItem.namaWp || "-" },
      { label: "Alamat", value: taxItem.alamat || "-" },
      { label: "Luas Tanah", value: `${taxItem.luasTanah || 0} m2` },
      { label: "Luas Bangunan", value: `${taxItem.luasBangunan || 0} m2` },
    ];
  }, [taxItem]);

  const styles = useMemo(() => ({
    panel: isDark ? "bg-[#111827] border-white/5 text-white" : "bg-slate-100 border-slate-200 text-slate-900",
    input: isDark ? "bg-[#030712] border-white/10 text-white placeholder:text-white/20 focus:bg-[#030712]" : "bg-white border-slate-200 text-slate-900 focus:bg-slate-50",
    buttonSelected: isDark ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/20" : "bg-primary border-primary text-white shadow-lg shadow-primary/10",
    buttonUnselected: isDark ? "border-transparent bg-[#1f2937] text-white/40 hover:bg-[#374151]" : "border-transparent bg-slate-200 text-slate-400 hover:bg-slate-300",
    stepCircle: {
      active: "bg-primary text-white shadow-lg shadow-primary/30 scale-110",
      completed: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
      pending: isDark ? "bg-white/10 text-white/30" : "bg-slate-200 text-slate-500"
    }
  }), [isDark]);

  const focusField = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-destructive');
      setTimeout(() => el.classList.remove('ring-2', 'ring-destructive'), 3000);
    }
  };

  const validateAndProceed = () => {
    if (step === 1) {
      if (!form?.nop || form.nop.length < 18) return toast.error("NOP wajib diisi lengkap (18 digit)"), focusField("f-nop");
      if (!form?.namaJalanObjek) return toast.error("Nama Jalan Objek wajib diisi"), focusField("f-jalan-obj");
      if (!form?.desaObjek) return toast.error("Desa Objek wajib diisi"), focusField("f-desa-obj");
      if (!form?.rwObjek) return toast.error("RW Objek wajib diisi"), focusField("f-rw-obj");
      if (!form?.rtObjek) return toast.error("RT Objek wajib diisi"), focusField("f-rt-obj");
      if (!form?.luasTanah || form.luasTanah === "0") return toast.error("Luas Tanah wajib diisi"), focusField("f-luas-tanah");
      setStep(2);
    } else if (step === 2) {
      if (!form?.namaSubjekPajak) return toast.error("Nama Subjek Pajak wajib diisi"), focusField("f-nama-wp");
      if (!form?.nomorKtp || form.nomorKtp.length < 16) return toast.error("Nomor KTP wajib diisi (16 digit)"), focusField("f-ktp-wp");
      if (!form?.namaJalanSubjek) return toast.error("Nama Jalan Subjek wajib diisi"), focusField("f-jalan-wp");
      if (!form?.desaSubjek) return toast.error("Desa Subjek wajib diisi"), focusField("f-desa-wp");
      if (!form?.rwSubjek) return toast.error("RW Subjek wajib diisi"), focusField("f-rw-wp");
      if (!form?.rtSubjek) return toast.error("RT Subjek wajib diisi"), focusField("f-rt-wp");
      if (!form?.kabupaten) return toast.error("Kabupaten Subjek wajib diisi"), focusField("f-kab-wp");
      if (!form?.kodePosSubjek) return toast.error("Kode Pos Subjek wajib diisi"), focusField("f-pos-wp");
      if (!form?.namaPenandatangan) return toast.error("Nama Penandatangan wajib diisi"), focusField("f-sig-wp");

      if (form?.jenisTanah === "TANAH_KOSONG") handlePreview();
      else setStep(3);
    } else if (step === 3) {
      if (!form?.jumlahBangunan || form.jumlahBangunan === "0") return toast.error("Jumlah Bangunan wajib diisi"), focusField("f-jml-bng");
      if (!form?.bangunanKe) return toast.error("Urutan Bangunan Ke- wajib diisi"), focusField("f-bng-ke");
      if (!form?.tahunDibangun) return toast.error("Tahun Bangunan wajib diisi"), focusField("f-thn-bng");
      if (!form?.luasBangunan || form.luasBangunan === "0") return toast.error("Luas Bangunan wajib diisi"), focusField("f-luas-bng");
      if (!form?.jumlahLantai || form.jumlahLantai === "0") return toast.error("Jumlah Lantai wajib diisi"), focusField("f-lt-bng");
      if (!form?.dayaListrik || form.dayaListrik === "0") return toast.error("Daya Listrik wajib diisi"), focusField("f-daya-listrik");
      if (!form?.jenisBangunan) return toast.error("Jenis Bangunan wajib dipilih"), focusField("f-jenis-bng");
      if (!form?.kondisi) return toast.error("Kondisi Bangunan wajib dipilih"), focusField("f-cat-kondisi");
      if (!form?.konstruksi) return toast.error("Konstruksi wajib dipilih"), focusField("f-cat-konstruksi");
      if (!form?.atap) return toast.error("Atap wajib dipilih"), focusField("f-cat-atap");
      if (!form?.dinding) return toast.error("Dinding wajib dipilih"), focusField("f-cat-dinding");
      if (!form?.lantai) return toast.error("Lantai wajib dipilih"), focusField("f-cat-lantai");
      if (!form?.langitLangit) return toast.error("Langit-langit wajib dipilih"), focusField("f-cat-langitLangit");

      handlePreview();
    }
  };

  if (!form || !taxItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "h-[92vh] w-[94vw] !max-w-[94vw] overflow-hidden border-none p-0 sm:rounded-3xl lg:w-[1100px] lg:!max-w-[1100px] !opacity-100 shadow-[0_0_50px_rgba(0,0,0,0.5)]",
          isDark ? "dark text-white" : "text-slate-900",
        )}
      >
        <div 
          className="absolute inset-0 -z-50 !opacity-100" 
          style={{ 
            backgroundColor: isDark ? '#050B14' : '#ffffff',
            opacity: 1, 
          }} 
        />
        <DialogHeader className={cn(
          "border-b px-4 py-4 sm:px-6",
          isDark ? "border-white/5 bg-[#0D1F3D]" : "border-black/5 bg-slate-100"
        )}>
          <DialogTitle className="text-lg font-black uppercase tracking-tight sm:text-xl">Form Tanya Jawab SPOP / LSPOP</DialogTitle>
          <DialogDescription className={cn("text-[11px] leading-relaxed sm:text-sm", isDark ? "text-blue-100/60" : "text-slate-500")}>
            Data utama objek pajak sudah dideteksi otomatis dari hasil pencarian dan bisa Anda koreksi sebelum formulir dicetak ke PDF.
          </DialogDescription>

          <div className={cn(
            "mt-4 rounded-3xl px-4 py-4 flex items-center justify-between",
            isDark ? "bg-[#030712] border border-white/5" : "bg-slate-100"
          )}>
            {steps.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all duration-300",
                    step === item.id
                      ? styles.stepCircle.active
                      : step > item.id
                        ? styles.stepCircle.completed
                        : styles.stepCircle.pending,
                  )}
                >
                  {step > item.id ? <Check className="h-4 w-4" /> : item.id}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                    step === item.id ? "text-primary scale-105" : "opacity-40",
                    step !== item.id && "hidden sm:block",
                  )}
                >
                  {item.label}
                </span>
                {item.id < steps.length && <ChevronRight className="w-4 h-4 opacity-10 mx-1" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
          {step === 1 && (
            <div className="space-y-6 xl:grid xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start xl:gap-8 xl:space-y-0 animate-in fade-in slide-in-from-right-4 duration-500">
              <div 
                className={cn("rounded-3xl border p-5 xl:sticky xl:top-0 shadow-sm transition-all hover:shadow-md", isDark ? "border-white/10 text-white" : "border-slate-200 text-slate-900")}
                style={{ backgroundColor: isDark ? '#0F172A' : '#f8fafc' }}
              >
                <div className="flex items-center gap-2 mb-4">
                   <div className="h-1.5 w-6 rounded-full bg-primary" />
                   <p className="text-xs font-black uppercase tracking-widest opacity-60">Data Terdeteksi</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                  {detectedSummary.map((item) => (
                    <div
                      key={item.label}
                      className={cn(
                        "rounded-2xl px-4 py-3 transition-colors",
                        isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/[0.07]"
                      )}
                    >
                      <p className="text-xs font-black uppercase tracking-widest opacity-40">{item.label}</p>
                      <p className="mt-1 text-sm font-bold tracking-tight">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-12">

                <div className="space-y-2 xl:col-span-12">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Jenis Transaksi</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { value: "PEMUTAKHIRAN", label: "Pemutakhiran" },
                      { value: "PEREKAMAN", label: "Perekaman" },
                      { value: "PENGHAPUSAN", label: "Penghapusan" },
                    ].map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setField("transactionType", t.value as any)}
                        className={cn(
                          "p-4 rounded-3xl border-2 transition-all active:scale-[0.98] font-black uppercase tracking-widest text-xs",
                          form.transactionType === t.value ? styles.buttonSelected : styles.buttonUnselected
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 xl:col-span-6">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">NOP</Label>
                  <Input 
                    id="f-nop"
                    value={form.nop} 
                    onChange={(e) => setField("nop", e.target.value.replace(/\D/g, "").slice(0, 18))} 
                    className={cn("h-11 rounded-xl font-mono text-base tracking-widest", styles.input)} 
                    placeholder="Contoh: 351501000100100100"
                  />
                </div>

                <div className="space-y-2 xl:col-span-6">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Nama Jalan Objek</Label>
                   <Input 
                     id="f-jalan-obj"
                     value={form.namaJalanObjek} 
                     onChange={(e) => setField("namaJalanObjek", e.target.value.slice(0, 21))} 
                     className={cn("h-11 rounded-xl font-bold uppercase", styles.input)} 
                     placeholder="Contoh: JL. RAYA BALONGBESUK"
                   />
                </div>

                <div className="space-y-2 xl:col-span-3">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Nomor / KAV / Blok</Label>
                  <Input 
                    value={form.nomorBlokObjek} 
                    onChange={(e) => setField("nomorBlokObjek", e.target.value.slice(0, 12))} 
                    className={cn("h-11 rounded-xl font-bold uppercase", styles.input)} 
                    placeholder="Contoh: BLOK A / 12"
                  />
                </div>

                <div className="space-y-2 xl:col-span-4">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Desa / Kelurahan Objek</Label>
                  <Input 
                    id="f-desa-obj"
                    value={form.desaObjek} 
                    onChange={(e) => setField("desaObjek", e.target.value.slice(0, 21))} 
                    className={cn("h-11 rounded-xl font-bold uppercase", styles.input)} 
                    placeholder="Contoh: BALONGBESUK"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 xl:col-span-2">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">RW Objek</Label>
                    <Input 
                      id="f-rw-obj"
                      value={form.rwObjek} 
                      onChange={(e) => setField("rwObjek", e.target.value.replace(/\D/g, "").slice(0, 2))} 
                      className={cn("h-11 rounded-xl font-bold text-center", styles.input)} 
                      placeholder="01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">RT Objek</Label>
                    <Input 
                      id="f-rt-obj"
                      value={form.rtObjek} 
                      onChange={(e) => setField("rtObjek", e.target.value.replace(/\D/g, "").slice(0, 2))} 
                      className={cn("h-11 rounded-xl font-bold text-center", styles.input)} 
                      placeholder="01"
                    />
                  </div>
                </div>

                <div className="space-y-2 xl:col-span-3">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Luas Tanah (m2)</Label>
                  <Input 
                    id="f-luas-tanah"
                    value={form.luasTanah} 
                    onChange={(e) => setField("luasTanah", e.target.value.replace(/\D/g, "").slice(0, 10))} 
                    className={cn("h-11 rounded-xl font-black text-primary", styles.input)} 
                    placeholder="Contoh: 100"
                  />
                </div>

                <div className="space-y-3 xl:col-span-12">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Jenis Tanah</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: "TANAH_BANGUNAN", label: "Tanah + Bangunan" },
                      { value: "KAVLING_SIAP_BANGUN", label: "Kavling Siap Bangun" },
                      { value: "TANAH_KOSONG", label: "Tanah Kosong" },
                      { value: "FASILITAS_UMUM", label: "Fasilitas Umum" },
                    ].map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setField("jenisTanah", t.value as any)}
                        className={cn(
                          "p-4 rounded-3xl border-2 transition-all active:scale-[0.98] font-black uppercase tracking-widest text-xs",
                          form.jenisTanah === t.value ? styles.buttonSelected : styles.buttonUnselected
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}


          {step === 2 && (
            <div className="grid gap-6 xl:grid-cols-12 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2 xl:col-span-12">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Nama Subjek Pajak</Label>
                <Input 
                  id="f-nama-wp"
                  value={form.namaSubjekPajak} 
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().slice(0, 21);
                    setForm(prev => prev ? { ...prev, namaSubjekPajak: val, namaPenandatangan: val } : prev);
                    clearPreview();
                  }} 
                  className={cn("h-12 rounded-2xl font-black text-base uppercase", styles.input)} 
                  placeholder="BUDI SANTOSO"
                />
              </div>

              <div className="space-y-3 xl:col-span-12">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Status Subjek</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {[
                    { value: "PEMILIK", label: "Pemilik" },
                    { value: "PENYEWA", label: "Penyewa" },
                    { value: "PENGELOLA", label: "Pengelola" },
                    { value: "PEMAKAI", label: "Pemakai" },
                    { value: "SENGKETA", label: "Sengketa" },
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setField("statusSubjek", t.value as any)}
                      className={cn(
                        "p-4 rounded-3xl border-2 transition-all active:scale-[0.98] font-black uppercase tracking-widest text-xs",
                        form.statusSubjek === t.value ? styles.buttonSelected : styles.buttonUnselected
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 xl:col-span-12">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Pekerjaan</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {[
                    { value: "PNS", label: "PNS" },
                    { value: "TNI", label: "TNI" },
                    { value: "PENSIUNAN", label: "Pensiunan" },
                    { value: "BADAN", label: "Badan" },
                    { value: "LAINNYA", label: "Lainnya" },
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setField("pekerjaan", t.value as any)}
                      className={cn(
                        "p-4 rounded-3xl border-2 transition-all active:scale-[0.98] font-black uppercase tracking-widest text-xs",
                        form.pekerjaan === t.value ? styles.buttonSelected : styles.buttonUnselected
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 xl:col-span-3">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">NPWP (Jika Ada)</Label>
                <Input 
                  value={form.npwp} 
                  onChange={(e) => setField("npwp", e.target.value.replace(/\D/g, "").slice(0, 14))} 
                  className={cn("h-11 rounded-xl font-mono", styles.input)} 
                  placeholder="01234567891234"
                />
              </div>

              <div className="space-y-2 xl:col-span-3">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Nomor KTP</Label>
                <Input 
                  id="f-ktp-wp" 
                  value={form.nomorKtp} 
                  onChange={(e) => setField("nomorKtp", e.target.value.replace(/\D/g, "").slice(0, 16))} 
                  className={cn("h-11 rounded-xl font-mono tracking-widest", styles.input)} 
                  placeholder="3515011234567890" 
                />
              </div>

              <div className="space-y-2 xl:col-span-6">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Nama Jalan Subjek</Label>
                <Input 
                  id="f-jalan-wp"
                  value={form.namaJalanSubjek} 
                  onChange={(e) => setField("namaJalanSubjek", e.target.value.toUpperCase().slice(0, 21))} 
                  className={cn("h-11 rounded-xl font-bold uppercase", styles.input)} 
                  placeholder="JL. MELATI NO. 5"
                />
              </div>

               <div className="space-y-2 xl:col-span-4">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Blok / Kav / Nomor</Label>
                <Input 
                  value={form.blokSubjek} 
                  onChange={(e) => setField("blokSubjek", e.target.value.toUpperCase().slice(0, 12))} 
                  className={cn("h-11 rounded-xl font-bold uppercase", styles.input)} 
                  placeholder="BLOK B / 05"
                />
              </div>

              <div className="space-y-2 xl:col-span-4">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Desa / Kelurahan Subjek</Label>
                <Input 
                  id="f-desa-wp"
                  value={form.desaSubjek} 
                  onChange={(e) => setField("desaSubjek", e.target.value.toUpperCase().slice(0, 21))} 
                  className={cn("h-11 rounded-xl font-bold uppercase", styles.input)} 
                  placeholder="BALONGBESUK"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 xl:col-span-2">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">RW</Label>
                  <Input 
                    id="f-rw-wp"
                    value={form.rwSubjek} 
                    onChange={(e) => setField("rwSubjek", e.target.value.replace(/\D/g, "").slice(0, 2))} 
                    className={cn("h-11 rounded-xl font-bold text-center", styles.input)} 
                    placeholder="02"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">RT</Label>
                  <Input 
                    id="f-rt-wp"
                    value={form.rtSubjek} 
                    onChange={(e) => setField("rtSubjek", e.target.value.replace(/\D/g, "").slice(0, 2))} 
                    className={cn("h-11 rounded-xl font-bold text-center", styles.input)} 
                    placeholder="05"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 xl:col-span-4">
                <div className="col-span-3 space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Kabupaten / Kota</Label>
                  <Input 
                    id="f-kab-wp"
                    value={form.kabupaten} 
                    onChange={(e) => setField("kabupaten", e.target.value.toUpperCase().slice(0, 12))} 
                    className={cn("h-11 rounded-xl font-bold uppercase", styles.input)} 
                    placeholder="JOMBANG"
                  />
                </div>
                <div className="col-span-1 space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Pos</Label>
                  <Input 
                    id="f-pos-wp" 
                    value={form.kodePosSubjek} 
                    onChange={(e) => setField("kodePosSubjek", e.target.value.replace(/\D/g, "").slice(0, 5))} 
                    className={cn("h-11 rounded-xl font-bold text-center", styles.input)} 
                    placeholder="61471" 
                  />
                </div>
              </div>

              <div className="space-y-2 xl:col-span-4">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Nama Penandatangan</Label>
                <Input id="f-sig-wp" value={form.namaPenandatangan} onChange={(e) => setField("namaPenandatangan", e.target.value.toUpperCase())} className={cn("h-12 rounded-2xl font-black uppercase", styles.input)} placeholder="BUDI SANTOSO" />
              </div>

              <div className="space-y-2 xl:col-span-4">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Tanggal Tanda Tangan</Label>
                <Input type="date" value={form.tanggalTandaTangan} onChange={(e) => setField("tanggalTandaTangan", e.target.value)} className={cn("h-12 rounded-2xl font-bold px-4", styles.input)} />
              </div>
            </div>
          )}


          {step === 3 && (
            <div className="grid gap-6 xl:grid-cols-12 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2 xl:col-span-3">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Jumlah Bangunan</Label>
                  <Input 
                    id="f-jml-bng"
                    value={form.jumlahBangunan} 
                    onChange={(e) => setField("jumlahBangunan", e.target.value.replace(/\D/g, ""))} 
                    className={cn("h-11 rounded-xl font-black", styles.input)} 
                    placeholder="1"
                  />
              </div>

              <div className="space-y-2 xl:col-span-3">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Bangunan Ke-</Label>
                  <Input 
                    id="f-bng-ke"
                    value={form.bangunanKe} 
                    onChange={(e) => setField("bangunanKe", e.target.value.replace(/\D/g, ""))} 
                    className={cn("h-11 rounded-xl font-black", styles.input)} 
                    placeholder="1"
                  />
              </div>

              <div id="f-jenis-bng" className="space-y-3 xl:col-span-12">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Jenis Bangunan</Label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
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
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setField("jenisBangunan", t.value as any)}
                      className={cn(
                        "p-4 rounded-3xl border-2 transition-all active:scale-[0.98] font-black uppercase tracking-widest text-xs",
                        form.jenisBangunan === t.value ? styles.buttonSelected : styles.buttonUnselected
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 xl:col-span-3">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Luas Bangunan (m2)</Label>
                  <Input 
                    id="f-luas-bng"
                    value={form.luasBangunan} 
                    onChange={(e) => setField("luasBangunan", e.target.value.replace(/\D/g, ""))} 
                    className={cn("h-11 rounded-xl font-black text-rose-500", styles.input)} 
                    placeholder="80"
                  />
              </div>

              <div className="space-y-2 xl:col-span-3">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Jumlah Lantai</Label>
                  <Input 
                    id="f-lt-bng"
                    value={form.jumlahLantai} 
                    onChange={(e) => setField("jumlahLantai", e.target.value.replace(/\D/g, ""))} 
                    className={cn("h-11 rounded-xl font-bold", styles.input)} 
                    placeholder="1"
                  />
              </div>

              <div className="space-y-2 xl:col-span-3">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Tahun Dibangun</Label>
                  <Input 
                    id="f-thn-bng"
                    value={form.tahunDibangun} 
                    onChange={(e) => setField("tahunDibangun", e.target.value.replace(/\D/g, "").slice(0, 4))} 
                    className={cn("h-11 rounded-xl font-bold", styles.input)} 
                    placeholder="2010"
                  />
              </div>

              <div className="space-y-2 xl:col-span-3">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Tahun Renovasi</Label>
                <Input 
                  value={form.tahunRenovasi} 
                  onChange={(e) => setField("tahunRenovasi", e.target.value.replace(/\D/g, "").slice(0, 4))} 
                  className={cn("h-11 rounded-xl font-bold", styles.input)} 
                  placeholder="2024"
                />
              </div>

              <div className="space-y-2 xl:col-span-4">
                <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Daya Listrik (Watt)</Label>
                <Input 
                  id="f-daya-listrik"
                  value={form.dayaListrik} 
                  onChange={(e) => setField("dayaListrik", e.target.value.replace(/\D/g, "").slice(0, 7))} 
                  className={cn("h-11 rounded-xl font-bold", styles.input)} 
                  placeholder="1300"
                />
              </div>

              {[
                { 
                  id: "kondisi", 
                  label: "Kondisi Pada Umumnya", 
                  options: [
                    { value: "SANGAT_BAIK", label: "Sangat Baik" },
                    { value: "BAIK", label: "Baik" },
                    { value: "SEDANG", label: "Sedang" },
                    { value: "JELEK", label: "Jelek" },
                  ] 
                },
                { 
                  id: "konstruksi", 
                  label: "Konstruksi", 
                  options: [
                    { value: "BAJA", label: "Baja" },
                    { value: "BETON", label: "Beton" },
                    { value: "BATU_BATA", label: "Batu Bata" },
                    { value: "KAYU", label: "Kayu" },
                  ] 
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
                  ] 
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
                  ] 
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
                  ] 
                },
                { 
                  id: "langitLangit", 
                  label: "Langit-langit", 
                  options: [
                    { value: "AKUSTIK", label: "Akustik/Jati" },
                    { value: "TRIPLEK", label: "Triplek/Asbes/Bambu" },
                    { value: "TANPA_LANGIT", label: "Tidak Ada" },
                  ] 
                },
              ].map((category) => (
                <div key={category.id} id={`f-cat-${category.id}`} className="space-y-4 xl:col-span-12">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">{category.label}</Label>
                  <div className="flex flex-wrap gap-2">
                    {category.options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setField(category.id as any, opt.value)}
                        className={cn(
                          "p-4 rounded-3xl border-2 transition-all active:scale-[0.98] font-black uppercase tracking-widest text-xs",
                          (form as any)[category.id] === opt.value ? styles.buttonSelected : styles.buttonUnselected
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className={cn("rounded-3xl border p-6 shadow-sm", styles.panel)}>
                <div className="flex items-center gap-3 mb-3">
                   <div className="h-2 w-8 rounded-full bg-emerald-500" />
                   <p className="text-sm font-black uppercase tracking-widest opacity-80">Siap Untuk Dicetak</p>
                </div>
                <p className="text-sm leading-relaxed opacity-70">
                  Data telah kami validasi dan preview dokumen SPOP / LSPOP sudah dibuat. Silakan periksa kembali sebelum melakukan pencetakan.
                </p>
              </div>


              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/5">
                {previewHtml ? (
                  <iframe 
                    title="Preview SPOP LSPOP" 
                    srcDoc={previewHtml}
                    className="h-[58vh] w-full bg-white opacity-100" 
                  />
                ) : (
                  <div className="flex h-[58vh] items-center justify-center text-sm opacity-60">
                    Preview belum dibuat.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={cn("border-t px-5 py-6 sm:px-8", isDark ? "border-white/10 bg-[#0D1F3D]" : "border-slate-100 bg-white")}>
          <div className="flex flex-row items-center gap-4">
            {step > 1 && (
              <button 
                onClick={() => {
                  if (step === 4 && form.jenisTanah === "TANAH_KOSONG") setStep(2);
                  else setStep((prev) => prev - 1);
                }} 
                className={cn(
                  "h-14 flex-1 flex items-center justify-center rounded-2xl sm:flex-initial sm:min-w-36 font-black uppercase tracking-widest text-xs transition-all active:scale-95 group border-2",
                  isDark 
                    ? "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white" 
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                )}
              >
                <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Kembali
              </button>
            )}
            
            <div className={cn("flex flex-1 items-center gap-4 sm:justify-end", step === 1 ? "justify-center" : "")}>
              {step < 4 ? (
                <button 
                  onClick={validateAndProceed}
                  className={cn(
                    "h-14 w-full flex items-center justify-center sm:w-auto sm:min-w-56 px-4 font-black uppercase tracking-widest text-xs shadow-lg transition-all active:scale-[0.98] rounded-2xl",
                    isDark ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20" : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                  )}
                >
                  {step === 3 || (step === 2 && form.jenisTanah === "TANAH_KOSONG") ? (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Buka Preview
                    </>
                  ) : (
                    <>
                      Lanjut
                      <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              ) : (
                <button 
                  onClick={handleHtmlPrint} 
                  className="h-14 w-full flex items-center justify-center sm:w-auto rounded-2xl sm:min-w-72 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest shadow-xl shadow-emerald-500/30 active:scale-[0.98] transition-all group"
                >
                  <Printer className="mr-3 h-6 w-6 transition-transform group-hover:rotate-12" />
                  Cetak Berkas
                </button>
              )}
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
