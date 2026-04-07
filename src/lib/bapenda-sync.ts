import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import axios from "axios";
import https from "https";

const PUBLIC_BAPENDA_RATE_LIMIT = {
  limit: 10,
  windowMs: 60 * 1000,
};

export type BapendaSyncResponse =
  | { status: 200; body: { success: true; isPaid: true; message: string; date?: string } }
  | { status: 200; body: { success: true; isPaid: false; message: string } }
  | { status: 400 | 403 | 404 | 429 | 502 | 500; body: { error: string } };

function parseBapendaDate(dateStr: string) {
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const monthStr = parts[1].toUpperCase();
      let year = parts[2];

      if (year.length === 2) year = "20" + year;

      const months: Record<string, number> = {
        JAN: 0,
        FEB: 1,
        MAR: 2,
        APR: 3,
        MEI: 4,
        JUN: 5,
        JUL: 6,
        AGT: 7,
        SEP: 8,
        OKT: 9,
        NOV: 10,
        DES: 11,
      };

      let month = parseInt(monthStr) - 1;
      if (isNaN(month)) {
        month = months[monthStr] !== undefined ? months[monthStr] : 0;
      }

      return new Date(parseInt(year), month, day);
    }
  } catch {
    return new Date();
  }

  return new Date();
}

function buildJombangBapendaUrl(cleanNop: string) {
  const p1 = cleanNop.substring(0, 2);
  const p2 = cleanNop.substring(2, 4);
  const p3 = cleanNop.substring(4, 7);
  const p4 = cleanNop.substring(7, 10);
  const p5 = cleanNop.substring(10, 13);
  const p6 = cleanNop.substring(13, 17);
  const p7 = cleanNop.substring(17, 18);

  return `https://bapenda.jombangkab.go.id/cek-bayar/ceknopbayar-jmb.kab?module=pbb&kata=${p1}&kata1=${p2}&kata2=${p3}&kata3=${p4}&kata4=${p5}&kata5=${p6}&kata6=${p7}&viewpbb=`;
}

export async function syncBapendaStatus({
  nop,
  tahun,
  clientIp,
}: {
  nop: string;
  tahun: number;
  clientIp: string;
}): Promise<BapendaSyncResponse> {
  const cleanNop = nop.replace(/\D/g, "");

  if (!cleanNop || !tahun) {
    return { status: 400, body: { error: "NOP dan Tahun diperlukan." } };
  }

  if (cleanNop.length !== 18) {
    return {
      status: 400,
      body: { error: `NOP harus 18 digit angka (Terdeteksi ${cleanNop.length} digit: ${cleanNop}).` },
    };
  }

  const rateLimitKey = `public-bapenda:${clientIp}:${cleanNop}`;
  const rateLimitResult = checkRateLimit(rateLimitKey, PUBLIC_BAPENDA_RATE_LIMIT);
  if (!rateLimitResult.allowed) {
    return {
      status: 429,
      body: {
        error: `Terlalu banyak percobaan sinkronisasi. Coba lagi dalam ${rateLimitResult.retryAfter} detik.`,
      },
    };
  }

  const config = await prisma.villageConfig.findFirst({ where: { id: 1 } });
  if (!config?.enableBapendaSync) {
    return {
      status: 403,
      body: { error: "Fitur Sinkronisasi Bapenda sedang dinonaktifkan oleh Admin." },
    };
  }

  const taxRecords = await prisma.taxData.findMany({
    where: {
      tahun,
      OR: [{ nop }, { nop: cleanNop }],
    },
    select: {
      id: true,
      namaWp: true,
      penarikId: true,
      ketetapan: true,
      paymentStatus: true,
    },
  });

  if (taxRecords.length === 0) {
    return {
      status: 404,
      body: { error: "Data pajak tidak ditemukan untuk NOP dan tahun tersebut." },
    };
  }

  const unpaidRecords = taxRecords.filter((record) => record.paymentStatus !== "LUNAS");
  if (unpaidRecords.length === 0) {
    return {
      status: 200,
      body: {
        success: true,
        isPaid: true,
        message: "Data sudah berstatus LUNAS di sistem desa.",
      },
    };
  }

  let htmlText = "";
  try {
    const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    const response = await axios.get(buildJombangBapendaUrl(cleanNop), {
      httpsAgent,
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      validateStatus: () => true,
    });

    if (response.status !== 200) {
      return {
        status: 502,
        body: { error: "Gagal terhubung ke server Bapenda (Status HTTP tidak OK)." },
      };
    }
    
    htmlText = response.data;
  } catch (error) {
    return {
      status: 502,
      body: { error: "Server Bapenda sedang tidak dapat diakses atau offline." },
    };
  }
  const $ = cheerio.load(htmlText);

  let isLunas = false;
  let paymentDateStr = "";

  $("tr").each((_i, el) => {
    const tds = $(el).find("td");
    if (tds.length >= 10) {
      const yearStr = $(tds[0]).text().trim();
      if (yearStr === tahun.toString()) {
        const tagihanTotal = $(tds[4]).text().trim().replace(/,/g, "");
        const tglBayar = $(tds[9]).text().trim();

        if (
          tagihanTotal === "0" ||
          tagihanTotal === "0.00" ||
          (tglBayar && tglBayar.length >= 8 && tglBayar !== "-")
        ) {
          isLunas = true;
          if (tglBayar && tglBayar !== "-") {
            paymentDateStr = tglBayar;
          }
        }
      }
    }
  });

  if (isLunas) {
    const parsedTgl = paymentDateStr ? parseBapendaDate(paymentDateStr) : new Date();

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
        }),
      ),
    );

    const detailsText = `Auto-Sync Bapenda: Wajib Pajak NOP ${cleanNop} (${taxRecords[0]?.namaWp || "Seseorang"}) telah LUNAS pada ${paymentDateStr || "Bapenda"}`;

    await prisma.auditLog.create({
      data: {
        action: "PUBLIC_BAPENDA_SYNC",
        entity: "TaxData",
        details: detailsText,
      },
    });

    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });
      const targetUsers = new Set<string>();
      admins.forEach((admin) => targetUsers.add(admin.id));
      unpaidRecords.forEach((record) => {
        if (record.penarikId) targetUsers.add(record.penarikId);
      });

      if (targetUsers.size > 0) {
        const notifData = Array.from(targetUsers).map((userId) => ({
          userId,
          title: "Lunas Bapenda Otomatis",
          message: `Wajib Pajak ${taxRecords[0]?.namaWp || "N/A"} (NOP ${cleanNop}) baru saja munas via server Bapenda.`,
          type: "ACCEPTED" as const,
          link: "/admin/pajak",
        }));

        await prisma.notification.createMany({ data: notifData });
      }
    } catch (notifErr) {
      console.error("Gagal mengirim notifikasi:", notifErr);
    }

    return {
      status: 200,
      body: {
        success: true,
        isPaid: true,
        date: paymentDateStr,
        message: `Otomatis dilunaskan! Tercatat dibayar pada ${paymentDateStr || "Bapenda"}`,
      },
    };
  }

  await prisma.taxData.updateMany({
    where: { id: { in: unpaidRecords.map((record) => record.id) } },
    data: { updatedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      action: "PUBLIC_BAPENDA_CHECK",
      entity: "TaxData",
      details: `Sync Bapenda: Pengecekan status NOP ${cleanNop} (Hasil: Masih Belum Lunas)`,
    },
  });

  return {
    status: 200,
    body: {
      success: true,
      isPaid: false,
      message: `Tagihan ${tahun} masih BELUM lunas di server pusat.`,
    },
  };
}
