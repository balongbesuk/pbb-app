"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Printer, FileText, User, ChevronRight, ChevronLeft, Check, History, Eye, Loader2, AlertCircle, ShieldAlert } from "lucide-react";
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

const MAX_TEXT_LENGTH = 120;

const sanitizeText = (value: string, maxLength = MAX_TEXT_LENGTH) =>
  value
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, maxLength);

const sanitizeUpperText = (value: string, maxLength = MAX_TEXT_LENGTH) =>
  sanitizeText(value, maxLength).toUpperCase();

const sanitizeNopInput = (value: string) =>
  value.replace(/[^0-9.-]/g, "").slice(0, 24);

const sanitizeNumberString = (value: string, maxLength: number) =>
  value.replace(/\D/g, "").slice(0, maxLength);

const sanitizeNomorSurat = (value: string) =>
  value
    .replace(/[^A-Za-z0-9\s./-]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, 80);

const letterDocumentStyles = `
  @page {
    size: 215mm 330mm;
    margin: 14mm;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    padding: 20px;
    background: #f3f4f6;
    color: #000;
    font-family: "Times New Roman", Times, serif;
  }

  p { margin: 0; }

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
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    font-size: 12pt;
    line-height: 1.35;
  }

  .letter-header-grid {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }

  .letter-header-grid td { vertical-align: top; }
  .letter-left-head { width: 55%; padding-right: 28px; }
  .letter-right-head { width: 45%; }
  
  .letter-indent { text-indent: 40px; }
  .letter-label-indent { padding-left: 54px; }
  .letter-city-indent { padding-left: 32px; letter-spacing: 2px; }

  .letter-section-title { margin-top: 18px; font-weight: 700; text-transform: uppercase; }
  .letter-table-wrap { padding-left: 24px; }

  .letter-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
  }

  .letter-table td { padding: 2px 0; vertical-align: top; }
  .letter-table td:first-child { width: 185px; }
  .letter-table td:nth-child(2) { width: 14px; }

  .letter-block-gap { margin-top: 16px; }
  .letter-big-gap { margin-top: 28px; }
  
  .letter-list { margin: 6px 0 0; padding-left: 22px; }
  .letter-list li { margin-bottom: 4px; }
  .letter-list-disc { margin: 4px 0 0; padding-left: 22px; list-style: disc; }

  .letter-signature { margin-top: 42px; padding-right: 48px; text-align: right; }
  .letter-sign-space { height: 84px; }

  .letter-kop {
    border-bottom: 3px double #000;
    margin-bottom: 28px;
    padding-bottom: 8px;
  }

  .letter-kop-flex { display: flex; align-items: center; gap: 18px; }
  .letter-kop-logo { width: 78px; height: auto; object-fit: contain; flex-shrink: 0; }
  .letter-kop-text { flex: 1; text-align: center; }
  .letter-kop-address { font-size: 9pt; font-style: italic; }

  .letter-center { text-align: center; }
  .letter-info-grid { padding-left: 40px; margin-top: 10px; }
  .letter-info-row { display: flex; margin-top: 2px; }
  .letter-info-key { width: 128px; flex-shrink: 0; }

  .font-bold { font-weight: 700; }
  .underline { text-decoration: underline; }
  .italic { font-style: italic; }
  .uppercase { text-transform: uppercase; }
  .font-mono { font-family: "Courier New", Courier, monospace; }

  @media print {
    body { background: #fff; padding: 0; }
    .letter-stack { gap: 0; }
    .letter-page { border: none; box-shadow: none; margin: 0; page-break-after: always; }
    .letter-page:last-child { page-break-after: auto; }
  }
`;

export function SpptMutationDialog({
  open,
  onOpenChange,
  oldData,
  isDark = false,
  villageName = "BALONGBESUK",
  districtName = "DIWEK",
  regencyName = "JOMBANG",
}: SpptMutationDialogProps) {
  const [step, setStep] = useState(1);
  const [dasar, setDasar] = useState<"JUAL_BELI" | "HIBAH" | "WARIS">("JUAL_BELI");
  const [pemohon, setPemohon] = useState("");
  const [newDataList, setNewDataList] = useState<SpptData[]>([{ ...oldData }]);
  const [luasSebenarnya, setLuasSebenarnya] = useState<string>("");
  const [sisa, setSisa] = useState<string>("HABIS");
  const [nikPemohon, setNikPemohon] = useState("");
  const [nomorSurat, setNomorSurat] = useState("");
  const [namaKades, setNamaKades] = useState("");
  const [vName, setVName] = useState(villageName);
  const [dName, setDName] = useState(districtName);
  const [rName, setRName] = useState(regencyName);
  const [vAddress, setVAddress] = useState("");
  const [vEmail, setVEmail] = useState("");
  const [vZip, setVZip] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [showAreaWarning, setShowAreaWarning] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setPreviewHtml("");
      
      // Auto-detect village config
      fetch("/api/village-config")
        .then(res => res.json())
        .then(data => {
          if (data.namaKades) setNamaKades(data.namaKades);
          if (data.namaDesa) setVName(data.namaDesa);
          if (data.kecamatan) setDName(data.kecamatan);
          if (data.kabupaten) setRName(data.kabupaten);
          if (data.alamatKantor) setVAddress(data.alamatKantor);
          if (data.email) setVEmail(data.email);
          if (data.kodePos) setVZip(data.kodePos);
        })
        .catch(err => console.error("Gagal load config desa:", err));
    }
  }, [open]);

  const totalLuasTanahBaru = useMemo(() => 
    newDataList.reduce((acc, curr) => acc + Number(curr.luasTanah || 0), 0)
  , [newDataList]);

  useEffect(() => {
    const sisaValue = oldData.luasTanah - totalLuasTanahBaru;
    const finalSisa = sisaValue <= 0 ? 0 : sisaValue;
    setLuasSebenarnya(finalSisa.toString());
    setSisa(finalSisa > 0 ? "MASIH SISA" : "HABIS");
  }, [totalLuasTanahBaru, oldData.luasTanah]);

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

  const styles = useMemo(() => ({
    panel: isDark ? "bg-[#111827] border-white/5 text-white" : "bg-slate-100 border-slate-200 text-slate-900",
    input: isDark ? "bg-[#030712] border-white/10 text-white focus:bg-[#030712]" : "bg-white border-slate-200 text-slate-900 focus:bg-slate-50",
    buttonSelected: isDark ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/20" : "bg-primary border-primary text-white shadow-lg shadow-primary/10",
    buttonUnselected: isDark ? "border-transparent bg-[#1f2937] text-white/40 hover:bg-[#374151]" : "border-transparent bg-slate-200 text-slate-400 hover:bg-slate-300",
    stepCircle: {
      active: "bg-primary text-white shadow-lg shadow-primary/30 scale-110",
      completed: "bg-emerald-500 text-white",
      pending: isDark ? "bg-white/10 text-white/30" : "bg-slate-200 text-slate-400"
    }
  }), [isDark]);

  const generatePreviewHtml = () => {
    setIsGenerating(true);
    const dateStr = formatDateNoTime(new Date().toISOString());
    const logoSrc = `/uploads/logo-desa.png`;
    const year = new Date().getFullYear();

    const html = `
      <div class="letter-stack">
        <!-- PAGE 1: SURAT PERMOHONAN (BERKAS BAPENDA STYLE) -->
        <div class="letter-page">
          <table class="letter-header-grid">
            <tbody>
              <tr>
                <td class="letter-left-head">
                  <p>Perihal : Perubahan Mutasi/Pemecahan</p>
                  <p class="letter-label-indent">Objek/Subjek PBB Tahun ${year}</p>
                </td>
                <td class="letter-right-head">
                   <p>Kepada Yth.</p>
                   <p class="font-bold">Kepala Badan Pendapatan Daerah</p>
                   <p class="font-bold">Kabupaten ${rName}</p>
                   <p>di -</p>
                   <p class="font-bold letter-city-indent">${rName.split("").join(" ")}</p>
                </td>
              </tr>
            </tbody>
          </table>

          <p class="letter-indent" style="line-height: 1.6;">
            Sehubungan dengan terjadinya: <span class="font-bold underline italic capitalize">${dasar.replace("_", " ")}</span> ... <span class="font-bold underline italic uppercase">${oldData.namaWp}</span> ... *), 
            kami mohon untuk diadakan perubahan data Objek/Subjek PBB sebagai berikut:
          </p>

          <p class="letter-section-title">Lama:</p>
          <div class="letter-table-wrap">
            <table class="letter-table">
              <tbody>
                <tr><td>1. NOP SPPT</td><td>:</td><td class="font-mono">${oldData.nop}</td></tr>
                <tr><td>Nama Wajib Pajak</td><td>:</td><td class="uppercase font-bold">${oldData.namaWp}</td></tr>
                <tr><td>Alamat</td><td>:</td><td class="uppercase">${oldData.alamat}</td></tr>
                <tr><td>Luas Tanah</td><td>:</td><td class="font-bold">${oldData.luasTanah} m²</td></tr>
                <tr><td>Luas Bangunan</td><td>:</td><td class="font-bold">${oldData.luasBangunan} m²</td></tr>
              </tbody>
            </table>
          </div>

          <p class="letter-section-title">Baru:</p>
          ${newDataList.map((item, idx) => `
            <div class="letter-table-wrap ${idx > 0 ? "letter-block-gap" : ""}">
              <table class="letter-table">
                <tbody>
                  <tr><td>${idx + 1}. NOP SPPT</td><td>:</td><td class="font-mono">${item.nop}</td></tr>
                  <tr><td>Nama Wajib Pajak</td><td>:</td><td class="uppercase font-bold">${item.namaWp || "................"}</td></tr>
                  <tr><td>Alamat</td><td>:</td><td class="uppercase">${item.alamat || "................"}</td></tr>
                  <tr><td>Luas Tanah</td><td>:</td><td class="font-bold">${item.luasTanah ?? "...."} m²</td></tr>
                  <tr><td>Luas Bangunan</td><td>:</td><td class="font-bold">${item.luasBangunan ?? "...."} m²</td></tr>
                </tbody>
              </table>
            </div>
          `).join("")}

          <p class="letter-big-gap font-bold">
            Luas Tanah dan Bangunan sebenarnya saat ini: <span class="px-2">${luasSebenarnya || "........ m²"}</span>, dan saat ini sisa: <span class="underline uppercase">${sisa || "HABIS"}</span>.
          </p>

          <p class="letter-big-gap">Untuk kelengkapan dan proses lebih lanjut, bersama ini kami sertakan:</p>
          <ol class="letter-list">
            <li>Fotocopy KTP / Kartu Keluarga / Identitas lainnya *)</li>
            <li>SPPT dan Tanda Bukti Pembayaran (STTS) PBB tahun terakhir</li>
            <li>Tidak mempunyai tunggakan PBB 5 tahun terakhir (dikeluarkan oleh Dinas)</li>
            <li>SPOP dan LSPOP yang telah diisi dan ditandatangani</li>
            <li>Fotocopy salah satu surat tanah dan bangunan, antara lain:
              <ul class="letter-list-disc">
                <li>Sertifikat tanah</li>
                <li>Akta Jual Beli</li>
                <li>Akta Waris</li>
                <li>Izin Mendirikan Bangunan (IMB)</li>
              </ul>
            </li>
            <li>Alas hak tanah / Akta Jual Beli / Surat Hibah / Surat Waris / Surat Tanah *)</li>
            <li>KTP dan KK pihak-pihak terkait *)</li>
          </ol>

          <div class="letter-signature">
            <p>${vName}, ${dateStr}</p>
            <p class="letter-block-gap">Hormat kami,</p>
            <div class="letter-sign-space"></div>
            <p class="font-bold underline uppercase">${pemohon || "................"}</p>
          </div>
        </div>

        <!-- PAGE 2: SURAT KETERANGAN DESA (OFFICIAL VILLAGE STYLE) -->
        <div class="letter-page">
          <div class="letter-kop">
            <div class="letter-kop-flex">
              <img src="${logoSrc}" class="letter-kop-logo" />
              <div class="letter-kop-text">
                <p class="font-bold uppercase">PEMERINTAH KABUPATEN ${rName}</p>
                <p class="font-bold uppercase">KECAMATAN ${dName}</p>
                <p class="font-bold" style="font-size: 14pt; letter-spacing: 1px;">KANTOR DESA ${vName}</p>
                <p class="letter-kop-address">${vAddress}</p>
                <p class="letter-kop-address">E-mail: ${vEmail || `desa${vName.toLowerCase()}@gmail.com`} | Kode Pos: ${vZip || "61471"}</p>
              </div>
            </div>
          </div>
          
          <div class="letter-center" style="margin-bottom: 30px;">
            <p class="font-bold underline uppercase" style="font-size: 16pt; letter-spacing: 2px;">SURAT KETERANGAN</p>
            <p>Nomor : ${nomorSurat || ".... / .... / .... / ...."}</p>
          </div>

          <p class="letter-indent">
            Yang bertanda tangan di bawah ini, kami Kepala Desa ${vName}, Kecamatan ${dName}, Kabupaten ${rName}, menerangkan dengan sebenarnya bahwa:
          </p>

          <div class="letter-info-grid">
            <div class="letter-info-row"><span class="letter-info-key">Nama</span><span>: <span class="font-bold uppercase">${pemohon || ".........."}</span></span></div>
            <div class="letter-info-row"><span class="letter-info-key">NIK</span><span>: ${nikPemohon || ".........."}</span></div>
          </div>

          <p class="letter-block-gap">Mengajukan Perubahan SPPT PBB (Pemecahan) sebagai berikut:</p>
          
          <p class="letter-section-title">Lama:</p>
          <div class="letter-table-wrap">
            <table class="letter-table">
              <tbody>
                <tr><td>1. NOP SPPT</td><td>:</td><td class="font-mono">${oldData.nop}</td></tr>
                <tr><td>Nama Wajib Pajak</td><td>:</td><td class="uppercase font-bold">${oldData.namaWp}</td></tr>
                <tr><td>Alamat</td><td>:</td><td class="uppercase">${oldData.alamat}</td></tr>
                <tr><td>Luas Tanah</td><td>:</td><td class="font-bold">${oldData.luasTanah} m²</td></tr>
                <tr><td>Luas Bangunan</td><td>:</td><td class="font-bold">${oldData.luasBangunan} m²</td></tr>
              </tbody>
            </table>
          </div>

          <p class="letter-section-title">Baru:</p>
          ${newDataList.map((item, idx) => `
            <div class="letter-table-wrap ${idx > 0 ? "letter-block-gap" : ""}">
              <table class="letter-table">
                <tbody>
                  <tr><td>${idx + 1}. NOP SPPT</td><td>:</td><td class="font-mono">${item.nop || "-"}</td></tr>
                  <tr><td>Nama Wajib Pajak</td><td>:</td><td class="uppercase font-bold">${item.namaWp || "................"}</td></tr>
                  <tr><td>Alamat</td><td>:</td><td class="uppercase">${item.alamat || "................"}</td></tr>
                  <tr><td>Luas Tanah</td><td>:</td><td class="font-bold">${item.luasTanah ?? "...."} m²</td></tr>
                  <tr><td>Luas Bangunan</td><td>:</td><td class="font-bold">${item.luasBangunan ?? "...."} m²</td></tr>
                </tbody>
              </table>
            </div>
          `).join("")}

          <p class="letter-big-gap">
            Demikian Surat Keterangan ini kami buat dengan sebenarnya untuk dapat dipergunakan sebagai dasar penetapan PBB bagi yang bersangkutan sesuai keadaan saat ini.
          </p>

          <div class="letter-signature">
            <p>${vName}, ${dateStr}</p>
            <p class="letter-block-gap">Kepala Desa ${vName}</p>
            <div class="letter-sign-space"></div>
            <p class="font-bold underline">${namaKades || "................"}</p>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      setPreviewHtml(html);
      setIsGenerating(false);
    }, 600);
  };

  const validateAndProceed = () => {
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
      if (!nomorSurat.trim() || nomorSurat.length < 5) return toast.error("Nomor surat wajib diisi"), focusField("f-mut-nomor");
      if (!pemohon.trim() || pemohon.length < 3) return toast.error("Nama pemohon wajib diisi"), focusField("f-mut-pemohon");
      if (!nikPemohon.trim() || nikPemohon.replace(/\D/g, "").length !== 16) return toast.error("NIK pemohon wajib diisi (16 digit)"), focusField("f-mut-nik");
      if (!namaKades.trim() || namaKades.length < 3) return toast.error("Nama kepala desa wajib diisi"), focusField("f-mut-kades");
      setStep(2);
    } else if (step === 2) {
      for (let i = 0; i < newDataList.length; i++) {
        const item = newDataList[i];
        const trimmedNop = item.nop.trim();
        const cleanNop = trimmedNop.replace(/\D/g, "");
        const isPlaceholder = trimmedNop === "" || trimmedNop === "-" || trimmedNop === "0";
        if (!isPlaceholder && cleanNop.length !== 18) return toast.error(`NOP Objek #${i+1} harus 18 digit atau isi '-' jika belum ada`), focusField(`f-mut-nop-${i}`);
        if (!item.namaWp.trim()) return toast.error(`Nama WP Objek #${i+1} wajib diisi`), focusField(`f-mut-nama-${i}`);
        if (!item.alamat.trim()) return toast.error(`Alamat Objek #${i+1} wajib diisi`), focusField(`f-mut-alamat-${i}`);
        if (item.luasTanah <= 0) return toast.error(`Luas tanah Objek #${i+1} harus lebih dari 0`), focusField(`f-mut-luas-t-${i}`);
      }
      
      if (!luasSebenarnya.trim()) return toast.error("Luas sebenarnya wajib diisi"), focusField("f-mut-luas-seb");

      // Cek apakah luas baru melebihi luas asal
      if (totalLuasTanahBaru > oldData.luasTanah) {
        setShowAreaWarning(true);
        return;
      }
      
      generatePreviewHtml();
      setStep(3);
    }
  };

  const handleConfirmAreaOver = () => {
    setShowAreaWarning(false);
    generatePreviewHtml();
    setStep(3);
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const logoSrc = `${window.location.origin}/uploads/logo-desa.png`;
    win.document.write(`
      <html>
        <head>
          <title>Cetak Mutasi PBB - ${pemohon}</title>
          <style>${letterDocumentStyles}</style>
        </head>
        <body onload="window.print(); window.close();">
          ${previewHtml.replaceAll("/uploads/logo-desa.png", logoSrc)}
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "max-w-4xl w-[95vw] lg:w-[1100px] lg:max-w-[1100px] h-[92vh] overflow-hidden flex flex-col p-0 border-none sm:rounded-3xl shadow-2xl !opacity-100",
          isDark ? "dark text-white" : "text-slate-900"
        )}
      >
        <div 
          className="absolute inset-0 -z-50 !opacity-100" 
          style={{ 
            backgroundColor: isDark ? '#050B14' : '#ffffff',
            opacity: 1, 
          }} 
        />
        <DialogHeader className={cn("p-4 sm:p-6 pb-2 border-b", isDark ? "border-white/5 bg-[#0D1F3D]" : "border-slate-100")}>
          <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-primary/10 rounded-2xl group shadow-inner">
                <FileText className="w-6 h-6 text-primary transition-transform group-hover:scale-110" />
             </div>
             <div>
               <DialogTitle className="text-xl font-black uppercase tracking-tight">Mutasi / Pemecahan PBB</DialogTitle>
               <DialogDescription className={isDark ? "text-blue-100/60" : "text-slate-500"}>Formulir standar BAPENDA untuk permohonan pemecahan.</DialogDescription>
             </div>
          </div>
          <div className={cn("flex items-center justify-between px-4 py-4 rounded-3xl", isDark ? "bg-[#030712] border border-white/5" : "bg-slate-100")}>
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black transition-all duration-300", step === s ? styles.stepCircle.active : step > s ? styles.stepCircle.completed : styles.stepCircle.pending)}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                <span className={cn("text-[10px] font-black uppercase tracking-widest transition-all duration-300", step === s ? "text-primary scale-105" : "opacity-40", step !== s && "hidden sm:block")}>
                  {s === 1 ? "Identitas" : s === 2 ? "Data Baru" : "Preview Dokumen"}
                </span>
                {s < 3 && <ChevronRight className="w-4 h-4 opacity-10 mx-1" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
          {step === 1 && (
            <div className="space-y-8 animate-in mt-1 fade-in slide-in-from-right-4 duration-500">
               <div className="space-y-4">
                  <Label className="text-[11px] font-black uppercase tracking-widest opacity-60">Dasar Pengajuan Perubahan</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {["JUAL_BELI", "HIBAH", "WARIS"].map((id) => (
                      <button key={id} onClick={() => setDasar(id as any)} className={cn("p-4 rounded-3xl border-2 transition-all active:scale-[0.98] font-black uppercase tracking-widest text-xs", dasar === id ? styles.buttonSelected : styles.buttonUnselected)}>
                        {id.replace("_", " ")}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3"><History className="w-4 h-4 text-primary" /><Label className="text-[11px] font-black uppercase tracking-widest opacity-60">Status Objek Lama</Label></div>
                    <div 
                      className={cn("grid grid-cols-1 gap-5 p-6 rounded-3xl border transition-all", isDark ? "border-white/10 text-white" : "border-slate-200 text-slate-900")}
                      style={{ backgroundColor: isDark ? '#0F172A' : '#f8fafc' }}
                    >
                      <div className="space-y-1"><p className="text-[10px] font-black uppercase opacity-40">NOP</p><p className="font-mono text-base font-bold">{oldData.nop}</p></div>
                      <div className="space-y-1"><p className="text-[10px] font-black uppercase opacity-40">Wajib Pajak</p><p className="font-black text-sm uppercase">{oldData.namaWp}</p></div>
                      <div className="space-y-1"><p className="text-[10px] font-black uppercase opacity-40">Alamat</p><p className="font-bold text-xs uppercase leading-relaxed">{oldData.alamat}</p></div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-white/10 mt-1">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase opacity-50">Luas Tanah</p>
                          <p className="font-black text-blue-600 dark:text-blue-400 text-base leading-none">{oldData.luasTanah} m²</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase opacity-50">Luas Bangunan</p>
                          <p className="font-black text-emerald-600 dark:text-emerald-400 text-base leading-none">{oldData.luasBangunan} m²</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2"><Label className="text-[11px] font-black uppercase opacity-60 px-1">No. Surat Keterangan</Label><Input id="f-mut-nomor" className={cn("h-12 rounded-2xl font-black uppercase", styles.input)} value={nomorSurat} onChange={(e) => setNomorSurat(sanitizeNomorSurat(e.target.value.toUpperCase()).slice(0, 40))} /></div>
                      <div className="space-y-2"><Label className="text-[11px] font-black uppercase opacity-60 px-1">Nama Pemohon</Label><Input id="f-mut-pemohon" className={cn("h-12 rounded-2xl font-black uppercase", styles.input)} value={pemohon} onChange={(e) => setPemohon(sanitizeText(e.target.value.toUpperCase(), 30))} /></div>
                      <div className="space-y-2"><Label className="text-[11px] font-black uppercase opacity-60 px-1">NIK Pemohon</Label><Input id="f-mut-nik" className={cn("h-12 rounded-2xl font-mono tracking-widest", styles.input)} value={nikPemohon} onChange={(e) => setNikPemohon(sanitizeNumberString(e.target.value, 16))} /></div>
                      <div className="space-y-2"><Label className="text-[11px] font-black uppercase opacity-60 px-1">Nama Kepala Desa</Label><Input id="f-mut-kades" className={cn("h-12 rounded-2xl font-black", styles.input)} value={namaKades} onChange={(e) => setNamaKades(sanitizeText(e.target.value, 40))} /></div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="flex items-center justify-between"><Label className="text-[11px] font-black uppercase tracking-widest opacity-60 px-1">Detail Objek Baru</Label><Button onClick={handleAddData} className="h-10 rounded-xl px-4 bg-primary/10 text-primary border border-primary/20 font-black uppercase text-[10px] active:scale-95 transition-all"><Plus className="w-3 h-3 mr-2" /> Tambah Objek Baru</Button></div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {newDataList.map((item, index) => (
                  <div key={index} className={cn("relative p-6 rounded-[2rem] border-2 group transition-all shadow-sm", isDark ? "border-white/5 bg-[#0D1F3D]" : "border-slate-100 bg-slate-100")}>
                    <div className="absolute -top-3 left-6 px-4 py-1 bg-primary rounded-full shadow-lg"><span className="text-[10px] font-black text-white uppercase tracking-widest">Objek Baru #${index + 1}</span></div>
                    {newDataList.length > 1 && <Button onClick={() => handleRemoveData(index)} className="absolute -top-3 right-6 h-8 w-8 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-lg transition-all active:scale-90"><Trash2 className="h-4 w-4" /></Button>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-40 px-1">NOP Baru</Label><Input id={`f-mut-nop-${index}`} value={item.nop} onChange={(e) => handleUpdateNewData(index, "nop", sanitizeNopInput(e.target.value))} className={cn("h-11 rounded-xl font-mono text-sm", styles.input)} /></div>
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-40 px-1">Nama Wajib Pajak</Label><Input id={`f-mut-nama-${index}`} value={item.namaWp} onChange={(e) => handleUpdateNewData(index, "namaWp", sanitizeText(e.target.value.toUpperCase(), 30))} className={cn("h-11 rounded-xl font-black text-sm uppercase", styles.input)} /></div>
                      <div className="sm:col-span-2 space-y-1"><Label className="text-[10px] font-black uppercase opacity-40 px-1">Alamat</Label><Input id={`f-mut-alamat-${index}`} value={item.alamat} onChange={(e) => handleUpdateNewData(index, "alamat", sanitizeText(e.target.value.toUpperCase(), 100))} className={cn("h-11 rounded-xl font-bold text-xs uppercase", styles.input)} /></div>
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-40 px-1">Luas Tanah</Label><Input type="number" value={item.luasTanah} onChange={(e) => handleUpdateNewData(index, "luasTanah", Number(e.target.value))} className={cn("h-11 rounded-xl font-black text-primary", styles.input)} /></div>
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-40 px-1">Luas Bangunan</Label><Input type="number" value={item.luasBangunan} onChange={(e) => handleUpdateNewData(index, "luasBangunan", Number(e.target.value))} className={cn("h-11 rounded-xl font-black text-emerald-500", styles.input)} /></div>
                    </div>
                  </div>
                ))}
              </div>
               <div className={cn("p-6 rounded-[2rem] border-2 border-dashed grid grid-cols-1 lg:grid-cols-3 gap-8", isDark ? "border-white/10" : "border-slate-300 dark:border-white/10")}>
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="space-y-2"><Label className="text-[11px] font-black uppercase opacity-60">SISA LUAS TANAH :</Label><Input id="f-mut-luas-seb" placeholder="CONTOH: 540" value={luasSebenarnya} onChange={(e) => setLuasSebenarnya(sanitizeText(e.target.value.toUpperCase(), 20))} className={cn("h-12 rounded-2xl font-bold", styles.input)} /></div>
                     <div className="space-y-2"><Label className="text-[11px] font-black uppercase opacity-60">Status Sisa Tanah</Label><Input id="f-mut-sisa" placeholder="HABIS / MASIH SISA" value={sisa} onChange={(e) => setSisa(sanitizeText(e.target.value.toUpperCase(), 30))} className={cn("h-12 rounded-2xl font-bold", styles.input)} /></div>
                  </div>
                  <div className={cn("p-6 rounded-3xl flex flex-col justify-center gap-2", totalLuasTanahBaru > oldData.luasTanah ? "bg-rose-500/10 border border-rose-500/20" : isDark ? "bg-primary/10 shadow-lg shadow-primary/5" : "bg-primary/5")}>
                    <p className="text-[10px] font-black uppercase opacity-40">Validasi Total Luas</p>
                    <p className={cn("text-2xl font-black", totalLuasTanahBaru > oldData.luasTanah ? "text-rose-500" : "text-primary")}>{totalLuasTanahBaru} m²</p>
                    <p className="text-[10px] font-black opacity-40 mt-1">Sisa Alokasi: {oldData.luasTanah - totalLuasTanahBaru} m²</p>
                  </div>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
               <div className={cn("p-5 rounded-[2rem] border flex items-center justify-between shadow-sm", isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200")}>
                  <div className="flex items-center gap-4">
                    <Check className="w-8 h-8 text-emerald-500" />
                    <div>
                      <p className="text-sm font-black uppercase tracking-widest text-emerald-600">Dokumen BAPENDA Tergenerate</p>
                      <p className="text-xs opacity-70">Gunakan tombol cetak di bawah untuk mencetak 2 dokumen (Permohonan & Keterangan).</p>
                    </div>
                  </div>
               </div>
               
               <div className="rounded-[2.5rem] overflow-hidden border-2 border-primary/20 bg-slate-200 dark:bg-black/40 shadow-inner group relative">
                  {isGenerating ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                       <Loader2 className="w-10 h-10 animate-spin text-primary" />
                       <p className="text-sm font-black uppercase tracking-widest opacity-40">Menyusun Dokumen Sesuai Format BAPENDA...</p>
                    </div>
                  ) : (
                    <iframe 
                      title="Preview Mutasi PBB"
                      srcDoc={`<html><head><style>${letterDocumentStyles}</style></head><body>${previewHtml}</body></html>`}
                      className="w-full h-[65vh] bg-white"
                    />
                  )}
                  {!isGenerating && <div className="absolute top-4 right-4 p-2 bg-emerald-500 text-white rounded-full shadow-lg opacity-80 animate-pulse sm:hidden"><Printer className="w-4 h-4" /></div>}
               </div>

               <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] opacity-60 leading-relaxed italic">Catatan: Format dokumen di atas mengikuti standar pengajuan mutasi SPPT PBB Kabupaten Jombang. Pastikan printer Anda menggunakan ukuran kertas Folio/F4 atau A4 dengan margin yang sesuai.</p>
               </div>
            </div>
          )}
        </div>

        <div className={cn("border-t px-4 py-5 sm:px-10 sm:py-6", isDark ? "border-white/10 bg-[#0D1F3D]" : "border-slate-100 bg-white")}>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep((prev) => prev - 1)} className={cn("h-14 flex-1 sm:flex-initial sm:min-w-40 px-3 font-black uppercase tracking-widest text-xs sm:text-[10px] transition-all active:scale-95 rounded-2xl", isDark ? "border-white/10 bg-white/5 text-white/60 hover:text-white" : "border-slate-200 bg-white text-slate-500")}>
                <ChevronLeft className="mr-1 sm:mr-2 h-4 w-4" /> 
                <span className="hidden sm:inline">Kembali ke Data {step === 2 ? "Identitas" : "Objek Baru"}</span>
                <span className="sm:hidden">Kembali</span>
              </Button>
            )}
            <div className={cn("flex flex-1 items-center gap-3 sm:justify-end", step === 1 ? "justify-center" : "")}>
              {step < 3 ? (
                <Button onClick={validateAndProceed} className={cn("h-14 w-full sm:w-auto sm:min-w-56 px-4 font-black uppercase tracking-widest text-xs sm:text-[10px] shadow-lg transition-all active:scale-[0.98] rounded-2xl", isDark ? "bg-blue-600/20 border-2 border-blue-500 text-blue-400 shadow-blue-500/20" : "bg-primary text-white shadow-primary/20")}>
                  {step === 2 ? (
                    <>
                      <Eye className="mr-1 sm:mr-2 h-4 w-4" /> 
                      <span className="hidden sm:inline">Preview Dokumen BAPENDA</span>
                      <span className="sm:hidden">Preview</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Lanjut ke Data Objek</span>
                      <span className="sm:hidden">Lanjut</span>
                      <ChevronRight className="ml-1 sm:ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handlePrint} className="h-14 w-full sm:w-auto sm:min-w-80 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/40 active:scale-[0.98] transition-all rounded-2xl">
                  <Printer className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" /> 
                  <span className="hidden sm:inline">Cetak Berkas Mutasi (2 Halaman)</span>
                  <span className="sm:hidden">Cetak Berkas</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      <Dialog open={showAreaWarning} onOpenChange={setShowAreaWarning}>
        <DialogContent className={cn("rounded-[2rem] p-0 border-none max-w-md overflow-hidden shadow-2xl", isDark ? "bg-[#0A192F] text-white" : "bg-white")}>
          <div className="p-8 space-y-6 text-center">
            <div className="mx-auto w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-10 h-10 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight">Peringatan Luas Tanah!</h3>
              <p className="text-sm opacity-60 leading-relaxed font-medium capitalize">
                Total luas tanah baru (<span className="text-rose-500 font-bold">{totalLuasTanahBaru} m²</span>) melebihi luas di sistem (<span className="text-primary font-bold">{oldData.luasTanah} m²</span>). 
                <br/>Apakah Anda yakin ingin melanjutkan cetak berkas dengan data ini?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAreaWarning(false)}
                className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all"
              >
                Cek Ulang
              </Button>
              <Button 
                onClick={handleConfirmAreaOver}
                className="h-12 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
              >
                Ya, Lanjutkan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
