"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
      defaults.kabupaten = villageConfig.kabupaten || defaults.kabupaten || "";
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

  if (!form || !taxItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "h-[92vh] w-[94vw] !max-w-[94vw] overflow-hidden border-none p-0 sm:rounded-3xl lg:w-[1100px] lg:!max-w-[1100px]",
          isDark ? "dark bg-[#0A192F] text-white" : "bg-white text-slate-900",
        )}
      >
        <DialogHeader className={cn(
          "border-b px-4 py-4 sm:px-6",
          isDark ? "border-white/5 bg-[#0D1F3D]" : "border-black/5 bg-slate-50/50"
        )}>
          <DialogTitle className="text-lg font-black uppercase tracking-tight sm:text-xl">Form Tanya Jawab SPOP / LSPOP</DialogTitle>
          <DialogDescription className={cn("text-[11px] leading-relaxed sm:text-sm", isDark ? "text-blue-100/60" : "text-slate-500")}>
            Data utama objek pajak sudah dideteksi otomatis dari hasil pencarian dan bisa Anda koreksi sebelum formulir dicetak ke PDF.
          </DialogDescription>

          <div className={cn(
            "mt-4 overflow-x-auto rounded-2xl px-3 py-3",
            isDark ? "bg-white/5" : "bg-black/5"
          )}>
            <div className="flex min-w-max items-center justify-between gap-4">
              {steps.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black sm:h-8 sm:w-8 sm:text-xs",
                      step === item.id
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : step > item.id
                          ? "bg-emerald-500 text-white"
                          : isDark
                            ? "bg-white/10 text-white/30"
                            : "bg-slate-200 text-slate-500",
                    )}
                  >
                    {step > item.id ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : item.id}
                  </div>
                  <span
                    className={cn(
                      "whitespace-nowrap text-[9px] font-black uppercase tracking-widest sm:text-[10px]",
                      step === item.id ? "text-primary" : isDark ? "text-white/20" : "text-slate-400",
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DialogHeader>

        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
          {step === 1 && (
            <div className="space-y-6 xl:grid xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start xl:gap-6 xl:space-y-0">
              <div className={cn("rounded-3xl border p-4 xl:sticky xl:top-0", panelCls)}>
                <p className="mb-4 text-xs font-black uppercase tracking-widest opacity-60">Deteksi Otomatis Dari Hasil Pencarian</p>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
                  {detectedSummary.map((item) => (
                    <div
                      key={item.label}
                      className={cn(
                        "rounded-2xl bg-black/5 p-4 dark:bg-white/5",
                        item.label === "Alamat" ? "md:col-span-2 xl:col-span-2" : "",
                      )}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{item.label}</p>
                      <p className="mt-1 text-sm font-bold">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-12">
                <div className="space-y-2 xl:col-span-4">
                  <Label>Jenis Transaksi</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "PEMUTAKHIRAN", label: "Pemutakhiran" },
                      { value: "PEREKAMAN", label: "Perekaman" },
                      { value: "PENGHAPUSAN", label: "Penghapusan" },
                    ].map((t) => (
                      <Button
                        key={t.value}
                        variant="outline"
                        type="button"
                        onClick={() => setField("transactionType", t.value as any)}
                        className={cn(
                          "h-10 flex-1 min-w-[100px] rounded-xl px-3 text-[10px] font-black uppercase tracking-wider transition-all",
                          form.transactionType === t.value
                            ? selectedCls
                            : isDark 
                              ? "border-white/10 bg-white/5 text-white/40 hover:bg-white/10" 
                              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                        )}
                      >
                        {t.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 xl:col-span-4">
                  <Label>NOP</Label>
                  <Input 
                    id="f-nop"
                    value={form.nop} 
                    onChange={(e) => setField("nop", e.target.value.replace(/\D/g, "").slice(0, 18))} 
                    className={inputCls} 
                    placeholder="Contoh: 351501000100100100"
                    required
                  />
                </div>

                <div className="space-y-2 xl:col-span-5">
                  <Label>Nama Jalan Objek</Label>
                  <Input 
                    id="f-jalan-obj"
                    value={form.namaJalanObjek} 
                    onChange={(e) => setField("namaJalanObjek", e.target.value.slice(0, 21))} 
                    className={inputCls} 
                    placeholder="Contoh: JL. RAYA BALONGBESUK"
                    required
                  />
                </div>

                <div className="space-y-2 xl:col-span-3">
                  <Label>Nomor / KAV / Blok</Label>
                  <Input 
                    value={form.nomorBlokObjek} 
                    onChange={(e) => setField("nomorBlokObjek", e.target.value.slice(0, 12))} 
                    className={inputCls} 
                    placeholder="Contoh: BLOK A / 12"
                  />
                </div>

                <div className="space-y-2 xl:col-span-4">
                  <Label>Desa / Kelurahan Objek</Label>
                  <Input 
                    id="f-desa-obj"
                    value={form.desaObjek} 
                    onChange={(e) => setField("desaObjek", e.target.value.slice(0, 21))} 
                    className={inputCls} 
                    placeholder="Contoh: BALONGBESUK"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 xl:col-span-2">
                  <div className="space-y-2">
                    <Label>RW Objek</Label>
                    <Input 
                      id="f-rw-obj"
                      value={form.rwObjek} 
                      onChange={(e) => setField("rwObjek", e.target.value.replace(/\D/g, "").slice(0, 2))} 
                      className={inputCls} 
                      placeholder="Contoh: 01"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>RT Objek</Label>
                    <Input 
                      id="f-rt-obj"
                      value={form.rtObjek} 
                      onChange={(e) => setField("rtObjek", e.target.value.replace(/\D/g, "").slice(0, 2))} 
                      className={inputCls} 
                      placeholder="Contoh: 01"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 xl:col-span-2">
                  <Label>Luas Tanah (m2)</Label>
                  <Input 
                    id="f-luas-tanah"
                    value={form.luasTanah} 
                    onChange={(e) => setField("luasTanah", e.target.value.replace(/\D/g, "").slice(0, 10))} 
                    className={inputCls} 
                    placeholder="Contoh: 100"
                    required
                  />
                </div>

                <div className="space-y-3 xl:col-span-12">
                  <Label>Jenis Tanah</Label>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {[
                      { value: "TANAH_BANGUNAN", label: "Tanah + Bangunan" },
                      { value: "KAVLING_SIAP_BANGUN", label: "Kavling Siap Bangun" },
                      { value: "TANAH_KOSONG", label: "Tanah Kosong" },
                      { value: "FASILITAS_UMUM", label: "Fasilitas Umum" },
                    ].map((t) => (
                      <Button
                        key={t.value}
                        variant="outline"
                        type="button"
                        onClick={() => setField("jenisTanah", t.value as any)}
                        className={cn(
                          "h-12 flex-1 rounded-2xl px-3 text-[10px] font-black uppercase tracking-wider transition-all",
                          form.jenisTanah === t.value
                            ? selectedCls
                            : isDark 
                              ? "border-white/10 bg-white/5 text-white/40 hover:bg-white/10" 
                              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                        )}
                      >
                        {t.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 xl:grid-cols-12">
              <div className="space-y-2 xl:col-span-12">
                <Label>Nama Subjek Pajak</Label>
                <Input 
                  id="f-nama-wp"
                  value={form.namaSubjekPajak} 
                  onChange={(e) => setField("namaSubjekPajak", e.target.value.slice(0, 21))} 
                  className={inputCls} 
                  placeholder="Contoh: BUDI SANTOSO"
                  required
                />
              </div>

              <div className="space-y-3 xl:col-span-12">
                <Label>Status</Label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                  {[
                    { value: "PEMILIK", label: "Pemilik" },
                    { value: "PENYEWA", label: "Penyewa" },
                    { value: "PENGELOLA", label: "Pengelola" },
                    { value: "PEMAKAI", label: "Pemakai" },
                    { value: "SENGKETA", label: "Sengketa" },
                  ].map((t) => (
                    <Button
                      key={t.value}
                      variant="outline"
                      type="button"
                      onClick={() => setField("statusSubjek", t.value as any)}
                      className={cn(
                        "h-12 flex-1 rounded-2xl px-3 text-[10px] font-black uppercase tracking-wider transition-all",
                        form.statusSubjek === t.value
                          ? selectedCls
                          : isDark 
                            ? "border-white/10 bg-white/5 text-white/40 hover:bg-white/10" 
                            : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 xl:col-span-12">
                <Label>Pekerjaan</Label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                  {[
                    { value: "PNS", label: "PNS" },
                    { value: "TNI", label: "TNI" },
                    { value: "PENSIUNAN", label: "Pensiunan" },
                    { value: "BADAN", label: "Badan" },
                    { value: "LAINNYA", label: "Lainnya" },
                  ].map((t) => (
                    <Button
                      key={t.value}
                      variant="outline"
                      type="button"
                      onClick={() => setField("pekerjaan", t.value as any)}
                      className={cn(
                        "h-12 flex-1 rounded-2xl px-3 text-[10px] font-black uppercase tracking-wider transition-all",
                        form.pekerjaan === t.value
                          ? selectedCls
                          : isDark 
                            ? "border-white/10 bg-white/5 text-white/40 hover:bg-white/10" 
                            : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 xl:col-span-3">
                <Label>NPWP</Label>
                <Input 
                  value={form.npwp} 
                  onChange={(e) => setField("npwp", e.target.value.replace(/\D/g, "").slice(0, 14))} 
                  className={inputCls} 
                  placeholder="Contoh: 01234567891234"
                />
              </div>

              <div className="space-y-2 xl:col-span-3">
                <Label>Nomor KTP</Label>
                <Input 
                  id="f-ktp-wp" 
                  value={form.nomorKtp} 
                  onChange={(e) => setField("nomorKtp", e.target.value.replace(/\D/g, "").slice(0, 16))} 
                  className={inputCls} 
                  placeholder="Contoh: 3515011234567890" 
                  required 
                />
              </div>

              <div className="space-y-2 xl:col-span-8">
                <Label>Nama Jalan Subjek</Label>
                <Input 
                  id="f-jalan-wp"
                  value={form.namaJalanSubjek} 
                  onChange={(e) => setField("namaJalanSubjek", e.target.value.slice(0, 21))} 
                  className={inputCls} 
                  placeholder="Contoh: JL. MELATI NO. 5"
                  required
                />
              </div>

               <div className="space-y-2 xl:col-span-4">
                <Label>Blok / Kav / Nomor</Label>
                <Input 
                  value={form.blokSubjek} 
                  onChange={(e) => setField("blokSubjek", e.target.value.slice(0, 12))} 
                  className={inputCls} 
                  placeholder="Contoh: BLOK B / 05"
                />
              </div>

              <div className="space-y-2 xl:col-span-6">
                <Label>Desa / Kelurahan Subjek</Label>
                <Input 
                  id="f-desa-wp"
                  value={form.desaSubjek} 
                  onChange={(e) => setField("desaSubjek", e.target.value.slice(0, 21))} 
                  className={inputCls} 
                  placeholder="Contoh: BALONGBESUK"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 xl:col-span-3">
                <div className="space-y-2">
                  <Label>RW Subjek</Label>
                  <Input 
                    id="f-rw-wp"
                    value={form.rwSubjek} 
                    onChange={(e) => setField("rwSubjek", e.target.value.replace(/\D/g, "").slice(0, 2))} 
                    className={inputCls} 
                    placeholder="Contoh: 02"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>RT Subjek</Label>
                  <Input 
                    id="f-rt-wp"
                    value={form.rtSubjek} 
                    onChange={(e) => setField("rtSubjek", e.target.value.replace(/\D/g, "").slice(0, 2))} 
                    className={inputCls} 
                    placeholder="Contoh: 05"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:col-span-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-2">
                    <Label>Kabupaten / Kota</Label>
                    <Input 
                      id="f-kab-wp"
                      value={form.kabupaten} 
                      onChange={(e) => setField("kabupaten", e.target.value.slice(0, 8))} 
                      className={inputCls} 
                      placeholder="Contoh: JOMBANG"
                      required
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label>Kode Pos</Label>
                    <Input 
                      id="f-pos-wp" 
                      value={form.kodePosSubjek} 
                      onChange={(e) => setField("kodePosSubjek", e.target.value.replace(/\D/g, "").slice(0, 5))} 
                      className={inputCls} 
                      placeholder="61471" 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 xl:col-span-4">
                <Label>Nama Penandatangan</Label>
                <Input id="f-sig-wp" value={form.namaPenandatangan} onChange={(e) => setField("namaPenandatangan", e.target.value)} className={inputCls} placeholder="Contoh: BUDI SANTOSO" required />
              </div>

              <div className="space-y-2 xl:col-span-4">
                <Label>Tanggal Tanda Tangan</Label>
                <Input type="date" value={form.tanggalTandaTangan} onChange={(e) => setField("tanggalTandaTangan", e.target.value)} className={inputCls} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 xl:grid-cols-12">
              <div className="space-y-2 xl:col-span-3">
                <Label>Jumlah Bangunan</Label>
                  <Input 
                    id="f-jml-bng"
                    value={form.jumlahBangunan} 
                    onChange={(e) => setField("jumlahBangunan", e.target.value.replace(/\D/g, ""))} 
                    className={inputCls} 
                    placeholder="Contoh: 1"
                  />
              </div>

              <div className="space-y-2 xl:col-span-3">
                <Label>Bangunan Ke</Label>
                  <Input 
                    id="f-bng-ke"
                    value={form.bangunanKe} 
                    onChange={(e) => setField("bangunanKe", e.target.value.replace(/\D/g, ""))} 
                    className={inputCls} 
                    placeholder="Contoh: 1"
                  />
              </div>

              <div id="f-jenis-bng" className="space-y-3 xl:col-span-12">
                <Label>Jenis Bangunan</Label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
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
                    <Button
                      key={t.value}
                      variant="outline"
                      type="button"
                      onClick={() => setField("jenisBangunan", t.value as any)}
                      className={cn(
                        "h-14 flex items-center justify-start rounded-2xl px-3 transition-all",
                        form.jenisBangunan === t.value
                          ? selectedCls
                          : isDark 
                            ? "border-white/10 bg-white/5 text-white/40 hover:bg-white/10" 
                            : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-md border flex items-center justify-center mr-2 bg-white/10",
                        form.jenisBangunan === t.value 
                          ? "border-white" 
                          : isDark ? "border-white/20" : "border-slate-300"
                      )}>
                        {form.jenisBangunan === t.value && <div className={cn("w-2 h-2 rounded-sm shadow-sm", isDark ? "bg-white" : "bg-white")} />}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-tight text-left leading-tight">
                        {t.label}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 xl:col-span-3">
                <Label>Luas Bangunan (m2)</Label>
                  <Input 
                    id="f-luas-bng"
                    value={form.luasBangunan} 
                    onChange={(e) => setField("luasBangunan", e.target.value.replace(/\D/g, ""))} 
                    className={inputCls} 
                    placeholder="Contoh: 80"
                  />
              </div>

              <div className="space-y-2 xl:col-span-3">
                <Label>Jumlah Lantai</Label>
                  <Input 
                    id="f-lt-bng"
                    value={form.jumlahLantai} 
                    onChange={(e) => setField("jumlahLantai", e.target.value.replace(/\D/g, ""))} 
                    className={inputCls} 
                    placeholder="Contoh: 1"
                  />
              </div>

              <div className="space-y-2 xl:col-span-3">
                <Label>Tahun Dibangun</Label>
                  <Input 
                    id="f-thn-bng"
                    value={form.tahunDibangun} 
                    onChange={(e) => setField("tahunDibangun", e.target.value.replace(/\D/g, "").slice(0, 4))} 
                    className={inputCls} 
                    placeholder="Contoh: 2010"
                  />
              </div>

              <div className="space-y-2 xl:col-span-3">
                <Label>Tahun Renovasi</Label>
                <Input 
                  value={form.tahunRenovasi} 
                  onChange={(e) => setField("tahunRenovasi", e.target.value.replace(/\D/g, "").slice(0, 4))} 
                  className={inputCls} 
                  placeholder="Contoh: 2024"
                />
              </div>

              <div className="space-y-2 xl:col-span-4">
                <Label>Daya Listrik (Watt)</Label>
                <Input 
                  id="f-daya-listrik"
                  value={form.dayaListrik} 
                  onChange={(e) => setField("dayaListrik", e.target.value.replace(/\D/g, "").slice(0, 7))} 
                  className={inputCls} 
                  placeholder="Contoh: 1300"
                  required
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
                <div key={category.id} id={`f-cat-${category.id}`} className="space-y-3 xl:col-span-12">
                  <Label>{category.label}</Label>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-6 lg:grid-cols-6">
                    {category.options.map((opt) => (
                      <Button
                        key={opt.value}
                        variant="outline"
                        type="button"
                        onClick={() => setField(category.id as any, opt.value)}
                        className={cn(
                          "h-12 flex items-center justify-start rounded-xl px-3 transition-all",
                          (form as any)[category.id] === opt.value
                            ? selectedCls
                            : isDark 
                              ? "border-white/10 bg-white/5 text-white/40 hover:bg-white/10" 
                              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn(
                          "w-3 h-3 rounded-full border flex items-center justify-center mr-2",
                          (form as any)[category.id] === opt.value 
                            ? "border-white" 
                            : isDark ? "border-white/20" : "border-slate-300"
                        )}>
                          {(form as any)[category.id] === opt.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tight text-left leading-tight">
                          {opt.label}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}

            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className={cn("rounded-3xl border p-4", panelCls)}>
                <p className="text-xs font-black uppercase tracking-widest opacity-60">Preview Dokumen</p>
                <p className="mt-2 text-sm opacity-80">
                  Preview ini adalah tampilan yang akan dicetak. Anda dapat memeriksa kembali data sebelum menekan tombol cetak di bawah.
                </p>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/5">
                {previewHtml ? (
                  <iframe 
                    title="Preview SPOP LSPOP" 
                    srcDoc={previewHtml}
                    className="h-[58vh] w-full bg-white" 
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

        <div className={cn("border-t px-5 py-6 sm:px-6", isDark ? "border-white/10 bg-[#0A192F]" : "border-slate-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.03)]")}>
          <div className="flex flex-row items-center gap-3">
            {step > 1 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  if (step === 4 && form.jenisTanah === "TANAH_KOSONG") {
                    setStep(2);
                  } else {
                    setStep((prev) => prev - 1);
                  }
                }} 
                className={cn(
                  "h-12 flex-1 rounded-2xl sm:flex-initial sm:min-w-32 font-bold transition-all active:scale-95",
                  isDark 
                    ? "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white" 
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                )}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
            )}
            
            <div className={cn("flex flex-1 items-center gap-3 sm:justify-end", step === 1 ? "justify-center" : "")}>
              {step < 4 ? (
                <Button 
                  onClick={() => {
                    const focusField = (id: string) => {
                      const el = document.getElementById(id);
                      if (el) {
                        el.focus();
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-2', 'ring-destructive');
                        setTimeout(() => el.classList.remove('ring-2', 'ring-destructive'), 3000);
                      }
                    };

                    if (step === 1) {
                      if (!form.nop || form.nop.length < 18) {
                        toast.error("NOP wajib diisi lengkap (18 digit)");
                        focusField("f-nop");
                        return;
                      }
                      if (!form.namaJalanObjek) {
                        toast.error("Nama Jalan Objek wajib diisi");
                        focusField("f-jalan-obj");
                        return;
                      }
                      if (!form.desaObjek) {
                        toast.error("Desa Objek wajib diisi");
                        focusField("f-desa-obj");
                        return;
                      }
                      if (!form.rwObjek) {
                        toast.error("RW Objek wajib diisi");
                        focusField("f-rw-obj");
                        return;
                      }
                      if (!form.rtObjek) {
                        toast.error("RT Objek wajib diisi");
                        focusField("f-rt-obj");
                        return;
                      }
                      if (!form.luasTanah || form.luasTanah === "0") {
                        toast.error("Luas Tanah wajib diisi");
                        focusField("f-luas-tanah");
                        return;
                      }
                      setStep(2);
                    } else if (step === 2) {
                      if (!form.namaSubjekPajak) {
                        toast.error("Nama Subjek Pajak wajib diisi");
                        focusField("f-nama-wp");
                        return;
                      }
                      if (!form.nomorKtp || form.nomorKtp.length < 16) {
                        toast.error("Nomor KTP wajib diisi (16 digit)");
                        focusField("f-ktp-wp");
                        return;
                      }
                      if (!form.namaJalanSubjek) {
                        toast.error("Nama Jalan Subjek wajib diisi");
                        focusField("f-jalan-wp");
                        return;
                      }
                      if (!form.desaSubjek) {
                        toast.error("Desa Subjek wajib diisi");
                        focusField("f-desa-wp");
                        return;
                      }
                      if (!form.rwSubjek) {
                        toast.error("RW Subjek wajib diisi");
                        focusField("f-rw-wp");
                        return;
                      }
                      if (!form.rtSubjek) {
                        toast.error("RT Subjek wajib diisi");
                        focusField("f-rt-wp");
                        return;
                      }
                      if (!form.kabupaten) {
                        toast.error("Kabupaten Subjek wajib diisi");
                        focusField("f-kab-wp");
                        return;
                      }
                      if (!form.kodePosSubjek) {
                        toast.error("Kode Pos Subjek wajib diisi");
                        focusField("f-pos-wp");
                        return;
                      }
                      if (!form.namaPenandatangan) {
                        toast.error("Nama Penandatangan wajib diisi");
                        focusField("f-sig-wp");
                        return;
                      }

                      if (form.jenisTanah === "TANAH_KOSONG") {
                        handlePreview();
                      } else {
                        setStep(3);
                      }
                    } else if (step === 3) {
                      if (!form.jumlahBangunan || form.jumlahBangunan === "0") {
                        toast.error("Jumlah Bangunan wajib diisi");
                        focusField("f-jml-bng");
                        return;
                      }
                      if (!form.bangunanKe) {
                        toast.error("Urutan Bangunan Ke- wajib diisi");
                        focusField("f-bng-ke");
                        return;
                      }
                      if (!form.tahunDibangun) {
                        toast.error("Tahun Bangunan wajib diisi");
                        focusField("f-thn-bng");
                        return;
                      }
                      if (!form.luasBangunan || form.luasBangunan === "0") {
                        toast.error("Luas Bangunan wajib diisi");
                        focusField("f-luas-bng");
                        return;
                      }
                      if (!form.jumlahLantai || form.jumlahLantai === "0") {
                        toast.error("Jumlah Lantai wajib diisi");
                        focusField("f-lt-bng");
                        return;
                      }
                      if (!form.dayaListrik || form.dayaListrik === "0") {
                        toast.error("Daya Listrik wajib diisi");
                        focusField("f-daya-listrik");
                        return;
                      }
                      if (!form.jenisBangunan) {
                        toast.error("Jenis Bangunan wajib dipilih");
                        focusField("f-jenis-bng");
                        return;
                      }
                      if (!form.kondisi) {
                        toast.error("Kondisi Bangunan wajib dipilih");
                        focusField("f-cat-kondisi");
                        return;
                      }
                      if (!form.konstruksi) {
                        toast.error("Konstruksi wajib dipilih");
                        focusField("f-cat-konstruksi");
                        return;
                      }
                      if (!form.atap) {
                        toast.error("Atap wajib dipilih");
                        focusField("f-cat-atap");
                        return;
                      }
                      if (!form.dinding) {
                        toast.error("Dinding wajib dipilih");
                        focusField("f-cat-dinding");
                        return;
                      }
                      if (!form.lantai) {
                        toast.error("Lantai wajib dipilih");
                        focusField("f-cat-lantai");
                        return;
                      }
                      if (!form.langitLangit) {
                        toast.error("Langit-langit wajib dipilih");
                        focusField("f-cat-langitLangit");
                        return;
                      }

                      handlePreview();
                    }
                  }}
                  className={cn(
                    "h-12 w-full rounded-2xl sm:w-auto sm:min-w-40 font-bold tracking-tight shadow-lg transition-all active:scale-95",
                    isDark 
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20" 
                      : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                  )}
                >
                  {step === 3 || (step === 2 && form.jenisTanah === "TANAH_KOSONG") ? "Buka Preview" : "Lanjut"}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleHtmlPrint} 
                  className="h-12 w-full sm:w-auto rounded-2xl sm:min-w-64 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <Printer className="mr-2 h-5 w-5" />
                  Cetak Dokumen SPOP / LSPOP
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
