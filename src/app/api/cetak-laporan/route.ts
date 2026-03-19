import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVillageConfig } from "@/app/actions/settings-actions";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());
  const config = await getVillageConfig();

  const now = new Date();
  const tanggalCetak = now.toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
  });

  // Aggregate data
  const penarikStatsRaw = await prisma.taxData.groupBy({
    by: ["penarikId", "paymentStatus"],
    where: { tahun },
    _count: { nop: true },
    _sum: { ketetapan: true, pembayaran: true, sisaTagihan: true },
  });

  interface PenarikStat {
    penarikId: string | null;
    nop: number;
    ketetapan: number;
    pembayaran: number;
    sisaTagihan: number;
    lunas: number;
    belum: number;
    sengketa: number;
    tdkTerbit: number;
    name?: string;
    dusun?: string;
  }

  const map = new Map<string, PenarikStat>();
  penarikStatsRaw.forEach((s) => {
    const pId = s.penarikId || "unassigned";
    if (!map.has(pId)) {
      map.set(pId, { penarikId: s.penarikId, nop: 0, ketetapan: 0, pembayaran: 0, sisaTagihan: 0, lunas: 0, belum: 0, sengketa: 0, tdkTerbit: 0 });
    }
    const c = map.get(pId)!;
    c.nop += s._count.nop;
    c.ketetapan += s._sum.ketetapan || 0;
    c.pembayaran += s._sum.pembayaran || 0;
    c.sisaTagihan += s._sum.sisaTagihan || 0;
    if (s.paymentStatus === "LUNAS") c.lunas += s._count.nop;
    else if (s.paymentStatus === "BELUM_LUNAS") c.belum += s._count.nop;
    else if (s.paymentStatus === "SUSPEND") c.sengketa += s._count.nop;
    else if (s.paymentStatus === "TIDAK_TERBIT") c.tdkTerbit += s._count.nop;
  });

  const penarikUsers = await prisma.user.findMany({
    where: { role: "PENARIK" },
    select: { id: true, name: true, dusun: true },
  });
  const penarikMap = new Map(penarikUsers.map((u) => [u.id, u]));

  const stats = Array.from(map.values())
    .map((s) => ({
      ...s,
      name: s.penarikId ? penarikMap.get(s.penarikId)?.name || "Tidak Ditemukan" : "Belum Dialokasikan",
      dusun: s.penarikId ? penarikMap.get(s.penarikId)?.dusun || "-" : "-",
    }))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const totalWp = stats.reduce((a, c: PenarikStat) => a + c.nop, 0);
  const totalLunas = stats.reduce((a, c: PenarikStat) => a + c.lunas, 0);
  const totalBelum = stats.reduce((a, c: PenarikStat) => a + c.belum, 0);
  const totalTarget = stats.reduce((a, c: PenarikStat) => a + c.ketetapan, 0);
  const totalRealisasi = stats.reduce((a, c: PenarikStat) => a + c.pembayaran, 0);
  const totalSisa = stats.reduce((a, c: PenarikStat) => a + c.sisaTagihan, 0);
  const totalPct = totalTarget > 0 ? ((totalRealisasi / totalTarget) * 100).toFixed(1) : "0.0";

  const fmt = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
      .format(val)
      .replace("Rp\u00a0", "");

  const desa = config?.namaDesa || "—";
  const kecamatan = config?.kecamatan || "—";
  const kabupaten = config?.kabupaten || "—";
  const logoUrl = config?.logoUrl || "";

  const tableRows = stats.map((s, i) => {
    const pct = s.ketetapan > 0 ? ((s.pembayaran / s.ketetapan) * 100).toFixed(1) : "0.0";
    return `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${s.name}</td>
        <td style="text-align:center">${s.dusun}</td>
        <td style="text-align:center">${s.nop}</td>
        <td style="text-align:center">${s.lunas}</td>
        <td style="text-align:center">${s.belum}</td>
        <td style="text-align:center">${s.sengketa}</td>
        <td style="text-align:center">${s.tdkTerbit}</td>
        <td style="text-align:right">${fmt(s.ketetapan)}</td>
        <td style="text-align:right">${fmt(s.pembayaran)}</td>
        <td style="text-align:right">${fmt(s.sisaTagihan)}</td>
        <td style="text-align:center">${pct}%</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Laporan Realisasi PBB Desa ${desa} Tahun ${tahun}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; background: #f0f0f0; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 15mm 15mm 20mm 20mm; background: #fff; }
    .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 16px; }
    .logo-area { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 8px; }
    .logo { width: 68px; height: 68px; object-fit: contain; }
    .header-text h1 { font-size: 13pt; font-weight: bold; text-transform: uppercase; }
    .header-text h2 { font-size: 12pt; font-weight: bold; text-transform: uppercase; }
    .header-text p { font-size: 10pt; }
    .title-section { text-align: center; margin-bottom: 14px; }
    .title-section h3 { font-size: 12pt; font-weight: bold; text-transform: uppercase; text-decoration: underline; }
    .title-section p { font-size: 11pt; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
    .summary-box { border: 1px solid #ccc; padding: 6px 10px; }
    .summary-box .lbl { font-size: 9pt; color: #444; }
    .summary-box .val { font-size: 12pt; font-weight: bold; }
    .summary-box .sub { font-size: 9pt; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 9pt; }
    th { background: #e5e5e5; border: 1px solid #000; padding: 4px 5px; text-align: center; font-weight: bold; }
    td { border: 1px solid #000; padding: 3px 5px; }
    .total-row { background: #f0f0f0; font-weight: bold; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 36px; }
    .signature-block { text-align: center; }
    .signature-block .role { font-size: 10pt; margin-bottom: 3px; }
    .signature-block .sig-name { font-weight: bold; text-decoration: underline; font-size: 11pt; }
    .signature-block .nip { font-size: 9pt; }
    .signature-space { height: 60px; }
    .no-print { display: block; }
    .btn-bar { position: fixed; top: 16px; right: 16px; display: flex; gap: 8px; z-index: 999; }
    .btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; }
    .btn-print { background: #1d4ed8; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .btn-close { background: #6b7280; color: #fff; }
    @media screen {
      .page { box-shadow: 0 0 20px rgba(0,0,0,0.2); margin: 20px auto; }
    }
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .page { margin: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="no-print btn-bar">
    <button class="btn btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
    <button class="btn btn-close" onclick="window.close()">✕ Tutup</button>
  </div>

  <div class="page">
    <div class="header">
      <div class="logo-area">
        ${logoUrl ? `<img src="${logoUrl}" alt="Logo Desa" class="logo" />` : ""}
        <div class="header-text">
          <h1>Pemerintah Desa ${desa}</h1>
          <h2>Kecamatan ${kecamatan}, Kabupaten ${kabupaten}</h2>
          <p>Laporan Realisasi Penerimaan Pajak Bumi dan Bangunan</p>
        </div>
      </div>
    </div>

    <div class="title-section">
      <h3>Laporan Realisasi Penerimaan PBB</h3>
      <p>Tahun Pajak ${tahun} &bull; Dicetak: ${tanggalCetak}</p>
    </div>

    <div class="summary-grid">
      <div class="summary-box">
        <div class="lbl">Total Wajib Pajak</div>
        <div class="val">${totalWp.toLocaleString("id-ID")} WP</div>
        <div class="sub">Lunas: ${totalLunas} | Belum: ${totalBelum} | Sgkta: ${stats.reduce((a,c)=>a+c.sengketa, 0)} | TdkTrb: ${stats.reduce((a,c)=>a+c.tdkTerbit, 0)}</div>
      </div>
      <div class="summary-box">
        <div class="lbl">Target Penerimaan</div>
        <div class="val">Rp ${fmt(totalTarget)}</div>
      </div>
      <div class="summary-box">
        <div class="lbl">Total Realisasi</div>
        <div class="val">Rp ${fmt(totalRealisasi)}</div>
        <div class="sub">Progress: ${totalPct}%</div>
      </div>
      <div class="summary-box">
        <div class="lbl">Sisa Piutang</div>
        <div class="val">Rp ${fmt(totalSisa)}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:28px">No</th>
          <th>Penarik / Kolektor</th>
          <th style="width:80px">Wilayah</th>
          <th style="width:40px">WP</th>
          <th style="width:40px">Lunas</th>
          <th style="width:35px">Blm</th>
          <th style="width:35px">Sgkta</th>
          <th style="width:35px">TdkTrb</th>
          <th>Target (Rp)</th>
          <th>Realisasi (Rp)</th>
          <th>Sisa (Rp)</th>
          <th style="width:40px">%</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
        <tr class="total-row">
          <td colspan="3" style="text-align:center">TOTAL</td>
          <td style="text-align:center">${totalWp}</td>
          <td style="text-align:center">${totalLunas}</td>
          <td style="text-align:center">${totalBelum}</td>
          <td style="text-align:center">${stats.reduce((a,c)=>a+c.sengketa, 0)}</td>
          <td style="text-align:center">${stats.reduce((a,c)=>a+c.tdkTerbit, 0)}</td>
          <td style="text-align:right">${fmt(totalTarget)}</td>
          <td style="text-align:right">${fmt(totalRealisasi)}</td>
          <td style="text-align:right">${fmt(totalSisa)}</td>
          <td style="text-align:center">${totalPct}%</td>
        </tr>
      </tbody>
    </table>

    <div class="signatures">
      <div class="signature-block">
        <p class="role">Petugas Pemungut,</p>
        <div class="signature-space"></div>
        <p class="sig-name">( __________________ )</p>
        <p class="nip">NIP. _______________</p>
      </div>
      <div class="signature-block">
        <p class="role">Mengetahui,</p>
        <p class="role">Kepala Desa ${desa}</p>
        <div class="signature-space"></div>
        <p class="sig-name">( __________________ )</p>
        <p class="nip">NIP. _______________</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
