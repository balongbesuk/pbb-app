"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Printer, FileText, User, MapPin, Ruler, AlertCircle, ChevronRight, ChevronLeft, Check, History, ShieldAlert, Monitor } from "lucide-react";
import { cn, formatDateNoTime } from "@/lib/utils";
import { toast } from "sonner";

interface SpptData {
  nop: string;
  namaWp: string;
  alamat: string;
  luasTanah: number;
  luasBangunan: number;
}

interface SpptMutationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  oldData: SpptData;
  isDark?: boolean;
  villageName?: string;
  districtName?: string;
  regencyName?: string;
}

type FieldErrors = {
  nomorSurat?: string;
  pemohon?: string;
  nikPemohon?: string;
  namaKades?: string;
  luasSebenarnya?: string;
  sisa?: string;
};

const MAX_TEXT_LENGTH = 120;
const MAX_ADDRESS_LENGTH = 180;

const sanitizeText = (value: string, maxLength = MAX_TEXT_LENGTH) =>
  value
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, maxLength);

const sanitizeUpperText = (value: string, maxLength = MAX_TEXT_LENGTH) =>
  sanitizeText(value, maxLength).toUpperCase();

const sanitizeNumberString = (value: string, maxLength: number) =>
  value.replace(/\D/g, "").slice(0, maxLength);

const sanitizeNomorSurat = (value: string) =>
  value
    .replace(/[^A-Za-z0-9\s./-]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, 80);

const sanitizeAreaText = (value: string, maxLength = 40) =>
  value
    .replace(/[^A-Za-z0-9\s./-]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, maxLength);

const sanitizePositiveNumber = (value: string, max = 99999) => {
  const digits = value.replace(/\D/g, "").slice(0, String(max).length);
  if (!digits) return 0;
  return Math.min(Number(digits), max);
};


const letterDocumentStyles = `
  @page {
    size: 215mm 330mm;
    margin: 14mm;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 20px;
    background: #f3f4f6;
    color: #000;
    font-family: "Times New Roman", Times, serif;
  }

  p {
    margin: 0;
  }

  .letter-stack {
    display: flex;
    flex-direction: column;
    gap: 32px;
    align-items: center;
  }

  .letter-page {
    width: 215mm;
    min-height: 330mm;
    padding: 18mm 20mm;
    background: #fff;
    color: #000;
    border: 1px solid #d4d4d8;
    box-shadow: 0 18px 50px rgba(15, 23, 42, 0.14);
    font-size: 12pt;
    line-height: 1.35;
  }

  .letter-header-grid {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }

  .letter-header-grid td {
    vertical-align: top;
  }

  .letter-left-head {
    width: 55%;
    padding-right: 28px;
  }

  .letter-right-head {
    width: 45%;
  }

  .letter-indent {
    text-indent: 40px;
  }

  .letter-label-indent {
    padding-left: 54px;
  }

  .letter-city-indent {
    padding-left: 32px;
    letter-spacing: 2px;
  }

  .letter-section-title {
    margin-top: 18px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .letter-table-wrap {
    padding-left: 24px;
  }

  .letter-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
  }

  .letter-table td {
    padding: 2px 0;
    vertical-align: top;
  }

  .letter-table td:first-child {
    width: 185px;
  }

  .letter-table td:nth-child(2) {
    width: 14px;
  }

  .letter-block-gap {
    margin-top: 16px;
  }

  .letter-big-gap {
    margin-top: 28px;
  }

  .letter-list {
    margin: 6px 0 0;
    padding-left: 22px;
  }

  .letter-list li {
    margin-bottom: 4px;
  }

  .letter-list-disc {
    margin: 4px 0 0;
    padding-left: 22px;
    list-style: disc;
  }

  .letter-signature {
    margin-top: 42px;
    padding-right: 48px;
    text-align: right;
  }

  .letter-sign-space {
    height: 84px;
  }

  .letter-kop {
    border-bottom: 3px double #000;
    margin-bottom: 28px;
    padding-bottom: 8px;
  }

  .letter-kop-flex {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .letter-kop-logo {
    width: 78px;
    height: auto;
    object-fit: contain;
    flex-shrink: 0;
  }

  .letter-kop-text {
    flex: 1;
    text-align: center;
  }

  .letter-kop-address {
    font-size: 9pt;
    font-style: italic;
  }

  .letter-center {
    text-align: center;
  }

  .letter-info-grid {
    padding-left: 40px;
    margin-top: 10px;
  }

  .letter-info-row {
    display: flex;
    margin-top: 2px;
  }

  .letter-info-key {
    width: 128px;
    flex-shrink: 0;
  }

  .letter-box {
    border: 1px solid #000;
    padding: 8px 10px;
    margin-top: 10px;
  }

  .letter-grid-two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .letter-grid-three {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }

  .letter-label {
    display: block;
    margin-bottom: 4px;
    font-size: 9pt;
    font-weight: 700;
    text-transform: uppercase;
  }

  .letter-value {
    min-height: 24px;
    border-bottom: 1px dotted #000;
    padding-bottom: 2px;
    font-size: 11pt;
  }

  .letter-divider {
    border-top: 1px solid #000;
    margin: 14px 0;
  }

  .letter-sketch {
    min-height: 160px;
    border: 1px dashed #000;
    padding: 10px;
  }

  .letter-note-list {
    margin: 8px 0 0;
    padding-left: 18px;
  }

  .letter-note-list li {
    margin-bottom: 4px;
  }

  .font-bold {
    font-weight: 700;
  }

  .underline {
    text-decoration: underline;
  }

  .italic {
    font-style: italic;
  }

  .uppercase {
    text-transform: uppercase;
  }

  .font-mono {
    font-family: "Courier New", Courier, monospace;
  }

  @media print {
    body {
      background: #fff;
      padding: 0;
    }

    .letter-stack {
      gap: 0;
    }

    .letter-page {
      border: none;
      box-shadow: none;
      margin: 0;
      page-break-after: always;
    }

    .letter-page:last-child {
      page-break-after: auto;
    }
  }
`;

export function SpptMutationDialog({
  open,
  onOpenChange,
  oldData,
  isDark = false,
  villageName = "",
  districtName = "",
  regencyName = "JOMBANG",
}: SpptMutationDialogProps) {
  const [step, setStep] = useState(1);
  const [dasar, setDasar] = useState<"JUAL_BELI" | "HIBAH" | "WARIS">("JUAL_BELI");
  const [pemohon, setPemohon] = useState("");
  const [newDataList, setNewDataList] = useState<SpptData[]>([
    { ...oldData }
  ]);
  const [luasSebenarnya, setLuasSebenarnya] = useState<string>("");
  const [sisa, setSisa] = useState<string>("HABIS");
  const [nikPemohon, setNikPemohon] = useState("");
  const [nomorSurat, setNomorSurat] = useState("");
  const [namaKades, setNamaKades] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const handleAddData = () => {
    setNewDataList([...newDataList, { ...oldData, namaWp: "", alamat: "" }]);
  };

  const handleRemoveData = (index: number) => {
    if (newDataList.length > 1) {
      setNewDataList(newDataList.filter((_, i) => i !== index));
    }
  };

  const handleUpdateNewData = (index: number, field: keyof SpptData, value: string | number) => {
    const updated = [...newDataList];
    updated[index] = { ...updated[index], [field]: value };
    setNewDataList(updated);
  };

  const formErrors: FieldErrors = {};
  const trimmedPemohon = pemohon.trim();
  const trimmedNikPemohon = nikPemohon.trim();
  const trimmedNomorSurat = nomorSurat.trim();
  const trimmedNamaKades = namaKades.trim();
  const trimmedLuasSebenarnya = luasSebenarnya.trim();
  const trimmedSisa = sisa.trim();

  if (!trimmedNomorSurat) formErrors.nomorSurat = "Nomor surat wajib diisi.";
  else if (trimmedNomorSurat.length < 6) formErrors.nomorSurat = "Nomor surat terlalu pendek.";

  if (!trimmedPemohon) formErrors.pemohon = "Nama pemohon wajib diisi.";
  else if (trimmedPemohon.length < 3) formErrors.pemohon = "Nama pemohon minimal 3 karakter.";

  if (!trimmedNikPemohon) formErrors.nikPemohon = "NIK pemohon wajib diisi.";
  else if (trimmedNikPemohon.length !== 16) formErrors.nikPemohon = "NIK harus 16 digit.";

  if (!trimmedNamaKades) formErrors.namaKades = "Nama kepala desa wajib diisi.";
  else if (trimmedNamaKades.length < 3) formErrors.namaKades = "Nama kepala desa minimal 3 karakter.";

  if (!trimmedLuasSebenarnya) formErrors.luasSebenarnya = "Luas sebenarnya wajib diisi.";

  if (!trimmedSisa) formErrors.sisa = "Status sisa tanah wajib diisi.";

  const newDataErrors = newDataList.map((item) => {
    const itemErrors: Partial<Record<keyof SpptData, string>> = {};

    if (!item.nop.trim()) itemErrors.nop = "NOP baru wajib diisi.";
    else if (item.nop.replace(/\D/g, "").length !== 18) itemErrors.nop = "NOP harus 18 digit.";

    if (!item.namaWp.trim()) itemErrors.namaWp = "Nama wajib pajak wajib diisi.";
    else if (item.namaWp.trim().length < 3) itemErrors.namaWp = "Nama wajib pajak minimal 3 karakter.";

    if (!item.alamat.trim()) itemErrors.alamat = "Alamat wajib diisi.";
    else if (item.alamat.trim().length < 5) itemErrors.alamat = "Alamat terlalu pendek.";

    if (!Number.isFinite(item.luasTanah) || item.luasTanah <= 0) itemErrors.luasTanah = "Luas tanah harus lebih dari 0.";
    if (!Number.isFinite(item.luasBangunan) || item.luasBangunan < 0) itemErrors.luasBangunan = "Luas bangunan tidak boleh negatif.";
    if (item.luasBangunan > item.luasTanah) itemErrors.luasBangunan = "Luas bangunan tidak boleh melebihi luas tanah.";

    return itemErrors;
  });

  const totalLuasTanahBaru = newDataList.reduce((acc, curr) => acc + Number(curr.luasTanah || 0), 0);
  const totalLuasBangunanBaru = newDataList.reduce((acc, curr) => acc + Number(curr.luasBangunan || 0), 0);

  const hasStepOneErrors = Boolean(formErrors.nomorSurat || formErrors.pemohon || formErrors.nikPemohon || formErrors.namaKades);
  const hasStepTwoErrors =
    Boolean(formErrors.luasSebenarnya || formErrors.sisa) ||
    totalLuasTanahBaru > oldData.luasTanah ||
    newDataErrors.some((item) => Object.keys(item).length > 0);

  const canGoNextFromStepOne = !hasStepOneErrors;
  const canGoNextFromStepTwo = !hasStepTwoErrors;
  const canPrint = canGoNextFromStepOne && canGoNextFromStepTwo;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent || !canPrint) return;

    const win = window.open("", "_blank");
    if (!win) return;

    const logoSrc = `${window.location.origin}/uploads/logo-desa.png`;

    win.document.write(`
      <html>
        <head>
          <title>Surat Permohonan Mutasi PBB</title>
          <style>
            ${letterDocumentStyles}
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent.innerHTML.replaceAll("/uploads/logo-desa.png", logoSrc)}
        </body>
      </html>
    `);
    win.document.close();
  };

  const stepClasses = (s: number) => cn(
    "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all",
    step === s 
      ? "bg-primary text-white shadow-lg shadow-primary/30" 
      : step > s 
        ? "bg-emerald-500 text-white" 
        : isDark ? "bg-white/10 text-white/40" : "bg-slate-100 text-slate-400"
  );



  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setStep(1);
      onOpenChange(val);
    }}>
      <DialogContent className={cn(
        "max-w-4xl sm:max-w-4xl w-full sm:w-[90vw] h-[95vh] sm:h-[85vh] overflow-hidden flex flex-col p-0 border-none sm:rounded-3xl rounded-t-3xl shadow-2xl",
        isDark ? "bg-[#0A192F] text-white" : "bg-white text-slate-900"
      )}>
        <DialogHeader className="p-4 sm:p-6 pb-2 border-b border-white/5">
          <div className="flex items-center gap-4 mb-4">
             <div className="p-2.5 bg-primary/10 rounded-2xl">
                <FileText className="w-6 h-6 text-primary" />
             </div>
             <div>
               <DialogTitle className="text-xl font-black uppercase tracking-tight">Mutasi / Pemecahan PBB</DialogTitle>
               <DialogDescription className={isDark ? "text-blue-100/60" : "text-slate-500"}>
                 Buat surat permohonan perubahan data SPPT dengan mudah.
               </DialogDescription>
             </div>
          </div>

          <div className="flex items-center justify-between px-2 sm:px-4 py-2 bg-black/5 dark:bg-white/5 rounded-2xl">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-1 sm:gap-2">
                <div className={stepClasses(s)}>{step > s ? <Check className="w-4 h-4" /> : s}</div>
                <span className={cn(
                  "text-[9px] sm:text-[10px] font-black uppercase tracking-widest block sm:block",
                  step === s ? "text-primary" : "opacity-40",
                  step !== s && "hidden sm:block"
                )}>
                  {s === 1 ? "Lama" : s === 2 ? "Baru" : "Preview"}
                </span>
                {s < 3 && <ChevronRight className="w-3 h-3 sm:w-4 h-4 opacity-10" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="space-y-4">
                  <Label className="text-xs font-black uppercase tracking-widest opacity-50">Dasar Pengajuan Perubahan</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "JUAL_BELI", label: "Jual Beli" },
                      { id: "HIBAH", label: "Hibah" },
                      { id: "WARIS", label: "Waris" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDasar(item.id as any)}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all outline-none",
                          dasar === item.id 
                            ? "bg-primary/10 border-primary text-primary" 
                            : isDark ? "border-transparent bg-white/5 opacity-50 hover:opacity-100" : "border-transparent bg-slate-100 opacity-50 hover:opacity-100"
                        )}
                      >
                        <span className="font-bold text-sm tracking-wide">{item.label}</span>
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    <Label className="text-xs font-black uppercase tracking-widest opacity-50">Data Objek Saat Ini (Lama)</Label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/5 bg-black/5 dark:bg-white/5">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">NOP</p>
                      <p className="font-bold">{oldData.nop}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Nama Wajib Pajak</p>
                      <p className="font-bold uppercase">{oldData.namaWp}</p>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Alamat</p>
                      <p className="font-bold uppercase">{oldData.alamat}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Luas Tanah</p>
                      <p className="font-bold">{oldData.luasTanah} m²</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Luas Bangunan</p>
                      <p className="font-bold">{oldData.luasBangunan} m²</p>
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <Label className="text-xs font-black uppercase tracking-widest opacity-50">Nomor Surat Keterangan</Label>
                  <div className="relative">
                    <FileText className={cn("absolute left-3.5 top-3.5 h-5 w-5", isDark ? "text-blue-400 opacity-60" : "opacity-30")} />
                    <Input 
                      id="f-mut-nomor"
                      placeholder="Contoh: 594 / 001 / 415.51.16 / 2026" 
                      className={cn(
                        "pl-11 h-12 rounded-2xl font-bold transition-all",
                        isDark 
                          ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 hover:bg-white/10" 
                          : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 hover:bg-slate-100",
                      )}
                      value={nomorSurat}
                      onChange={(e) => setNomorSurat(sanitizeNomorSurat(e.target.value).slice(0, 20))}
                      maxLength={20}
                    />
                  </div>
               </div>

               <div className="space-y-4">
                  <Label className="text-xs font-black uppercase tracking-widest opacity-50">Nama Pengaju (Pemohon)</Label>
                  <div className="relative">
                    <User className={cn("absolute left-3.5 top-3.5 h-5 w-5", isDark ? "text-blue-400 opacity-60" : "opacity-30")} />
                    <Input 
                      id="f-mut-pemohon"
                      placeholder="Contoh: Siti Rohmah" 
                      className={cn(
                        "pl-11 h-12 rounded-2xl font-bold transition-all",
                        isDark 
                          ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 hover:bg-white/10" 
                          : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 hover:bg-slate-100",
                      )}
                      value={pemohon}
                      onChange={(e) => setPemohon(sanitizeText(e.target.value, 20))}
                      maxLength={20}
                    />
                  </div>
               </div>

               <div className="space-y-4">
                  <Label className="text-xs font-black uppercase tracking-widest opacity-50">NIK Pemohon</Label>
                  <div className="relative">
                    <ShieldAlert className={cn("absolute left-3.5 top-3.5 h-5 w-5", isDark ? "text-blue-400 opacity-60" : "opacity-30")} />
                    <Input 
                      id="f-mut-nik"
                      placeholder="Contoh: 351708..." 
                      className={cn(
                        "pl-11 h-12 rounded-2xl font-bold transition-all",
                        isDark 
                          ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 hover:bg-white/10" 
                          : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 hover:bg-slate-100",
                      )}
                      value={nikPemohon}
                      onChange={(e) => setNikPemohon(sanitizeNumberString(e.target.value, 16))}
                      inputMode="numeric"
                      maxLength={16}
                    />
                  </div>
               </div>

               <div className="space-y-4">
                  <Label className="text-xs font-black uppercase tracking-widest opacity-50">Nama Kepala Desa</Label>
                  <div className="relative">
                    <User className={cn("absolute left-3.5 top-3.5 h-5 w-5", isDark ? "text-blue-400 opacity-60" : "opacity-30")} />
                    <Input 
                      id="f-mut-kades"
                      placeholder="Contoh: MOCHAMAD SAIFUR, S.Sos." 
                      className={cn(
                        "pl-11 h-12 rounded-2xl font-bold transition-all",
                        isDark 
                          ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 hover:bg-white/10" 
                          : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 hover:bg-slate-100",
                      )}
                      value={namaKades}
                      onChange={(e) => setNamaKades(sanitizeText(e.target.value, 20))}
                      maxLength={20}
                    />
                  </div>
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary" />
                    <Label className="text-xs font-black uppercase tracking-widest opacity-50">Daftar Objek Baru</Label>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddData}
                    className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                  >
                    <Plus className="w-3 h-3" /> Tambah Objek
                  </Button>
               </div>

               <div className="space-y-6">
                 {newDataList.map((item, index) => (
                   <div key={index} className="relative p-6 rounded-3xl border border-primary/10 bg-primary/5 space-y-5 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between gap-4">
                        <div className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                          Objek Baru #{index + 1}
                        </div>
                        {newDataList.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveData(index)}
                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-full"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 px-1">NOP SPPT Baru</Label>
                          <Input 
                            id={`f-mut-nop-${index}`}
                            value={item.nop}
                            onChange={(e) => handleUpdateNewData(index, "nop", sanitizeNumberString(e.target.value, 18))}
                            className={cn(
                              "h-11 rounded-xl font-mono transition-all",
                              isDark 
                                ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 hover:bg-white/10" 
                                : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 hover:bg-slate-100",
                            )}
                            inputMode="numeric"
                            maxLength={18}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 px-1">Nama Wajib Pajak Baru</Label>
                          <Input 
                            id={`f-mut-nama-${index}`}
                            value={item.namaWp}
                            onChange={(e) => handleUpdateNewData(index, "namaWp", sanitizeUpperText(e.target.value, 20))}
                            className={cn(
                              "h-11 rounded-xl font-bold transition-all",
                              isDark 
                                ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 hover:bg-white/10" 
                                : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 hover:bg-slate-100",
                            )}
                            maxLength={20}
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 px-1">Alamat Baru</Label>
                          <Input 
                            id={`f-mut-alamat-${index}`}
                            value={item.alamat}
                            onChange={(e) => handleUpdateNewData(index, "alamat", sanitizeUpperText(e.target.value, 20))}
                            className={cn(
                              "h-11 rounded-xl font-medium transition-all",
                              isDark 
                                ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 hover:bg-white/10" 
                                : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 hover:bg-slate-100",
                            )}
                            maxLength={20}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 px-1">Luas Tanah (m²)</Label>
                          <Input 
                            id={`f-mut-luas-t-${index}`}
                            type="number"
                            value={item.luasTanah}
                            onChange={(e) => handleUpdateNewData(index, "luasTanah", sanitizePositiveNumber(e.target.value))}
                            className={cn(
                              "h-11 rounded-xl font-bold transition-all",
                              isDark 
                                ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 hover:bg-white/10" 
                                : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 hover:bg-slate-100",
                            )}
                            min={0}
                            maxLength={5}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 px-1">Luas Bangunan (m²)</Label>
                          <Input 
                            id={`f-mut-luas-b-${index}`}
                            type="number"
                            value={item.luasBangunan}
                            onChange={(e) => handleUpdateNewData(index, "luasBangunan", sanitizePositiveNumber(e.target.value))}
                            className={cn(
                              "h-11 rounded-xl font-bold transition-all",
                              isDark 
                                ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 hover:bg-white/10" 
                                : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 hover:bg-slate-100",
                            )}
                            min={0}
                            maxLength={5}
                          />
                        </div>
                      </div>
                   </div>
                 ))}
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Luas Tanah & Bangunan Sebenarnya</Label>
                    <Input
                      id="f-mut-luas-seb"
                      placeholder="Contoh: 3.655 m²"
                      value={luasSebenarnya}
                      onChange={(e) => setLuasSebenarnya(sanitizeNumberString(e.target.value, 5))}
                      className={cn(
                        "h-12 rounded-2xl bg-slate-50 border text-slate-900 dark:bg-white/5 dark:text-white font-bold transition-all",
                        isDark ? "border-white/10 hover:bg-white/10" : "border-slate-200 hover:bg-slate-100"
                      )}
                      maxLength={5}
                      inputMode="numeric"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Status Sisa Tanah</Label>
                    <Input
                      id="f-mut-sisa"
                      placeholder="Contoh: HABIS / Sisa 100 m²"
                      value={sisa}
                      onChange={(e) => setSisa(sanitizeUpperText(e.target.value, 30))}
                      className={cn(
                        "h-12 rounded-2xl bg-slate-50 border text-slate-900 dark:bg-white/5 dark:text-white font-bold transition-all",
                        isDark ? "border-white/10 hover:bg-white/10" : "border-slate-200 hover:bg-slate-100"
                      )}
                      maxLength={30}
                    />
                  </div>
               </div>

                {totalLuasTanahBaru > oldData.luasTanah && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-start gap-3">
                     <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                     <div>
                       <p className="text-xs font-black uppercase tracking-widest mb-1">Peringatan Luas Tanah Berlebih</p>
                       <p className="text-xs opacity-80">Total luas tanah baru ({totalLuasTanahBaru} m²) melebihi luas asal ({oldData.luasTanah} m²).</p>
                     </div>
                  </div>
                )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
               <style>{letterDocumentStyles}</style>
               <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-full flex-shrink-0">
                    <Printer className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[11px] sm:text-xs font-bold text-primary dark:text-primary">
                    Siap mencetak? Klik pada teks jika Anda ingin melakukan penyesuaian manual langsung sebelum mencetak.
                  </p>
               </div>

               <div className="relative w-full overflow-x-auto pb-4 custom-scrollbar" ref={printRef}>
                  <div className="letter-stack w-max sm:w-full sm:items-center origin-top-left sm:origin-top scale-[0.45] sm:scale-100 mb-[-120%] sm:mb-0">
                  <div 
                    className="letter-page origin-top transition-transform cursor-text outline-none focus:ring-1 focus:ring-primary/20" 
                    contentEditable
                    suppressContentEditableWarning
                  >
                    <div>
                      <table className="letter-header-grid">
                        <tbody>
                          <tr>
                            <td className="letter-left-head">
                              <p>Perihal : Perubahan Mutasi/Pemecahan</p>
                              <p className="letter-label-indent">Objek/Subjek PBB Tahun {new Date().getFullYear()}</p>
                            </td>
                            <td className="letter-right-head">
                               <p>Kepada Yth.</p>
                               <p className="font-bold">Kepala Badan Pendapatan Daerah</p>
                               <p className="font-bold">Kabupaten {regencyName}</p>
                               <p>di -</p>
                               <p className="font-bold letter-city-indent">{regencyName.split("").join(" ")}</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <p className="letter-indent">
                        Sehubungan dengan terjadinya: <span className="font-bold underline italic capitalize">{dasar.replace("_", " ")}</span> ... <span className="font-bold underline italic uppercase">{oldData.namaWp}</span> ... *), 
                        kami mohon untuk diadakan perubahan data Objek/Subjek PBB sebagai berikut:
                      </p>

                      <p className="letter-section-title">Lama:</p>
                      <div className="letter-table-wrap">
                        <table className="letter-table">
                          <tbody>
                            <tr><td>1. NOP SPPT</td><td>:</td><td className="font-mono">{oldData.nop}</td></tr>
                            <tr><td>Nama Wajib Pajak</td><td>:</td><td className="uppercase font-bold">{oldData.namaWp}</td></tr>
                            <tr><td>Alamat</td><td>:</td><td className="uppercase">{oldData.alamat}</td></tr>
                            <tr><td>Luas Tanah</td><td>:</td><td className="font-bold">{oldData.luasTanah} m²</td></tr>
                            <tr><td>Luas Bangunan</td><td>:</td><td className="font-bold">{oldData.luasBangunan} m²</td></tr>
                          </tbody>
                        </table>
                      </div>

                      <p className="letter-section-title">Baru:</p>
                      {newDataList.map((item, idx) => (
                        <div key={idx} className={cn("letter-table-wrap", idx > 0 && "letter-block-gap")}>
                          <table className="letter-table">
                            <tbody>
                              <tr><td>{idx + 1}. NOP SPPT</td><td>:</td><td className="font-mono">{item.nop}</td></tr>
                              <tr><td>Nama Wajib Pajak</td><td>:</td><td className="uppercase font-bold">{item.namaWp || "................"}</td></tr>
                              <tr><td>Alamat</td><td>:</td><td className="uppercase">{item.alamat || "................"}</td></tr>
                              <tr><td>Luas Tanah</td><td>:</td><td className="font-bold">{item.luasTanah || "...."} m²</td></tr>
                              <tr><td>Luas Bangunan</td><td>:</td><td className="font-bold">{item.luasBangunan || "...."} m²</td></tr>
                            </tbody>
                          </table>
                        </div>
                      ))}

                      <p className="letter-big-gap font-bold">
                        Luas Tanah dan Bangunan sebenarnya saat ini: <span className="px-2">{luasSebenarnya || "........ m²"}</span>, dan saat ini sisa: <span className="underline uppercase">{sisa || "HABIS"}</span>.
                      </p>

                      <p className="letter-big-gap">Untuk kelengkapan dan proses lebih lanjut, bersama ini kami sertakan:</p>
                      <ol className="letter-list">
                        <li>Fotocopy KTP / Kartu Keluarga / Identitas lainnya *)</li>
                        <li>SPPT dan Tanda Bukti Pembayaran (STTS) PBB tahun terakhir</li>
                        <li>Tidak mempunyai tunggakan PBB 5 tahun terakhir (dikeluarkan oleh Dinas)</li>
                        <li>SPOP dan LSPOP yang telah diisi dan ditandatangani</li>
                        <li>Fotocopy salah satu surat tanah dan bangunan, antara lain:
                          <ul className="letter-list-disc">
                            <li>Sertifikat tanah</li>
                            <li>Akta Jual Beli</li>
                            <li>Akta Waris</li>
                            <li>Izin Mendirikan Bangunan (IMB)</li>
                            <li>....................................................................</li>
                          </ul>
                        </li>
                          <li>Alas hak tanah / Akta Jual Beli / Surat Hibah / Surat Waris / Surat Tanah *)</li>
                          <li>KTP dan KK pihak-pihak terkait *)</li>
                        </ol>

                        <div className="letter-signature">
                          <p>{villageName || "Balongbesuk"}, {formatDateNoTime(new Date())}</p>
                          <p className="letter-block-gap">Hormat kami,</p>
                          <div className="letter-sign-space"></div>
                          <p className="font-bold underline uppercase">{pemohon || "................"}</p>
                        </div>
                      </div>
                  </div>

                  <div 
                    className="letter-page origin-top transition-transform cursor-text outline-none focus:ring-1 focus:ring-primary/20" 
                    contentEditable
                    suppressContentEditableWarning
                  >
                     <div className="letter-kop">
                      <div className="letter-kop-flex">
                        <img src="/uploads/logo-desa.png" alt="Logo" className="letter-kop-logo" />
                        <div className="letter-kop-text">
                          <p className="font-bold uppercase">PEMERINTAH KABUPATEN {regencyName || "JOMBANG"}</p>
                          <p className="font-bold uppercase">KECAMATAN {districtName || "DIWEK"}</p>
                          <p className="font-bold uppercase" style={{ fontSize: "14pt", letterSpacing: "1px" }}>KANTOR DESA {villageName || "BALONGBESUK"}</p>
                          <p className="letter-kop-address">Jl. KH. Hasyim Asy&apos;ari No. 05, Desa {villageName}, Kec. {districtName}, Kab. {regencyName}</p>
                        </div>
                      </div>
                    </div>

                     <div className="letter-center" style={{ marginBottom: "30px" }}>
                       <p className="font-bold underline uppercase" style={{ fontSize: "16pt", letterSpacing: "2px" }}>SURAT KETERANGAN</p>
                       <p>Nomor : {nomorSurat || ".... / .... / .... / ...."}</p>
                     </div>

                     <div>
                       <p className="letter-indent">
                         Yang bertanda tangan di bawah ini, kami Kepala Desa {villageName || "Balongbesuk"}, Kecamatan {districtName || "Diwek"}, Kabupaten {regencyName || "Jombang"}, menerangkan dengan sebenarnya bahwa:
                       </p>

                       <div className="letter-info-grid">
                         <div className="letter-info-row"><span className="letter-info-key">Nama</span><span>: <span className="font-bold uppercase">{pemohon || ".........."}</span></span></div>
                         <div className="letter-info-row"><span className="letter-info-key">NIK</span><span>: {nikPemohon || ".........."}</span></div>
                         <div className="letter-info-row"><span className="letter-info-key">Telepon</span><span>: -</span></div>
                       </div>

                       <p className="letter-block-gap">Mengajukan Perubahan SPPT PBB (Pemecahan) sebagai berikut:</p>
                       
                       <p className="letter-section-title">Lama:</p>
                       <div className="letter-table-wrap">
                         <table className="letter-table">
                           <tbody>
                             <tr><td>1. NOP SPPT</td><td>:</td><td className="font-mono">{oldData.nop}</td></tr>
                             <tr><td>Nama Wajib Pajak</td><td>:</td><td className="uppercase font-bold">{oldData.namaWp}</td></tr>
                             <tr><td>Alamat</td><td>:</td><td className="uppercase">{oldData.alamat}</td></tr>
                             <tr><td>Luas Tanah</td><td>:</td><td className="font-bold">{oldData.luasTanah} m²</td></tr>
                             <tr><td>Luas Bangunan</td><td>:</td><td className="font-bold">{oldData.luasBangunan} m²</td></tr>
                           </tbody>
                         </table>
                       </div>

                       <p className="letter-section-title">Baru:</p>
                       {newDataList.map((item, idx) => (
                         <div key={idx} className={cn("letter-table-wrap", idx > 0 && "letter-block-gap")}>
                           <table className="letter-table">
                             <tbody>
                               <tr><td>{idx + 1}. NOP SPPT</td><td>:</td><td className="font-mono">{item.nop || "-"}</td></tr>
                               <tr><td>Nama Wajib Pajak</td><td>:</td><td className="uppercase font-bold">{item.namaWp || "................"}</td></tr>
                               <tr><td>Alamat</td><td>:</td><td className="uppercase">{item.alamat || "................"}</td></tr>
                               <tr><td>Luas Tanah</td><td>:</td><td className="font-bold">{item.luasTanah || "...."} m²</td></tr>
                               <tr><td>Luas Bangunan</td><td>:</td><td className="font-bold">{item.luasBangunan || "...."} m²</td></tr>
                             </tbody>
                           </table>
                         </div>
                       ))}

                       <p className="letter-big-gap">
                         Demikian Surat Keterangan ini kami buat dengan sebenarnya untuk dapat dipergunakan sebagai dasar penetapan PBB bagi yang bersangkutan sesuai keadaan saat ini.
                       </p>

                       <div className="letter-signature">
                         <p>{villageName || "Balongbesuk"}, {formatDateNoTime(new Date())}</p>
                         <p className="letter-block-gap">Kepala Desa {villageName || "Balongbesuk"}</p>
                         <div className="letter-sign-space"></div>
                         <p className="font-bold underline uppercase">{namaKades || "................"}</p>
                        </div>
                     </div>
                  </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className={cn(
          "p-4 sm:p-6 border-t flex flex-row gap-3 items-center mt-auto backdrop-blur-md",
          isDark ? "bg-[#0A192F]/80 border-white/5" : "bg-white/80 border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
        )}>
          {step > 1 && (
            <Button 
              variant="outline" 
              onClick={() => setStep(step - 1)}
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
                if (!nomorSurat.trim() || nomorSurat.length < 6) {
                  toast.error("Nomor surat wajib diisi (minimal 6 karakter)");
                  focusField("f-mut-nomor");
                  return;
                }
                if (!pemohon.trim() || pemohon.length < 3) {
                  toast.error("Nama pemohon wajib diisi (minimal 3 karakter)");
                  focusField("f-mut-pemohon");
                  return;
                }
                if (!nikPemohon.trim() || nikPemohon.length !== 16) {
                  toast.error("NIK pemohon wajib diisi (16 digit)");
                  focusField("f-mut-nik");
                  return;
                }
                if (!namaKades.trim() || namaKades.length < 3) {
                  toast.error("Nama kepala desa wajib diisi (minimal 3 karakter)");
                  focusField("f-mut-kades");
                  return;
                }
                setStep(2);
              } else if (step === 2) {
                // Validate objects
                for (let i = 0; i < newDataList.length; i++) {
                  const item = newDataList[i];
                  const label = `Objek #${i + 1}`;
                  if (!item.nop.trim() || item.nop.replace(/\D/g, "").length !== 18) {
                    toast.error(`${label}: NOP wajib diisi (18 digit)`);
                    focusField(`f-mut-nop-${i}`);
                    return;
                  }
                  if (!item.namaWp.trim() || item.namaWp.length < 3) {
                    toast.error(`${label}: Nama wajib pajak wajib diisi`);
                    focusField(`f-mut-nama-${i}`);
                    return;
                  }
                  if (!item.alamat.trim() || item.alamat.length < 5) {
                    toast.error(`${label}: Alamat wajib diisi`);
                    focusField(`f-mut-alamat-${i}`);
                    return;
                  }
                  if (item.luasTanah <= 0) {
                    toast.error(`${label}: Luas tanah harus lebih dari 0`);
                    focusField(`f-mut-luas-t-${i}`);
                    return;
                  }
                  if (item.luasBangunan > item.luasTanah) {
                    toast.error(`${label}: Luas bangunan tidak boleh melebihi luas tanah`);
                    focusField(`f-mut-luas-b-${i}`);
                    return;
                  }
                }

                if (!luasSebenarnya.trim()) {
                  toast.error("Luas sebenarnya wajib diisi");
                  focusField("f-mut-luas-seb");
                  return;
                }
                if (!sisa.trim()) {
                  toast.error("Status sisa tanah wajib diisi");
                  focusField("f-mut-sisa");
                  return;
                }

                const totalLuas = newDataList.reduce((acc, curr) => acc + Number(curr.luasTanah || 0), 0);
                if (totalLuas > oldData.luasTanah) {
                  toast.error(`Total luas tanah baru (${totalLuas} m²) melebihi luas asal (${oldData.luasTanah} m²)`);
                  focusField("f-mut-luas-t-0");
                  return;
                }

                setStep(3);
              } else {
                handlePrint();
              }
            }}
            className={cn(
              "flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-3 shadow-lg transition-all active:scale-[0.98]",
              step === 3 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                : isDark
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                  : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
            )}
          >
            {step === 3 ? (
              <>
                <Printer className="w-5 h-5 shrink-0" /> 
                <span>Cetak Permohonan</span>
              </>
            ) : (
              <>
                <span>{step === 1 ? "Lanjut Ke Objek Baru" : "Lihat Hasil Preview"}</span>
                <ChevronRight className="w-5 h-5 shrink-0" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
