import { NextApiRequest, NextApiResponse } from "next";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const PUBLIC_BAPENDA_RATE_LIMIT = {
  limit: 10,
  windowMs: 60 * 1000,
};

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(",")[0].trim();
  }
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") {
    return realIp;
  }
  return req.socket.remoteAddress || "unknown";
}

const parseBapendaDate = (dateStr: string) => {
  // Bapenda format is often DD-MMM-YY, e.g. "11-AGT-25" or "05-06-2024"
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const monthStr = parts[1].toUpperCase();
      let year = parts[2];
      
      // normalize year if 2 digits
      if (year.length === 2) year = "20" + year;

      const months: Record<string, number> = {
        "JAN": 0, "FEB": 1, "MAR": 2, "APR": 3, "MEI": 4, "JUN": 5, 
        "JUL": 6, "AGT": 7, "SEP": 8, "OKT": 9, "NOV": 10, "DES": 11
      };

      let month = parseInt(monthStr) - 1; // if format 05-06-2024
      if (isNaN(month)) {
        month = months[monthStr] !== undefined ? months[monthStr] : 0;
      }
      
      return new Date(parseInt(year), month, day);
    }
  } catch {
    return new Date();
  }
  return new Date();
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { nop, tahun } = req.body;
  
  if (!nop || !tahun) {
    return res.status(400).json({ error: "NOP dan Tahun diperlukan." });
  }

  // Bersihkan titik dan strip dari NOP
  const cleanNop = nop.replace(/\D/g, "");

  if (cleanNop.length !== 18) {
    return res.status(400).json({ error: `NOP harus 18 digit angka (Terdeteksi ${cleanNop.length} digit: ${cleanNop}).` });
  }

  try {
    const ip = getClientIp(req);
    const rateLimitKey = `public-bapenda:${ip}:${cleanNop}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, PUBLIC_BAPENDA_RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: `Terlalu banyak percobaan sinkronisasi. Coba lagi dalam ${rateLimitResult.retryAfter} detik.`,
      });
    }

    const config = await prisma.villageConfig.findFirst({ where: { id: 1 } });
    if (!config?.enableBapendaSync) {
      return res.status(403).json({ error: "Fitur Sinkronisasi Bapenda sedang dinonaktifkan oleh Admin." });
    }

    const taxRecords = await prisma.taxData.findMany({
      where: {
        tahun: parseInt(tahun.toString(), 10),
        OR: [{ nop }, { nop: cleanNop }],
      },
      select: {
        id: true,
        nop: true,
        namaWp: true,
        penarikId: true,
        ketetapan: true,
        paymentStatus: true,
      },
    });

    if (taxRecords.length === 0) {
      return res.status(404).json({ error: "Data pajak tidak ditemukan untuk NOP dan tahun tersebut." });
    }

    const unpaidRecords = taxRecords.filter((record) => record.paymentStatus !== "LUNAS");
    if (unpaidRecords.length === 0) {
      return res.status(200).json({
        success: true,
        isPaid: true,
        message: "Data sudah berstatus LUNAS di sistem desa.",
      });
    }

    const p1 = cleanNop.substring(0, 2);
    const p2 = cleanNop.substring(2, 4);
    const p3 = cleanNop.substring(4, 7);
    const p4 = cleanNop.substring(7, 10);
    const p5 = cleanNop.substring(10, 13);
    const p6 = cleanNop.substring(13, 17);
    const p7 = cleanNop.substring(17, 18);

    const url = `https://bapenda.jombangkab.go.id/cek-bayar/ceknopbayar-jmb.kab?module=pbb&kata=${p1}&kata1=${p2}&kata2=${p3}&kata3=${p4}&kata4=${p5}&kata5=${p6}&kata6=${p7}&viewpbb=`;

    const fetchConfig = {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
      }
    };

    const htmlRes = await fetch(url, fetchConfig);
    if (!htmlRes.ok) {
        return res.status(502).json({ error: "Gagal terhubung ke server Bapenda." });
    }

    const htmlText = await htmlRes.text();
    const $ = cheerio.load(htmlText);

    let isLunas = false;
    let paymentDateStr = "";

    // Bapenda Jombang renders a specific table for PBB-P2
    // Kolom: [0]Tahun [1]Ketetapan [2]TagPkk [3]TagDnd [4]TagTotal [5]ByrPkk [6]ByrDnd [7]ByrTot [8]JatuhTempo [9]TglBayar
    $('tr').each((i, el) => {
        const tds = $(el).find('td');
        if (tds.length >= 10) {
            const yearStr = $(tds[0]).text().trim();
            if (yearStr === tahun.toString()) {
                const tagihanTotal = $(tds[4]).text().trim().replace(/,/g, '');
                const tglBayar = $(tds[9]).text().trim();
                
                // Jika tagihan total 0, atau tgl bayar terisi selain strip/kosong
                if (tagihanTotal === "0" || tagihanTotal === "0.00" || (tglBayar && tglBayar.length >= 8 && tglBayar !== "-")) {
                    isLunas = true;
                    if (tglBayar && tglBayar !== "-") {
                        paymentDateStr = tglBayar;
                    }
                }
            }
        }
    });

    if (isLunas) {
       let parsedTgl = new Date();
       if (paymentDateStr) {
         parsedTgl = parseBapendaDate(paymentDateStr);
       }

       await prisma.$transaction(
         unpaidRecords.map((record) =>
           prisma.taxData.update({
             where: { id: record.id },
             data: {
               paymentStatus: "LUNAS",
               pembayaran: record.ketetapan,
               sisaTagihan: 0,
               tanggalBayar: parsedTgl,
               tempatBayar: "Bapenda (Auto-Sync)",
               updatedAt: new Date(),
             },
           })
         )
       );

       const detailsText = `Auto-Sync Bapenda: Wajib Pajak NOP ${cleanNop} (${taxRecords[0]?.namaWp || 'Seseorang'}) telah LUNAS pada ${paymentDateStr || 'Bapenda'}`;
       
       await prisma.auditLog.create({
         data: {
           action: "PUBLIC_BAPENDA_SYNC",
           entity: "TaxData",
           details: detailsText
         }
       });

       // KIRIM NOTIFIKASI
       try {
          const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
          const targetUsers = new Set<string>();
          admins.forEach(a => targetUsers.add(a.id));
          
          unpaidRecords.forEach(r => {
            if (r.penarikId) targetUsers.add(r.penarikId);
          });

          if (targetUsers.size > 0) {
            const notifData = Array.from(targetUsers).map(userId => ({
               userId: userId,
               title: "Lunas Bapenda Otomatis",
               message: `Wajib Pajak ${taxRecords[0]?.namaWp || 'N/A'} (NOP ${cleanNop}) baru saja munas via server Bapenda.`,
               type: "ACCEPTED",
               link: "/admin/pajak"
            }));

            await prisma.notification.createMany({ data: notifData });
          }
       } catch (notifErr) {
          console.error("Gagal mengirim notifikasi:", notifErr);
       }
       
       return res.status(200).json({ 
          success: true, 
          isPaid: true, 
          date: paymentDateStr,
          message: `Otomatis dilunaskan! Tercatat dibayar pada ${paymentDateStr || 'Bapenda'}`
       });
    }
    
    // 1. Update timestamp record di database (agar label "Terakhir Dicek" terupdate)
    await prisma.taxData.updateMany({
      where: { id: { in: unpaidRecords.map((record) => record.id) } },
      data: { updatedAt: new Date() }
    });

    // 2. Catat ke Log Aktivitas (Audit Log)
    await prisma.auditLog.create({
      data: {
        action: "PUBLIC_BAPENDA_CHECK",
        entity: "TaxData",
        details: `Sync Bapenda: Pengecekan status NOP ${cleanNop} (Hasil: Masih Belum Lunas)`
      }
    });

    return res.status(200).json({ 
       success: true, 
       isPaid: false, 
       message: `Tagihan ${tahun} masih BELUM lunas di server pusat.` 
    });

  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terdapat kesalahan koneksi ke server pusat.";

    return res.status(500).json({ error: message });
  }
}
