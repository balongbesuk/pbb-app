import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { formatSignatureUrl } from "@/lib/utils";

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

export const dynamic = "force-dynamic";

async function getLocalImageBase64(urlPath: string) {
  if (!urlPath) return null;
  if (urlPath.startsWith("http")) return urlPath;
  try {
    // Remove query params if any (like ?v=123)
    const cleanPath = urlPath.split('?')[0];
    const filePath = path.join(process.cwd(), "public", cleanPath);
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).substring(1) || "png";
    return `data:image/${ext};base64,${buffer.toString("base64")}`;
  } catch (e) {
    console.error("Failed to load local image:", e);
    return null;
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taxId = parseInt(id, 10);
  if (!taxId || isNaN(taxId)) return new Response("Invalid ID", { status: 400 });

  try {
    const tax = await prisma.taxData.findUnique({ where: { id: taxId } });
    if (!tax) return new Response("Tax data not found", { status: 404 });

    const config = await prisma.villageConfig.findUnique({ where: { id: 1 } });
    
    const { searchParams } = new URL(req.url);
    const officerId = searchParams.get('officerId');

    let officerName = null;
    let officerSignatureUrl = null;

    if (officerId) {
      const officer = await prisma.user.findUnique({ where: { id: officerId } });
      if (officer) {
        officerName = officer.name || officer.username;
        if (officer.signatureUrl) {
          officerSignatureUrl = await getLocalImageBase64(formatSignatureUrl(officer.signatureUrl)!);
        }
      }
    }
    
    const logoUrl = config?.logoUrl ? await getLocalImageBase64(config.logoUrl) : null;

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

    const isBumdes = config?.useBumdesFormat || false;
    const adminFee = config?.adminFee || 0;
    const ketetapan = tax.ketetapan || 0;
    const totalBayar = ketetapan + adminFee;

    const spellingText = terbilang(totalBayar) ? `${terbilang(totalBayar)} Rupiah` : "Nol Rupiah";
    const cleanNop = tax.nop.replace(/\D/g, "");
    
    // Fallback to domain if origin is localhost or something similar, or just trust nextUrl.origin
    // Since this is server side, req.nextUrl.origin contains the request's origin.
    const baseOrigin = req.nextUrl.origin;
    if (baseOrigin.includes("localhost")) {
      // In local dev, verification goes to local. In production, goes to the production domain.
    }
    const verificationUrl = `${baseOrigin}/?q=${cleanNop}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f8fafc', // slate-50
            fontFamily: 'sans-serif',
            padding: '40px',
            position: 'relative',
          }}
        >
          {/* Background watermark or pattern */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-30deg)',
              fontSize: '120px',
              fontWeight: '900',
              color: 'rgba(16, 185, 129, 0.05)',
              letterSpacing: '10px',
              zIndex: 0,
            }}
          >
            L U N A S
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
              border: '1px solid #e2e8f0',
              flex: 1,
              padding: '40px',
              zIndex: 10,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '32px', marginBottom: '24px' }}>
              {logoUrl ? (
                <div style={{ display: 'flex', marginRight: '32px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} height={90} style={{ objectFit: 'contain' }} alt="Logo" />
                </div>
              ) : (
                <div style={{ width: '80px', height: '90px', backgroundColor: '#e2e8f0', borderRadius: '12px', marginRight: '32px' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', letterSpacing: '1px' }}>
                  BUKTI PEMBAYARAN PBB-P2
                </span>
                <span style={{ fontSize: '22px', fontWeight: '700', color: '#475569', marginTop: '8px', textTransform: 'uppercase' }}>
                  {isBumdes ? 'BUMDES' : 'PEMERINTAH DESA'} {config?.namaDesa || 'Belum Diatur'}
                </span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#94a3b8', marginTop: '6px', textTransform: 'uppercase' }}>
                  KECAMATAN {config?.kecamatan || '-'}, KABUPATEN {config?.kabupaten || '-'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, backgroundColor: '#f8fafc', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <span style={{ width: '220px', fontSize: '16px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Telah Terima Dari</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#64748b', marginRight: '16px' }}>:</span>
                <span style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase' }}>{tax.namaWp}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
                <span style={{ width: '220px', fontSize: '16px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>Uang Sejumlah</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#64748b', marginRight: '16px', marginTop: '8px' }}>:</span>
                <div style={{ display: 'flex', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 20px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#047857', fontStyle: 'italic' }}>
                    == {spellingText} ==
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <span style={{ width: '220px', fontSize: '16px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Untuk Pembayaran</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#64748b', marginRight: '16px' }}>:</span>
                <span style={{ fontSize: '20px', fontWeight: '600', color: '#334155' }}>Pelunasan Pajak Bumi & Bangunan (PBB-P2)</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: '12px', paddingTop: '24px', borderTop: '2px dashed #cbd5e1' }}>
                <span style={{ width: '220px', fontSize: '14px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Rincian Objek</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#94a3b8', marginRight: '16px' }}>:</span>
                <span style={{ fontSize: '16px', fontWeight: '500', color: '#475569', lineHeight: 1.6 }}>
                  <strong style={{ color: '#0f172a' }}>NOP: {tax.nop}</strong> &nbsp;|&nbsp; TAHUN: {tax.tahun || new Date().getFullYear()} <br/>
                  Letak: {tax.alamatObjek || `Desa ${config?.namaDesa}`}
                </span>
              </div>
            </div>

            {/* Total Area */}
            <div style={{ display: 'flex', flexDirection: 'row', backgroundColor: '#f8fafc', padding: '24px 32px', borderRadius: '16px', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', marginTop: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', marginRight: '32px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Ketetapan PBB</span>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#334155', marginTop: '4px' }}>{formatCurrency(ketetapan)}</span>
                </div>
                
                {adminFee > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', marginRight: '32px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Biaya Admin</span>
                    <span style={{ fontSize: '24px', fontWeight: '700', color: '#334155', marginTop: '4px' }}>{formatCurrency(adminFee)}</span>
                  </div>
                )}

                <div style={{ width: '2px', height: '48px', backgroundColor: '#cbd5e1', marginRight: '32px' }} />

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#047857', textTransform: 'uppercase' }}>Total Bayar</span>
                  <span style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>{formatCurrency(totalBayar)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', padding: '8px 24px', borderRadius: '100px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', letterSpacing: '1px' }}>LUNAS</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b' }}>{dateStr} {timeStr}</span>
              </div>
            </div>

            {/* Footer with QR and Officer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <div style={{ display: 'flex', backgroundColor: '#ffffff', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '8px', marginRight: '16px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrImageUrl} width={64} height={64} alt="QR Code" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>Bukti Pelunasan Resmi</span>
                  <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Sah diterbitkan oleh sistem PBB-App {isBumdes ? 'BUMDes' : 'Desa'} {config?.namaDesa || ''}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Pindai QR Code untuk verifikasi portal</span>
                </div>
              </div>
              {officerName && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '150px' }}>
                  <span style={{ fontSize: '14px', color: '#64748b', marginBottom: officerSignatureUrl ? '0px' : '40px' }}>{isBumdes ? 'Petugas BUMDes,' : 'Petugas,'}</span>
                  {officerSignatureUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={officerSignatureUrl} width={100} height={100} style={{ objectFit: 'contain' }} alt="TTD" />
                  )}
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', textDecoration: 'underline' }}>{officerName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      {
        width: 800,
        height: 1000,
      }
    );
  } catch (error) {
    console.error("Cetak Kwitansi Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
