import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

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
          officerSignatureUrl = await getLocalImageBase64(officer.signatureUrl);
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
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '30px', marginBottom: '30px' }}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} width={80} height={80} style={{ objectFit: 'contain', marginRight: '24px' }} alt="Logo" />
              ) : (
                <div style={{ width: '80px', height: '80px', backgroundColor: '#e2e8f0', borderRadius: '40px', marginRight: '24px' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>
                  Kwitansi Pembayaran PBB
                </span>
                <span style={{ fontSize: '20px', fontWeight: '500', color: '#64748b', marginTop: '4px' }}>
                  Pemerintah Desa {config?.namaDesa || 'Belum Diatur'}
                </span>
                <span style={{ fontSize: '16px', color: '#94a3b8', marginTop: '4px' }}>
                  Kecamatan {config?.kecamatan || '-'}, Kabupaten {config?.kabupaten || '-'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Nama Wajib Pajak</span>
                <span style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{tax.namaWp}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Nomor Objek Pajak (NOP)</span>
                <span style={{ fontSize: '24px', fontWeight: '600', color: '#334155', marginTop: '4px', fontFamily: 'monospace' }}>{tax.nop}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', gap: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Tahun Pajak</span>
                  <span style={{ fontSize: '24px', fontWeight: '600', color: '#334155', marginTop: '4px' }}>{tax.tahun || new Date().getFullYear()}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Letak Objek Pajak</span>
                  <span style={{ fontSize: '20px', fontWeight: '500', color: '#334155', marginTop: '4px' }}>
                    {tax.alamatObjek || `Desa ${config?.namaDesa}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Area */}
            <div style={{ display: 'flex', flexDirection: 'row', backgroundColor: '#f8fafc', padding: '30px', borderRadius: '16px', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', marginTop: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Total Ketetapan</span>
                <span style={{ fontSize: '40px', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>{formatCurrency(tax.ketetapan)}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#10b981', padding: '8px 16px', borderRadius: '100px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', letterSpacing: '1px' }}>LUNAS</span>
                </div>
                <span style={{ fontSize: '14px', color: '#64748b' }}>{dateStr} {timeStr}</span>
              </div>
            </div>

            {/* Footer with Officer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>Kwitansi digital ini sah diterbitkan oleh PBB-App Desa {config?.namaDesa || ''}</span>
              {officerName && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '150px' }}>
                  <span style={{ fontSize: '14px', color: '#64748b', marginBottom: officerSignatureUrl ? '0px' : '40px' }}>Petugas,</span>
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
