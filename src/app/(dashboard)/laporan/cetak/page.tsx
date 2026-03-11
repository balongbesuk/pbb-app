import { prisma } from "@/lib/prisma";
import { getVillageConfig } from "@/app/actions/settings-actions";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function CetakLaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return notFound();

  const params = await searchParams;
  const currentYear = parseInt(params.tahun || new Date().getFullYear().toString());
  const config = await getVillageConfig();
  const tanggalCetak = format(new Date(), "dd MMMM yyyy", { locale: localeId });

  // Aggregate Data by Penarik and PaymentStatus
  const penarikStatsRaw = await prisma.taxData.groupBy({
    by: ["penarikId", "paymentStatus"],
    where: { tahun: currentYear },
    _count: { nop: true },
    _sum: { ketetapan: true, pembayaran: true, sisaTagihan: true },
  });

  const penarikMapReduce = new Map<string, any>();
  penarikStatsRaw.forEach((stat) => {
    const pId = stat.penarikId || "unassigned";
    if (!penarikMapReduce.has(pId)) {
      penarikMapReduce.set(pId, {
        penarikId: stat.penarikId,
        _count: { nop: 0 },
        _sum: { ketetapan: 0, pembayaran: 0, sisaTagihan: 0 },
        lunasCount: 0,
        belumLunasCount: 0,
      });
    }
    const curr = penarikMapReduce.get(pId);
    curr._count.nop += stat._count.nop;
    curr._sum.ketetapan += stat._sum.ketetapan || 0;
    curr._sum.pembayaran += stat._sum.pembayaran || 0;
    curr._sum.sisaTagihan += stat._sum.sisaTagihan || 0;
    if (stat.paymentStatus === "LUNAS") curr.lunasCount += stat._count.nop;
    else curr.belumLunasCount += stat._count.nop;
  });

  const penarikUsers = await prisma.user.findMany({
    where: { role: "PENARIK" },
    select: { id: true, name: true, dusun: true },
  });
  const penarikMap = new Map(penarikUsers.map((u) => [u.id, u]));

  const stats = Array.from(penarikMapReduce.values())
    .map((s: any) => ({
      ...s,
      penarikName: s.penarikId
        ? penarikMap.get(s.penarikId)?.name || "Tidak Ditemukan"
        : "Belum Dialokasikan",
      penarikDusun: s.penarikId ? penarikMap.get(s.penarikId)?.dusun || "-" : "-",
    }))
    .sort((a: any, b: any) => a.penarikName.localeCompare(b.penarikName));

  const totalWp = stats.reduce((a: number, c: any) => a + c._count.nop, 0);
  const totalLunas = stats.reduce((a: number, c: any) => a + c.lunasCount, 0);
  const totalBelum = stats.reduce((a: number, c: any) => a + c.belumLunasCount, 0);
  const totalTarget = stats.reduce((a: number, c: any) => a + c._sum.ketetapan, 0);
  const totalRealisasi = stats.reduce((a: number, c: any) => a + c._sum.pembayaran, 0);
  const totalSisa = stats.reduce((a: number, c: any) => a + c._sum.sisaTagihan, 0);
  const totalProgress = totalTarget > 0 ? ((totalRealisasi / totalTarget) * 100).toFixed(1) : "0.0";

  const fmt = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const desa = config?.namaDesa || "—";
  const kecamatan = config?.kecamatan || "—";
  const kabupaten = config?.kabupaten || "—";

  return (
    <html lang="id">
      <head>
        <title>Laporan Realisasi PBB Desa {desa} Tahun {currentYear}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            color: #000;
            background: #fff;
            padding: 0;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 20mm 20mm 25mm 25mm;
          }
          .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 16px; }
          .logo-area { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 8px; }
          .logo { width: 64px; height: 64px; object-fit: contain; }
          .header-text h1 { font-size: 13pt; font-weight: bold; text-transform: uppercase; }
          .header-text h2 { font-size: 12pt; font-weight: bold; text-transform: uppercase; }
          .header-text p { font-size: 10pt; }
          .title-section { text-align: center; margin-bottom: 16px; }
          .title-section h3 { font-size: 13pt; font-weight: bold; text-transform: uppercase; text-decoration: underline; }
          .title-section p { font-size: 11pt; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt; }
          th { background: #e5e5e5; border: 1px solid #000; padding: 5px 6px; text-align: center; font-weight: bold; }
          td { border: 1px solid #000; padding: 4px 6px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-row { background: #f0f0f0; font-weight: bold; }
          .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
          .summary-box { border: 1px solid #ccc; padding: 8px 12px; }
          .summary-box .label { font-size: 9pt; color: #444; margin-bottom: 2px; }
          .summary-box .value { font-size: 12pt; font-weight: bold; }
          .summary-box .sub { font-size: 9pt; color: #666; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
          .signature-block { text-align: center; }
          .signature-block .role { font-size: 10pt; margin-bottom: 4px; }
          .signature-block .name { font-weight: bold; text-decoration: underline; font-size: 11pt; }
          .signature-block .nip { font-size: 9pt; }
          .signature-space { height: 64px; }
          .no-print { display: none; }
          @media screen {
            .no-print { display: block; }
            body { background: #f0f0f0; }
            .page { box-shadow: 0 0 20px rgba(0,0,0,0.2); margin: 20px auto; }
          }
          @media print {
            body { background: #fff; }
            .page { margin: 0; padding: 15mm 15mm 20mm 20mm; }
          }
        `}</style>
      </head>
      <body>
        {/* Print button — only visible on screen */}
        <div className="no-print" style={{
          position: "fixed", top: "16px", right: "16px", zIndex: 100,
          display: "flex", gap: "8px"
        }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: "10px 20px", background: "#1d4ed8", color: "#fff",
              border: "none", borderRadius: "8px", cursor: "pointer",
              fontFamily: "sans-serif", fontSize: "14px", fontWeight: "bold",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
            }}
          >
            🖨️ Cetak / Simpan PDF
          </button>
          <button
            onClick={() => window.close()}
            style={{
              padding: "10px 20px", background: "#6b7280", color: "#fff",
              border: "none", borderRadius: "8px", cursor: "pointer",
              fontFamily: "sans-serif", fontSize: "14px"
            }}
          >
            ✕ Tutup
          </button>
        </div>

        <div className="page">
          {/* KOP SURAT */}
          <div className="header">
            <div className="logo-area">
              {config?.logoUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={config.logoUrl} alt="Logo Desa" className="logo" />
              )}
              <div className="header-text">
                <h1>Pemerintah Desa {desa}</h1>
                <h2>Kecamatan {kecamatan}, Kabupaten {kabupaten}</h2>
                <p>Laporan Realisasi Penerimaan Pajak Bumi dan Bangunan</p>
              </div>
            </div>
          </div>

          {/* JUDUL */}
          <div className="title-section">
            <h3>Laporan Realisasi Penerimaan PBB</h3>
            <p>Tahun Pajak {currentYear} &bull; Dicetak: {tanggalCetak}</p>
          </div>

          {/* RINGKASAN ANGKA */}
          <div className="summary-grid">
            <div className="summary-box">
              <div className="label">Total Wajib Pajak</div>
              <div className="value">{totalWp.toLocaleString("id-ID")} WP</div>
              <div className="sub">Lunas: {totalLunas} | Belum: {totalBelum}</div>
            </div>
            <div className="summary-box">
              <div className="label">Target Penerimaan</div>
              <div className="value">{fmt(totalTarget)}</div>
            </div>
            <div className="summary-box">
              <div className="label">Total Realisasi</div>
              <div className="value">{fmt(totalRealisasi)}</div>
              <div className="sub">Progress: {totalProgress}%</div>
            </div>
            <div className="summary-box">
              <div className="label">Sisa Piutang</div>
              <div className="value">{fmt(totalSisa)}</div>
            </div>
          </div>

          {/* TABEL REKAPITULASI */}
          <table>
            <thead>
              <tr>
                <th style={{ width: "30px" }}>No</th>
                <th>Penarik / Kolektor</th>
                <th>Wilayah</th>
                <th>Total WP</th>
                <th>Lunas</th>
                <th>Belum</th>
                <th>Target (Rp)</th>
                <th>Realisasi (Rp)</th>
                <th>Sisa (Rp)</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat: any, i: number) => {
                const target = stat._sum.ketetapan || 0;
                const realisasi = stat._sum.pembayaran || 0;
                const sisa = stat._sum.sisaTagihan || 0;
                const pct = target > 0 ? ((realisasi / target) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={i}>
                    <td className="text-center">{i + 1}</td>
                    <td>{stat.penarikName}</td>
                    <td className="text-center">{stat.penarikDusun || "-"}</td>
                    <td className="text-center">{stat._count.nop}</td>
                    <td className="text-center">{stat.lunasCount}</td>
                    <td className="text-center">{stat.belumLunasCount}</td>
                    <td className="text-right">{fmt(target).replace("Rp\u00a0", "")}</td>
                    <td className="text-right">{fmt(realisasi).replace("Rp\u00a0", "")}</td>
                    <td className="text-right">{fmt(sisa).replace("Rp\u00a0", "")}</td>
                    <td className="text-center">{pct}%</td>
                  </tr>
                );
              })}
              {/* TOTAL ROW */}
              <tr className="total-row">
                <td className="text-center" colSpan={3}>TOTAL</td>
                <td className="text-center">{totalWp}</td>
                <td className="text-center">{totalLunas}</td>
                <td className="text-center">{totalBelum}</td>
                <td className="text-right">{fmt(totalTarget).replace("Rp\u00a0", "")}</td>
                <td className="text-right">{fmt(totalRealisasi).replace("Rp\u00a0", "")}</td>
                <td className="text-right">{fmt(totalSisa).replace("Rp\u00a0", "")}</td>
                <td className="text-center">{totalProgress}%</td>
              </tr>
            </tbody>
          </table>

          {/* TANDA TANGAN */}
          <div className="signatures">
            <div className="signature-block">
              <p className="role">Petugas Pemungut,</p>
              <div className="signature-space" />
              <p className="name">( __________________ )</p>
              <p className="nip">NIP. _______________</p>
            </div>
            <div className="signature-block">
              <p className="role">Mengetahui,</p>
              <p className="role">Kepala Desa {desa}</p>
              <div className="signature-space" />
              <p className="name">( __________________ )</p>
              <p className="nip">NIP. _______________</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
