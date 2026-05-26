"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, X, CreditCard, User, Check, Loader2, Award, Landmark, Calendar, MapPin, Receipt, Download } from "lucide-react";
import { formatCurrency, formatDateNoTime } from "@/lib/utils";
import { getVillageConfig } from "@/app/actions/settings-actions";
import { getCurrentUserSignature } from "@/app/actions/user-actions";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

// Terbilang Bahasa Indonesia Helper
function terbilang(angka: number): string {
  const bilne = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];

  if (angka < 12) {
    return bilne[angka];
  } else if (angka < 20) {
    return (terbilang(angka - 10) + " Belas").trim();
  } else if (angka < 100) {
    return (terbilang(Math.floor(angka / 10)) + " Puluh " + terbilang(angka % 10)).trim();
  } else if (angka < 200) {
    return ("Seratus " + terbilang(angka - 100)).trim();
  } else if (angka < 1000) {
    return (terbilang(Math.floor(angka / 100)) + " Ratus " + terbilang(angka % 100)).trim();
  } else if (angka < 2000) {
    return ("Seribu " + terbilang(angka - 1000)).trim();
  } else if (angka < 1000000) {
    return (terbilang(Math.floor(angka / 1000)) + " Ribu " + terbilang(angka % 1000)).trim();
  } else if (angka < 1000000000) {
    return (terbilang(Math.floor(angka / 1000000)) + " Juta " + terbilang(angka % 1000000)).trim();
  }
  return "";
}

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: number;
    nop: string;
    namaWp: string;
    alamat?: string;
    alamatObjek?: string;
    luasTanah: number;
    luasBangunan: number;
    tagihan?: number;
    ketetapan?: number;
    tahun: number;
    tanggalBayar: Date | string | null;
    dusun?: string | null;
    rt?: string | null;
    rw?: string | null;
    petugas?: { nama: string | null } | null;
    penarik?: { name: string | null } | null;
  } | null;
  adminFee?: number;
  publicMode?: boolean;
}

export function ReceiptDialog({ open, onOpenChange, item, adminFee: propAdminFee, publicMode = false }: ReceiptDialogProps) {
  const { data: session } = useSession();
  const [adminFee, setAdminFee] = useState<number>(2000);
  const [cashierName, setCashierName] = useState<string>("");
  const [cashierSignatureUrl, setCashierSignatureUrl] = useState<string | null>(null);
  const [villageConfig, setVillageConfig] = useState<any>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setIsLoadingConfig(true);
      getVillageConfig()
        .then((cfg) => {
          setVillageConfig(cfg);
          if (publicMode) {
            if (cfg?.adminFee !== undefined) {
              setAdminFee(cfg.adminFee);
            }
          } else {
            if (propAdminFee === undefined && cfg?.adminFee !== undefined) {
              setAdminFee(cfg.adminFee);
            }
          }
        })
        .finally(() => {
          setIsLoadingConfig(false);
        });

      if (!publicMode && session?.user?.id) {
        setCashierName(session.user.name || "");
        getCurrentUserSignature(session.user.id).then((url) => {
          setCashierSignatureUrl(url);
        });
      } else {
        setCashierName("");
        setCashierSignatureUrl(null);
      }
    }
  }, [open, propAdminFee, publicMode, session]);

  useEffect(() => {
    if (propAdminFee !== undefined && !publicMode) {
      setAdminFee(propAdminFee);
    }
  }, [propAdminFee, publicMode]);

  useEffect(() => {
    if (!open) return;

    
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const padding = publicMode ? 48 : 32;
        const availableWidth = containerWidth - padding;
        const newScale = Math.min(1, availableWidth / 840);
        setScale(newScale);
      }
    };

    const timer = setTimeout(handleResize, 100);
    
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [open, publicMode]);

  if (!item) return null;

  // Use raw original tax amount (ketetapan) or fallback to tagihan/0
  const rawKetetapan = item.ketetapan !== undefined ? item.ketetapan : (item.tagihan !== undefined ? item.tagihan : 0);
  const totalBayar = rawKetetapan + adminFee;
  const spellingText = terbilang(totalBayar) ? `${terbilang(totalBayar)} Rupiah` : "Nol Rupiah";

  const cleanNop = item.nop.replace(/\D/g, "");
  // Dynamic Verification URL directed to search panel
  const verificationUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/?q=${cleanNop}`
    : `https://pbb.galaxynet.my.id/?q=${cleanNop}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

  // Generate dynamic formatted text values
  const kab = (villageConfig?.kabupaten || "NAMA KABUPATEN").toUpperCase();
  const kec = (villageConfig?.kecamatan || "NAMA KECAMATAN").toUpperCase();
  const desa = (villageConfig?.namaDesa || "NAMA DESA").toUpperCase();
  const alamat = villageConfig?.alamatKantor || "";
  const tglBayarFormatted = item.tanggalBayar ? formatDateNoTime(item.tanggalBayar).toUpperCase() : "-";
  const dusunFormatted = (item.dusun || "-").toUpperCase();
  const rtFormatted = item.rt || "00";
  const rwFormatted = item.rw || "00";

  // Build the print HTML template (1/4 A4 Landscape on A4 Portrait paper)
  const getReceiptHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Kwitansi Pelunasan PBB-P2</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Outfit', sans-serif;
            color: #1e293b;
            background-color: #fff;
            -webkit-print-color-adjust: exact;
            width: 210mm;
            height: 297mm;
            box-sizing: border-box;
          }
          .receipt-container {
            display: flex;
            justify-content: center;
            width: 210mm;
            height: 74mm;
            box-sizing: border-box;
            border-bottom: 1.5px dashed #10b981;
            position: relative;
          }
          .cut-hint {
            position: absolute;
            bottom: -14px;
            right: 8mm;
            font-size: 7px;
            color: #94a3b8;
            font-family: 'Outfit', sans-serif;
            display: flex;
            align-items: center;
            gap: 3px;
          }
          .cut-hint svg {
            width: 10px;
            height: 10px;
            fill: none;
            stroke: #94a3b8;
            stroke-width: 2;
          }
          
          /* Main Column (Receipt Body) */
          .main-col {
            width: 100%;
            height: 74mm;
            padding: 4mm 8mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
          }
          
          /* Main Column Elements */
          .main-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #059669;
            padding-bottom: 3px;
            margin-bottom: 3px;
          }
          .header-logo-title {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .village-logo {
            width: 36px;
            height: 44px;
            object-fit: contain;
          }
          .header-text {
            text-align: left;
          }
          .gov-title {
            font-size: 7.5px;
            font-weight: 700;
            color: #475569;
            margin: 0;
            letter-spacing: 0.5px;
          }
          .village-title {
            font-size: 11.5px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }
          .village-address {
            font-size: 7px;
            color: #64748b;
            margin: 2px 0 0 0;
          }
          .receipt-number {
            text-align: right;
          }
          .doc-type {
            font-size: 12px;
            font-weight: 800;
            color: #047857;
            margin: 0;
            letter-spacing: 1px;
          }
          .doc-ref {
            font-size: 7.5px;
            color: #64748b;
            font-weight: bold;
          }
          
          /* Form fields styling */
          .receipt-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;
            margin-top: 3px;
          }
          .field-row {
            display: flex;
            align-items: baseline;
            font-size: 9px;
          }
          .field-label {
            width: 100px;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 8px;
            letter-spacing: 0.5px;
          }
          .field-dots {
            width: 12px;
            color: #cbd5e1;
          }
          .field-value {
            flex: 1;
            font-weight: 600;
            color: #0f172a;
          }
          .field-value .spelled-box {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 3.5px 10px;
            border-radius: 8px;
            font-style: italic;
            color: #047857;
            font-weight: 800;
            font-size: 9.5px;
            display: inline-block;
            line-height: 1;
            letter-spacing: 0.5px;
          }
          
          /* Table calculations grid */
          .calc-box {
            margin-top: 3px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 4px 8px;
          }
          .calc-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            text-align: center;
          }
          .calc-item {
            display: flex;
            flex-direction: column;
          }
          .calc-label {
            font-size: 7.5px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .calc-value {
            font-size: 10px;
            font-weight: 700;
            color: #334155;
            margin-top: 1px;
          }
          .calc-value.highlight {
            font-size: 11px;
            font-weight: 800;
            color: #047857;
          }
          
          /* Footer layout */
          .main-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 3px;
          }
          .footer-left {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .main-qr {
            width: 34px;
            height: 34px;
            object-fit: contain;
            border: 1px solid #e2e8f0;
            padding: 2px;
            background: white;
            border-radius: 4px;
          }
          .verification-info {
            font-size: 7px;
            color: #64748b;
            line-height: 1.2;
          }
          .verification-title {
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
          }
          
          .footer-right {
            text-align: center;
            width: 140px;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
          }
          .receipt-date {
            font-size: 7.5px;
            font-weight: 600;
            color: #64748b;
            margin-bottom: 16px;
            text-transform: uppercase;
          }
          .cashier-sig {
            width: 50px;
            height: 50px;
            object-fit: contain;
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10;
            pointer-events: none;
          }
          .cashier-name {
            font-size: 8.5px;
            font-weight: 700;
            color: #0f172a;
            border-bottom: 1px solid #475569;
            padding-bottom: 1px;
            display: inline-block;
            min-width: 100px;
            text-transform: uppercase;
          }
          .cashier-title {
            font-size: 7px;
            color: #64748b;
            font-weight: 600;
            margin-top: 2px;
            text-transform: uppercase;
          }
          
          .lunas-stamp {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-12deg);
            border: 8px double rgba(16, 185, 129, 0.25);
            color: rgba(16, 185, 129, 0.25);
            font-size: 48px;
            font-weight: 900;
            padding: 8px 32px;
            border-radius: 12px;
            text-transform: uppercase;
            letter-spacing: 6px;
            pointer-events: none;
            font-family: 'Outfit', sans-serif;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- Kwitansi Utama -->
          <div class="main-col" style="position: relative;">
            <div class="lunas-stamp">LUNAS</div>
            
            <!-- Main Header -->
            <div class="main-header">
              <div class="header-logo-title">
                ${villageConfig?.logoUrl 
                  ? `<img class="village-logo" src="${villageConfig.logoUrl}" alt="Logo" />` 
                  : `<div style="width: 36px; height: 36px; background-color: #059669; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">PBB</div>`}
                <div class="header-text">
                  <h5 class="gov-title">PEMERINTAH KABUPATEN ${kab}</h5>
                  <h4 class="village-title">KANTOR DESA ${desa}</h4>
                  <p class="village-address">${alamat}</p>
                </div>
              </div>
              <div class="receipt-number">
                <h4 class="doc-type">KWITANSI</h4>
                <span class="doc-ref">NO: PBB-${cleanNop.substring(10, 13)}-${cleanNop.substring(13, 17)}-${item.tahun}</span>
              </div>
            </div>
            
            <!-- Receipt fields body -->
            <div class="receipt-body">
              <div class="field-row">
                <span class="field-label">Telah Terima Dari</span>
                <span class="field-dots">:</span>
                <span class="field-value" style="text-transform: uppercase;">${item.namaWp}</span>
              </div>
              
              <div class="field-row" style="margin: 1px 0;">
                <span class="field-label">Uang Sejumlah</span>
                <span class="field-dots">:</span>
                <div class="field-value">
                  <div class="spelled-box">== ${spellingText} ==</div>
                </div>
              </div>
              
              <div class="field-row">
                <span class="field-label">Untuk Pembayaran</span>
                <span class="field-dots">:</span>
                <span class="field-value">Pelunasan Pajak Bumi & Bangunan Perdesaan & Perkotaan (PBB-P2)</span>
              </div>
              
              <div class="field-row" style="font-size: 10px; margin-top: -1px;">
                <span class="field-label"></span>
                <span class="field-dots"></span>
                <span class="field-value" style="color: #475569; font-weight: 500;">
                  NOP: <span style="font-weight: 700; color: #0f172a;">${item.nop}</span> | TAHUN: ${item.tahun} | DUSUN ${dusunFormatted} RT ${rtFormatted}/RW ${rwFormatted} | LUAS: T ${item.luasTanah} m² / B ${item.luasBangunan} m²
                </span>
              </div>
            </div>
            
            <!-- Calculation Box -->
            <div class="calc-box">
              <div class="calc-grid">
                <div class="calc-item">
                  <span class="calc-label">Ketetapan PBB</span>
                  <span class="calc-value">Rp ${rawKetetapan.toLocaleString("id-ID")}</span>
                </div>
                <div class="calc-item">
                  <span class="calc-label">Biaya Admin</span>
                  <span class="calc-value">Rp ${adminFee.toLocaleString("id-ID")}</span>
                </div>
                 <div class="calc-item" style="border-left: 1px solid #e2e8f0; padding-left: 10px;">
                  <span class="calc-label" style="color: #047857;">Total Pembayaran</span>
                  <span class="calc-value highlight">Rp ${totalBayar.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
            
            <!-- Main Footer -->
            <div class="main-footer">
              <div class="footer-left">
                <img class="main-qr" src="${qrImageUrl}" alt="Verification QR" />
                <div class="verification-info">
                  <div class="verification-title">Bukti Pelunasan Resmi</div>
                  <div>PBB-P2 DESA ${desa} | KAB. ${kab}</div>
                  <div>Pindai QR Code untuk verifikasi validitas portal</div>
                </div>
              </div>
              
              <div class="footer-right">
                <div class="receipt-date">${desa}, ${tglBayarFormatted}</div>
                ${cashierSignatureUrl ? `<img src="${cashierSignatureUrl}" class="cashier-sig" alt="TTD" />` : ''}
                <span class="cashier-name">${cashierName ? cashierName : "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"}</span>
                <div class="cashier-title">KASIR / PETUGAS DESA</div>
              </div>
            </div>
          </div>
          <!-- Cut hint -->
          <div class="cut-hint">
            <svg viewBox="0 0 24 24"><path d="M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/></svg>
            <span>potong di sini</span>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(getReceiptHtml());
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 400);
  };

  const handleDownload = () => {
    if (!receiptRef.current) return;
    
    setIsDownloading(true);
    const toastId = toast.loading("Sedang menyiapkan file unduhan kwitansi...");
    
    setTimeout(() => {
      toPng(receiptRef.current!, { 
        cacheBust: true,
        pixelRatio: 3, // High DPI for crisp look and printing quality
        backgroundColor: "#ffffff",
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          margin: "0",
        }
      })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `Kwitansi-PBB-${cleanNop}-${item.tahun}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Kwitansi berhasil diunduh!", { id: toastId });
      })
      .catch((err) => {
        console.error("Gagal mengunduh kwitansi:", err);
        toast.error("Gagal mengunduh kwitansi. Silakan gunakan Cetak Kwitansi.", { id: toastId });
      })
      .finally(() => {
        setIsDownloading(false);
      });
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-h-[95vh] max-w-[95vw] overflow-hidden rounded-3xl border-none bg-white p-0 shadow-2xl md:max-w-4xl dark:bg-zinc-950 flex flex-col"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-2 rounded-xl">
              <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-base font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                Kwitansi Pelunasan PBB
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium uppercase mt-0.5">
                NOP: {item.nop}
              </DialogDescription>
            </div>
          </div>
          <DialogClose 
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                title="Tutup"
              >
                <X className="h-4 w-4" />
              </Button>
            }
          />
        </div>

        {/* Content body split into Receipt Preview and Centered Buttons */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/10">
          
          {/* Centered Preview Wrapper */}
          <div 
            className="flex flex-col items-center justify-center p-6 bg-zinc-200/40 dark:bg-zinc-950/40 rounded-3xl border border-zinc-200/30 dark:border-zinc-800/30 overflow-hidden min-h-[380px] w-full" 
            ref={containerRef}
          >
            <div className="text-[9px] uppercase font-black tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5 select-none">
              <span>Preview Kwitansi Landscape</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Scaling Wrapper for perfect responsive preview */}
            <div className="w-full flex items-center justify-center overflow-hidden py-1.5 select-none shrink-0">
              <div 
                className="flex items-center justify-center overflow-visible shrink-0 transition-all duration-300 origin-center" 
                style={{ 
                  transform: `scale(${scale})`, 
                  width: "840px", 
                  height: "296px" 
                }}
              >
                {/* Custom 1/4 A4 Preview Card (840px x 296px = 210mm x 74mm aspect ratio) */}
                <div 
                  ref={receiptRef}
                  className="bg-white text-slate-800 p-5 rounded-2xl shadow-2xl border border-zinc-200 flex flex-col justify-between relative overflow-hidden select-none shrink-0"
                  style={{ 
                    fontFamily: "'Outfit', sans-serif",
                    width: "840px",
                    height: "296px"
                  }}
                >
                  {/* Lunas Stamp background overlay centered */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-8 border-double border-emerald-500/25 text-emerald-500/25 font-black text-5xl px-8 py-2 rounded-xl pointer-events-none select-none tracking-widest">
                    LUNAS
                  </div>

                  {/* MAIN RECEIPT */}
                  <div className="w-full flex flex-col justify-between h-full">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-1">
                      <div className="flex items-center gap-3">
                        {villageConfig?.logoUrl ? (
                          <img 
                            className="w-[36px] h-[44px] object-contain animate-fade-in" 
                            src={villageConfig.logoUrl} 
                            alt="Logo Desa"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="bg-emerald-50 p-1.5 rounded-lg text-white">
                            <Award className="w-5 h-5" />
                          </div>
                        )}
                        <div className="text-left leading-none">
                          <span className="font-bold text-zinc-400 uppercase tracking-widest" style={{ fontSize: "8px" }}>Pemerintah Kabupaten {kab}</span>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mt-0.5">KANTOR DESA {desa}</h3>
                          <p className="text-zinc-500 font-medium mt-0.5" style={{ fontSize: "7.5px" }}>{alamat}</p>
                        </div>
                      </div>
                      <div className="text-right leading-none">
                        <h4 className="text-base font-black text-emerald-600 tracking-wider">KWITANSI</h4>
                        <span className="text-zinc-400 font-bold uppercase" style={{ fontSize: "7.5px" }}>NO: PBB-{cleanNop.substring(10, 13)}-{cleanNop.substring(13, 17)}-{item.tahun}</span>
                      </div>
                    </div>

                    {/* Body Form */}
                    <div className="space-y-1 mt-1.5 flex-1">
                      <div className="flex items-baseline text-xs">
                        <span className="font-black text-zinc-400 uppercase tracking-wider" style={{ width: "130px", fontSize: "8.5px" }}>Telah Terima Dari</span>
                        <span className="text-zinc-300" style={{ width: "15px" }}>:</span>
                        <span className="flex-1 font-bold text-slate-800 uppercase text-xs tracking-wide">{item.namaWp}</span>
                      </div>

                      <div className="flex items-center text-xs">
                        <span className="font-black text-zinc-400 uppercase tracking-wider" style={{ width: "130px", fontSize: "8.5px" }}>Uang Sejumlah</span>
                        <span className="text-zinc-300" style={{ width: "15px" }}>:</span>
                        <div className="flex-1 font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg italic tracking-wide leading-none" style={{ fontSize: "9.5px" }}>
                          == {spellingText} ==
                        </div>
                      </div>

                      <div className="flex items-baseline text-xs">
                        <span className="font-black text-zinc-400 uppercase tracking-wider" style={{ width: "130px", fontSize: "8.5px" }}>Untuk Pembayaran</span>
                        <span className="text-zinc-300" style={{ width: "15px" }}>:</span>
                        <span className="flex-1 font-semibold text-slate-800 leading-tight">
                          Pelunasan Pajak Bumi & Bangunan Perdesaan & Perkotaan (PBB-P2)
                        </span>
                      </div>

                      <div className="flex items-baseline text-xs">
                        <span style={{ width: "130px" }}></span>
                        <span style={{ width: "15px" }}></span>
                        <span className="flex-1 font-medium text-zinc-500 leading-normal" style={{ fontSize: "8.5px" }}>
                          NOP: <strong className="text-slate-800">{item.nop}</strong> | TAHUN {item.tahun} | DSN {dusunFormatted} RT {rtFormatted}/RW {rwFormatted} | Luas: T {item.luasTanah} m² / B {item.luasBangunan} m²
                        </span>
                      </div>
                    </div>

                    {/* Pricing calculations details bar */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-1.5 my-1">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="flex flex-col">
                          <span className="font-black text-zinc-400 uppercase tracking-wider" style={{ fontSize: "7.5px" }}>Ketetapan PBB</span>
                          <span className="font-bold text-slate-600 mt-0.5" style={{ fontSize: "11px" }}>Rp{rawKetetapan.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-zinc-400 uppercase tracking-wider" style={{ fontSize: "7.5px" }}>Biaya Admin</span>
                          <span className="font-bold text-slate-600 mt-0.5" style={{ fontSize: "11px" }}>Rp{adminFee.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex flex-col border-l border-zinc-200 pl-3">
                          <span className="font-black text-emerald-600 uppercase tracking-wider" style={{ fontSize: "7.5px" }}>Total Pembayaran</span>
                          <span className="font-black text-emerald-600 mt-0.5" style={{ fontSize: "12px" }}>Rp{totalBayar.toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer (QR + Signature) */}
                    <div className="flex justify-between items-end pt-0.5">
                      <div className="flex items-center gap-3">
                        <div className="bg-white border border-zinc-200 p-1 rounded-lg">
                          <img className="w-9 h-9 object-contain" src={qrImageUrl} alt="Verification QR" />
                        </div>
                        <div className="leading-tight text-left" style={{ fontSize: "7px", color: "#94a3b8" }}>
                          <div className="font-bold text-slate-600 uppercase tracking-wider">Bukti Pelunasan Resmi</div>
                          <div>PBB-P2 DESA {desa} | KAB. {kab}</div>
                          <div>Pindai QR Code untuk verifikasi portal</div>
                        </div>
                      </div>

                      <div className="text-center flex flex-col items-center relative" style={{ width: "160px" }}>
                        <div className="font-bold text-zinc-400 uppercase tracking-wider mb-4" style={{ fontSize: "7.5px" }}>
                          {desa}, {tglBayarFormatted}
                        </div>
                        {cashierSignatureUrl && (
                          <img 
                            src={cashierSignatureUrl} 
                            alt="TTD" 
                            className="object-contain absolute pointer-events-none"
                            style={{ width: "60px", height: "60px", top: "-8px", left: "50%", transform: "translateX(-50%)", zIndex: 10 }} 
                          />
                        )}
                        <span className="font-bold text-slate-800 border-b border-zinc-400 pb-0.5 uppercase tracking-wide px-4 inline-block text-center mt-2" style={{ fontSize: "9px", minWidth: "120px" }}>
                          {cashierName || <span className="opacity-0">KASIR / PETUGAS DESA</span>}
                        </span>
                        <div className="font-black text-zinc-400 uppercase tracking-widest mt-1" style={{ fontSize: "6.5px" }}>
                          Kasir / Petugas Desa
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* Action Buttons Center Row */}
          <div className="flex flex-row items-center justify-center gap-4 mt-6 w-full max-w-lg">
            <Button 
              onClick={handlePrint}
              disabled={isLoadingConfig}
              className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest gap-2.5 rounded-2xl shadow-lg shadow-emerald-600/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoadingConfig ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4.5 h-4.5" />
              )}
              Cetak Kwitansi
            </Button>
            <Button 
              onClick={handleDownload}
              disabled={isLoadingConfig || isDownloading}
              variant="outline"
              className="flex-1 h-12 font-black uppercase text-xs tracking-widest gap-2.5 rounded-2xl border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"

            >
              {isDownloading ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <Download className="w-4.5 h-4.5" />
              )}
              Unduh
            </Button>
          </div>
        </div>

        {/* Hidden Iframe for print execution */}
        <iframe 
          ref={iframeRef} 
          style={{ position: "absolute", width: "0px", height: "0px", border: "none" }}
          title="Print Frame" 
        />
      </DialogContent>
    </Dialog>
  );
}
