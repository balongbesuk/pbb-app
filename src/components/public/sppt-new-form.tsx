"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, FileText, ChevronRight, ChevronLeft, Check, Loader2, FilePlus2 } from "lucide-react";
import { cn, formatDateNoTime } from "@/lib/utils";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import DOMPurify from "dompurify";
import { generateNewSpptDocx } from "@/lib/new-sppt-docx-gen";
import { usePublicThemeContext } from "./public-theme-provider";

interface SpptNewFormProps {
  initialName?: string;
}

const MAX_TEXT_LENGTH = 120;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sanitizeText = (value: string, maxLength = MAX_TEXT_LENGTH) =>
  value
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, maxLength);

const sanitizeNumberString = (value: string, maxLength: number) =>
  value.replace(/[^0-9-]/g, "").slice(0, maxLength);

const sanitizeNomorSurat = (value: string) =>
  value
    .replace(/[^A-Za-z0-9\s./-]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, 30);

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

export function SpptNewForm({
  initialName = "",
}: SpptNewFormProps) {
  const { theme } = usePublicThemeContext();
  const searchParams = useSearchParams();
  const isDark = theme === "dark";
  
  const [step, setStep] = useState(1);
  const [pemohon, setPemohon] = useState(initialName || searchParams.get("nama") || "");
  const [nikPemohon, setNikPemohon] = useState("");
  const [telpPemohon, setTelpPemohon] = useState("");
  const [nomorSurat, setNomorSurat] = useState("");
  const [namaKades, setNamaKades] = useState("");
  
  // Objek Pajak Data
  const [objekNama, setObjekNama] = useState(initialName || searchParams.get("nama") || "");
  const [objekAlamat, setObjekAlamat] = useState(searchParams.get("alamat") || "");
  const [luasTanah, setLuasTanah] = useState<number>(0);
  const [luasBangunan, setLuasBangunan] = useState<number>(0);

  const [vName, setVName] = useState("BALONGBESUK");
  const [dName, setDName] = useState("DIWEK");
  const [rName, setRName] = useState("JOMBANG");
  const [vAddress, setVAddress] = useState("");
  const [vEmail, setVEmail] = useState("");
  const [vZip, setVZip] = useState("");
  const [vLogo, setVLogo] = useState<string | null>(null);
  const [vUpdatedAt, setVUpdatedAt] = useState<string | null>(null);
  
  const [previewHtml, setPreviewHtml] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingWord, setIsDownloadingWord] = useState(false);
  
  useEffect(() => {
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
        if (data.logoUrl) setVLogo(data.logoUrl);
        if (data.updatedAt) setVUpdatedAt(data.updatedAt);
      })
      .catch(err => console.error("Gagal load config desa:", err));
  }, []);

  const styles = useMemo(() => ({
    input: isDark ? "bg-[#030712] border-white/10 text-white focus:bg-[#030712]" : "bg-white border-slate-200 text-slate-900 focus:bg-slate-50",
    stepCircle: {
      active: "bg-primary text-white shadow-lg shadow-primary/30 scale-110",
      completed: "bg-emerald-500 text-white",
      pending: isDark ? "bg-white/10 text-white/30" : "bg-slate-200 text-slate-400"
    }
  }), [isDark]);

  const generatePreviewHtml = () => {
    setIsGenerating(true);
    const dateStr = formatDateNoTime(new Date().toISOString());
    const cacheBuster = vUpdatedAt ? `?v=${new Date(vUpdatedAt).getTime()}` : "";
    const logoSrc = vLogo ? `${vLogo}${cacheBuster}` : "/uploads/logo-desa.png";
    const year = new Date().getFullYear();

    const safeDateStr = escapeHtml(dateStr);
    const safeLogoSrc = escapeHtml(logoSrc);
    const safePemohon = escapeHtml(pemohon);
    const safeObjekAlamat = escapeHtml(objekAlamat);
    const safeTelpPemohon = escapeHtml(telpPemohon || "-");
    const safeNikPemohon = escapeHtml(nikPemohon || "-");
    const safeNomorSurat = escapeHtml(nomorSurat);
    const safeNamaKades = escapeHtml(namaKades);
    const safeObjekNama = escapeHtml(objekNama);
    const safeVName = escapeHtml(vName);
    const safeDName = escapeHtml(dName);
    const safeRName = escapeHtml(rName);
    const safeVAddress = escapeHtml(vAddress);
    const safePemohon = escapeHtml(pemohon);

    const html = `
      <div class="letter-stack">
        <!-- PAGE 1: SURAT PERMOHONAN -->
        <div class="letter-page">
          <table class="letter-header-grid">
            <tbody>
              <tr>
                <td class="letter-left-head">
                  <p>Lampiran : 1 (Satu) berkas</p>
                  <p>Perihal : Pengajuan data/Obyek Pajak Baru atas</p>
                  <p class="letter-label-indent">SPPT PBB Tahun ${year}</p>
                </td>
                <td class="letter-right-head">
                   <p>Kepada Yth.</p>
                   <p class="font-bold">Kepala Badan Pendapatan Daerah</p>
                   <p class="font-bold">Kabupaten ${safeRName}</p>
                   <p>di -</p>
                   <p class="font-bold letter-city-indent">${safeRName.split("").join(" ")}</p>
                </td>
              </tr>
            </tbody>
          </table>

          <p class="letter-block-gap">Yang bertanda tangan di bawah ini :</p>
          <div class="letter-table-wrap">
            <table class="letter-table">
              <tbody>
                <tr><td>Nama Wajib Pajak</td><td>:</td><td class="font-bold uppercase">${safePemohon}</td></tr>
                <tr><td>Alamat</td><td>:</td><td class="uppercase">${safeObjekAlamat}</td></tr>
                <tr><td>Nomor Telpon</td><td>:</td><td>${safeTelpPemohon}</td></tr>
              </tbody>
            </table>
          </div>

          <p class="letter-block-gap">Dengan ini mengajukan permohonan Data Baru atas Obyek Pajak :</p>
          <div class="letter-table-wrap">
            <table class="letter-table">
              <tbody>
                <tr><td>Nama Jalan</td><td>:</td><td class="uppercase">${objekAlamat}</td></tr>
                <tr><td>Kel/Desa</td><td>:</td><td class="uppercase">Desa ${vName},</td></tr>
                <tr><td>Kecamatan</td><td>:</td><td class="uppercase">${dName}</td></tr>
                <tr><td>Kabupaten</td><td>:</td><td class="uppercase">${rName}</td></tr>
              </tbody>
            </table>
          </div>

          <p class="letter-block-gap letter-indent" style="line-height: 1.6;">
            Karena sampai saat ini obyek pajak tersebut belum pernah dikenakan Pajak Bumi dan Bangunan (belum pernah diterbitkan SPPT PBB-nya)
          </p>

          <p class="letter-block-gap">Untuk kelengkapan dan proses lebih lanjut, bersama ini kami sertakan:</p>
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
            <li>Surat Keterangan Kepala Desa/Lurah</li>
          </ol>

          <p class="letter-block-gap">Demikian atas perhatiannya, kami sampaikan terima kasih.</p>

          <div class="letter-signature">
            <p>${safeRName}, ${dateStr}</p>
            <p class="letter-block-gap">Pemohon,</p>
            <div class="letter-sign-space"></div>
            <p class="font-bold underline uppercase">${safePemohon || "................"}</p>
          </div>
        </div>

        <!-- PAGE 2: SURAT KETERANGAN DESA -->
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

          <p>Yang bertanda tangan di bawah ini :</p>
          <div class="letter-table-wrap">
            <table class="letter-table">
              <tbody>
                <tr><td>Nama</td><td>:</td><td>${namaKades || "(diisi Nama Kepala Desa)"}</td></tr>
                <tr><td>Jabatan</td><td>:</td><td>Kepala Desa / Lurah ${vName}</td></tr>
              </tbody>
            </table>
          </div>

          <p class="letter-block-gap">Menerangkan dengan sebenarnya bahwa :</p>
          <div class="letter-table-wrap">
            <table class="letter-table">
              <tbody>
                <tr><td>Nama</td><td>:</td><td class="font-bold uppercase">${safePemohon}</td></tr>
                <tr><td>NIK</td><td>:</td><td>${safeNikPemohon}</td></tr>
                <tr><td>Telp</td><td>:</td><td>${safeTelpPemohon}</td></tr>
              </tbody>
            </table>
          </div>

          <p class="letter-block-gap">Mengajukan <b>penerbitan SPPT PBB baru</b> (belum pernah terbit SPPT sama sekali) dengan data sebagai berikut :</p>
          <div class="letter-table-wrap">
            <table class="letter-table">
              <tbody>
                <tr><td>NOP</td><td>:</td><td>: ..................................</td></tr>
                <tr><td>Nama</td><td>:</td><td class="font-bold uppercase">${objekNama}</td></tr>
                <tr><td>Alamat</td><td>:</td><td class="uppercase">${objekAlamat}</td></tr>
                <tr><td>Luas Tanah / Bangunan</td><td>:</td><td><span class="font-bold">${luasTanah}</span> m² / <span class="font-bold">${luasBangunan}</span> m²</td></tr>
              </tbody>
            </table>
          </div>

          <p class="letter-big-gap">
            Demikian surat ini dibuat, untuk dipergunakan sebagaimana mestinya.
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
    if (step === 1) {
      if (!nomorSurat.trim()) return toast.error("Nomor surat wajib diisi");
      if (!pemohon.trim()) return toast.error("Nama pemohon wajib diisi");
      
      const isNikPlaceholder = nikPemohon.trim() === "0" || nikPemohon.trim() === "-";
      if (!isNikPlaceholder && (!nikPemohon.trim() || nikPemohon.replace(/\D/g, "").length !== 16)) {
        return toast.error("NIK pemohon harus 16 digit atau isi '0' / '-' jika tidak ada");
      }
      
      if (!namaKades.trim()) return toast.error("Nama kepala desa wajib diisi");
      setStep(2);
    } else if (step === 2) {
      if (!objekNama.trim()) return toast.error("Nama WP Objek wajib diisi");
      if (!objekAlamat.trim()) return toast.error("Alamat Objek wajib diisi");
      if (luasTanah <= 0) return toast.error("Luas tanah harus lebih dari 0");
      
      generatePreviewHtml();
      setStep(3);
    }
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const cacheBuster = vUpdatedAt ? `?v=${new Date(vUpdatedAt).getTime()}` : "";
    const logoSrc = vLogo ? `${window.location.origin}${vLogo}${cacheBuster}` : `${window.location.origin}/uploads/logo-desa.png`;
    const safePemohon = escapeHtml(pemohon);
    const sanitizedPreviewHtml = DOMPurify.sanitize(
      previewHtml.replaceAll("/uploads/logo-desa.png", logoSrc)
    );
    win.document.write(`
      <html>
        <head>
          <title>Cetak Pengajuan SPPT Baru - ${safePemohon}</title>
          <style>${letterDocumentStyles}</style>
        </head>
        <body onload="window.print(); window.close();">
          ${sanitizedPreviewHtml}
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleDownloadWord = async () => {
    setIsDownloadingWord(true);
    try {
      await generateNewSpptDocx({
        pemohon,
        nikPemohon,
        telpPemohon,
        nomorSurat,
        namaKades,
        objekNama,
        objekAlamat,
        luasTanah,
        luasBangunan,
        villageName: vName,
        districtName: dName,
        regencyName: rName,
        villageAddress: vAddress,
        villageEmail: vEmail,
        villageZip: vZip,
        villageLogo: vLogo
      });
      toast.success("File Word berhasil diunduh.");
    } catch (error) {
      console.error("Gagal generate Word:", error);
      toast.error("Gagal mengunduh file Word.");
    } finally {
      setIsDownloadingWord(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className={cn("flex items-center justify-between px-6 py-5 rounded-[2rem]", isDark ? "bg-[#030712] border border-white/5" : "bg-slate-100")}>
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black transition-all duration-300", step === s ? styles.stepCircle.active : step > s ? styles.stepCircle.completed : styles.stepCircle.pending)}>
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            <span className={cn("text-[10px] font-black uppercase tracking-widest transition-all duration-300", step === s ? "text-primary scale-105" : "opacity-40", step !== s && "hidden sm:block")}>
              {s === 1 ? "Identitas" : s === 2 ? "Data Objek" : "Preview Dokumen"}
            </span>
            {s < 3 && <ChevronRight className="w-4 h-4 opacity-10 mx-1" />}
          </div>
        ))}
      </div>

      <div className="flex-1 space-y-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-[11px] font-black uppercase opacity-60 px-1">No. Surat Keterangan</Label><Input className={cn("h-12 rounded-2xl font-black uppercase", styles.input)} value={nomorSurat} onChange={(e) => setNomorSurat(sanitizeNomorSurat(e.target.value.toUpperCase()))} placeholder="CONTOH: 100/082/415.51.17/II/2026" maxLength={30} /></div>
                <div className="space-y-2"><Label className="text-[11px] font-black uppercase opacity-60 px-1">Nama Pemohon</Label><Input className={cn("h-12 rounded-2xl font-black uppercase", styles.input)} value={pemohon} onChange={(e) => setPemohon(sanitizeText(e.target.value.toUpperCase(), 30))} /></div>
                <div className="space-y-2"><Label className="text-[11px] font-black uppercase opacity-60 px-1">NIK Pemohon</Label><Input className={cn("h-12 rounded-2xl font-mono tracking-widest", styles.input)} value={nikPemohon} onChange={(e) => setNikPemohon(sanitizeNumberString(e.target.value, 16))} maxLength={16} /></div>
                <div className="space-y-2"><Label className="text-[11px] font-black uppercase opacity-60 px-1">No. Telp Pemohon</Label><Input className={cn("h-12 rounded-2xl font-mono tracking-widest", styles.input)} value={telpPemohon} onChange={(e) => setTelpPemohon(sanitizeNumberString(e.target.value, 15))} /></div>
                <div className="sm:col-span-2 space-y-2"><Label className="text-[11px] font-black uppercase opacity-60 px-1">Nama Kepala Desa</Label><Input className={cn("h-12 rounded-2xl font-black", styles.input)} value={namaKades} onChange={(e) => setNamaKades(sanitizeText(e.target.value, 40))} /></div>
             </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className={cn("p-8 rounded-[2rem] border-2 shadow-sm", isDark ? "border-white/5 bg-[#0D1F3D]" : "border-slate-100 bg-slate-100")}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2 space-y-2"><Label className="text-[11px] font-black uppercase opacity-60 px-1">Nama Wajib Pajak (Sesuai KTP/Sertifikat)</Label><Input value={objekNama} onChange={(e) => setObjekNama(sanitizeText(e.target.value.toUpperCase(), 30))} className={cn("h-12 rounded-2xl font-black uppercase", styles.input)} /></div>
                  <div className="sm:col-span-2 space-y-2"><Label className="text-[11px] font-black uppercase opacity-60 px-1">Alamat Objek (Jalan/Dusun/RT/RW)</Label><Input value={objekAlamat} onChange={(e) => setObjekAlamat(sanitizeText(e.target.value.toUpperCase(), 100))} className={cn("h-12 rounded-2xl font-bold", styles.input)} placeholder="MISAL: DUSUN BALONGBESUK, RT 004 RW 001" /></div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black uppercase opacity-60 px-1">Luas Tanah (m²)</Label>
                    <Input type="number" value={luasTanah} onChange={(e) => setLuasTanah(Number(e.target.value))} className={cn("h-12 rounded-2xl font-black text-primary text-lg", styles.input)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black uppercase opacity-60 px-1">Luas Bangunan (m²)</Label>
                    <Input type="number" value={luasBangunan} onChange={(e) => setLuasBangunan(Number(e.target.value))} className={cn("h-12 rounded-2xl font-black text-emerald-500 text-lg", styles.input)} />
                  </div>
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
                    <p className="text-sm font-black uppercase tracking-widest text-emerald-600">Berkas Pengajuan Tergenerate</p>
                    <p className="text-xs opacity-70">Dokumen sudah siap dicetak untuk proses pendaftaran ke BAPENDA.</p>
                  </div>
                </div>
             </div>
             
             <div className="rounded-[2.5rem] overflow-hidden border-2 border-primary/20 bg-slate-200 dark:bg-black/40 shadow-inner relative">
                {isGenerating ? (
                  <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                     <Loader2 className="w-10 h-10 animate-spin text-primary" />
                     <p className="text-sm font-black uppercase tracking-widest opacity-40">Menyusun Dokumen...</p>
                  </div>
                ) : (
                  <iframe 
                    title="Preview Pengajuan SPPT Baru"
                    srcDoc={`<html><head><style>${letterDocumentStyles}</style></head><body>${previewHtml}</body></html>`}
                    className="w-full h-[65vh] bg-white"
                  />
                )}
             </div>
          </div>
        )}
      </div>

      <div className={cn("mt-6 pt-6 border-t", isDark ? "border-white/5" : "border-slate-100")}>
        <div className="flex items-center gap-2">
          {step > 1 && (
            <Button 
              variant="outline" 
              onClick={() => setStep((prev) => prev - 1)} 
              className={cn(
                "h-12 w-12 sm:w-auto sm:min-w-32 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 flex-shrink-0 p-0 sm:px-4", 
                isDark ? "border-white/10 text-white/60 hover:bg-white/5" : "border-slate-200 text-slate-500 hover:bg-slate-50"
              )}
              title="Kembali"
            >
              <ChevronLeft className="h-5 w-5 sm:mr-1" />
              <span className="hidden sm:inline">Kembali</span>
            </Button>
          )}
          
          <div className="flex flex-1 items-center gap-2">
            {step < 3 ? (
              <Button 
                onClick={validateAndProceed} 
                className={cn(
                  "h-12 flex-1 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] shadow-lg transition-all active:scale-[0.98]", 
                  isDark ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20" : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                )}
              >
                {step === 2 ? "Preview Dokumen" : "Lanjut ke Data Objek"} <ChevronRight className="ml-1 sm:ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline"
                  disabled={isDownloadingWord}
                  onClick={handleDownloadWord} 
                  className={cn(
                    "h-12 flex-1 rounded-xl sm:rounded-2xl border-2 font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all active:scale-95 px-2",
                    isDark ? "border-blue-500/30 text-blue-400 hover:bg-blue-500/10" : "border-blue-200 text-blue-600 hover:bg-blue-50"
                  )}
                  title="Unduh Word"
                >
                  {isDownloadingWord ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="h-4 w-4 sm:mr-2" />} 
                  <span className="hidden sm:inline">Word</span>
                </Button>
                <Button 
                  onClick={handlePrint} 
                  className="h-12 flex-[2] rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[9px] sm:text-[11px] shadow-2xl shadow-emerald-500/40 active:scale-[0.98] transition-all px-2"
                >
                  <Printer className="h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" /> 
                  <span>Cetak <span className="hidden sm:inline">Berkas</span></span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
