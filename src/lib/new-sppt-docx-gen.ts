import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle, 
  AlignmentType, 
  ImageRun, 
  PageBreak
} from "docx";

interface NewSpptData {
  pemohon: string;
  nikPemohon: string;
  telpPemohon: string;
  nomorSurat: string;
  namaKades: string;
  objekNama: string;
  objekAlamat: string;
  luasTanah: number;
  luasBangunan: number;
  villageName: string;
  districtName: string;
  regencyName: string;
  villageAddress: string;
  villageEmail: string;
  villageZip: string;
  villageLogo?: string | null;
}

export async function generateNewSpptDocx(data: NewSpptData) {
  const {
    pemohon,
    nikPemohon,
    telpPemohon,
    nomorSurat,
    namaKades,
    objekNama,
    objekAlamat,
    luasTanah,
    luasBangunan,
    villageName,
    districtName,
    regencyName,
    villageAddress,
    villageEmail,
    villageZip,
    villageLogo
  } = data;

  const year = new Date().getFullYear();
  const dateStr = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  // Helper for empty lines
  const emptyLine = (count = 1) => Array(count).fill(0).map(() => new Paragraph(""));

  // Helper for Table Cell with no border
  const noBorderCell = (text: string, width: number, isBold = false) => new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold: isBold, size: 24, font: "Times New Roman" })]
    })],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
    },
    width: { size: width, type: WidthType.PERCENTAGE }
  });

  // --- PAGE 1: SURAT PERMOHONAN ---
  const page1Content = [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 55, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              children: [
                new Paragraph({ children: [new TextRun({ text: "Lampiran : 1 (Satu) berkas", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ children: [new TextRun({ text: "Perihal : Pengajuan data/Obyek Pajak Baru atas", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ children: [new TextRun({ text: `            SPPT PBB Tahun ${year}`, size: 24, font: "Times New Roman" })] }),
              ]
            }),
            new TableCell({
              width: { size: 45, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              children: [
                new Paragraph({ children: [new TextRun({ text: "Kepada Yth.", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ children: [new TextRun({ text: "Kepala Badan Pendapatan Daerah", bold: true, size: 24, font: "Times New Roman" })] }),
                new Paragraph({ children: [new TextRun({ text: `Kabupaten ${regencyName}`, bold: true, size: 24, font: "Times New Roman" })] }),
                new Paragraph({ children: [new TextRun({ text: "di -", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ children: [new TextRun({ text: regencyName.split("").join(" "), bold: true, size: 24, font: "Times New Roman" })] }),
              ]
            })
          ]
        })
      ]
    }),
    ...emptyLine(2),
    new Paragraph({ children: [new TextRun({ text: "Yang bertanda tangan di bawah ini :", size: 24, font: "Times New Roman" })] }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      rows: [
        new TableRow({ children: [noBorderCell("Nama Wajib Pajak", 35), noBorderCell(":", 5), noBorderCell(pemohon, 60, true)] }),
        new TableRow({ children: [noBorderCell("Alamat", 35), noBorderCell(":", 5), noBorderCell(objekAlamat, 60)] }),
        new TableRow({ children: [noBorderCell("Nomor Telpon", 35), noBorderCell(":", 5), noBorderCell(telpPemohon || "-", 60)] }),
      ]
    }),
    ...emptyLine(1),
    new Paragraph({ children: [new TextRun({ text: "Dengan ini mengajukan permohonan Data Baru atas Obyek Pajak :", size: 24, font: "Times New Roman" })] }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      rows: [
        new TableRow({ children: [noBorderCell("Nama Jalan", 35), noBorderCell(":", 5), noBorderCell(objekAlamat, 60)] }),
        new TableRow({ children: [noBorderCell("Kel/Desa", 35), noBorderCell(":", 5), noBorderCell(`Desa ${villageName},`, 60)] }),
        new TableRow({ children: [noBorderCell("Kecamatan", 35), noBorderCell(":", 5), noBorderCell(districtName, 60)] }),
        new TableRow({ children: [noBorderCell("Kabupaten", 35), noBorderCell(":", 5), noBorderCell(regencyName, 60)] }),
      ]
    }),
    ...emptyLine(1),
    new Paragraph({
      alignment: AlignmentType.BOTH,
      children: [new TextRun({ text: "Karena sampai saat ini obyek pajak tersebut belum pernah dikenakan Pajak Bumi dan Bangunan (belum pernah diterbitkan SPPT PBB-nya)", size: 24, font: "Times New Roman" })]
    }),
    ...emptyLine(1),
    new Paragraph({ children: [new TextRun({ text: "Untuk kelengkapan dan proses lebih lanjut, bersama ini kami sertakan:", size: 24, font: "Times New Roman" })] }),
    ...[
      "1. Fotocopy KTP / Kartu Keluarga / Identitas lainnya *)",
      "2. SPPT dan Tanda Bukti Pembayaran (STTS) PBB tahun terakhir",
      "3. Tidak mempunyai tunggakan PBB 5 tahun terakhir (dikeluarkan oleh Dinas)",
      "4. SPOP dan LSPOP yang telah diisi dan ditandatangani",
      "5. Fotocopy salah satu surat tanah dan bangunan, antara lain:",
      "   - Sertifikat tanah",
      "   - Akta Jual Beli",
      "   - Akta Waris",
      "   - Izin Mendirikan Bangunan (IMB)",
      "6. Surat Keterangan Kepala Desa/Lurah",
    ].map(text => new Paragraph({ children: [new TextRun({ text, size: 24, font: "Times New Roman" })], indent: { left: 400 } })),
    ...emptyLine(1),
    new Paragraph({ children: [new TextRun({ text: "Demikian atas perhatiannya, kami sampaikan terima kasih.", size: 24, font: "Times New Roman" })] }),
    ...emptyLine(2),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: `${regencyName}, ${dateStr}`, size: 24, font: "Times New Roman" })]
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "Pemohon,", size: 24, font: "Times New Roman" })]
    }),
    ...emptyLine(3),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: pemohon || "................", bold: true, size: 24, font: "Times New Roman" })]
    }),
    new Paragraph({ children: [new PageBreak()] })
  ];

  // --- PAGE 2: SURAT KETERANGAN DESA ---
  let logoImage: ImageRun | null = null;
  if (villageLogo) {
      try {
          const resp = await fetch(villageLogo);
          const buf = await resp.arrayBuffer();
          logoImage = new ImageRun({
              data: buf,
              transformation: { width: 80, height: 80 },
              type: "png",
          });
      } catch (e) {
          console.warn("Docx Gen: Failed to load logo", e);
      }
  }

  const page2Content = [
    new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.DOUBLE, size: 3 }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 15, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: logoImage ? [new Paragraph({ children: [logoImage], alignment: AlignmentType.CENTER })] : []
                    }),
                    new TableCell({
                        width: { size: 85, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [
                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `PEMERINTAH KABUPATEN ${regencyName}`, bold: true, size: 26, font: "Times New Roman" })] }),
                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `KECAMATAN ${districtName}`, bold: true, size: 26, font: "Times New Roman" })] }),
                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `KANTOR DESA ${villageName}`, bold: true, size: 32, font: "Times New Roman" })] }),
                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: villageAddress, italics: true, size: 18, font: "Times New Roman" })] }),
                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `E-mail: ${villageEmail} | Kode Pos: ${villageZip}`, italics: true, size: 18, font: "Times New Roman" })] }),
                        ]
                    })
                ]
            })
        ]
    }),
    ...emptyLine(2),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "SURAT KETERANGAN", bold: true, underline: {}, size: 32, font: "Times New Roman" })]
    }),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `Nomor : ${nomorSurat || ".... / .... / .... / ...."}`, size: 24, font: "Times New Roman" })]
    }),
    ...emptyLine(2),
    new Paragraph({ children: [new TextRun({ text: "Yang bertanda tangan di bawah ini :", size: 24, font: "Times New Roman" })] }),
    new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        rows: [
            new TableRow({ children: [noBorderCell("Nama", 25), noBorderCell(":", 5), noBorderCell(namaKades || "(diisi Nama Kepala Desa)", 70, true)] }),
            new TableRow({ children: [noBorderCell("Jabatan", 25), noBorderCell(":", 5), noBorderCell(`Kepala Desa / Lurah ${villageName}`, 70)] }),
        ]
    }),
    ...emptyLine(1),
    new Paragraph({ children: [new TextRun({ text: "Menerangkan dengan sebenarnya bahwa :", size: 24, font: "Times New Roman" })] }),
    new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        rows: [
            new TableRow({ children: [noBorderCell("Nama", 25), noBorderCell(":", 5), noBorderCell(pemohon, 70, true)] }),
            new TableRow({ children: [noBorderCell("NIK", 25), noBorderCell(":", 5), noBorderCell(nikPemohon || "..............................", 70)] }),
            new TableRow({ children: [noBorderCell("Telp", 25), noBorderCell(":", 5), noBorderCell(telpPemohon || "(Nomor Telp aktif)", 70)] }),
        ]
    }),
    ...emptyLine(1),
    new Paragraph({
      children: [
        new TextRun({ text: "Mengajukan ", size: 24, font: "Times New Roman" }),
        new TextRun({ text: "penerbitan SPPT PBB baru", bold: true, size: 24, font: "Times New Roman" }),
        new TextRun({ text: " (belum pernah terbit SPPT sama sekali) dengan data sebagai berikut :", size: 24, font: "Times New Roman" }),
      ]
    }),
    ...emptyLine(1),
    new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        rows: [
            new TableRow({ children: [noBorderCell("NOP", 25), noBorderCell(":", 5), noBorderCell(": ..................................", 70)] }),
            new TableRow({ children: [noBorderCell("Nama", 25), noBorderCell(":", 5), noBorderCell(objekNama, 70, true)] }),
            new TableRow({ children: [noBorderCell("Alamat", 25), noBorderCell(":", 5), noBorderCell(objekAlamat, 70)] }),
            new TableRow({ children: [noBorderCell("Luas Tanah / Bangunan", 25), noBorderCell(":", 5), noBorderCell(`${luasTanah} m² / ${luasBangunan} m²`, 70, true)] }),
        ]
    }),
    ...emptyLine(2),
    new Paragraph({
        alignment: AlignmentType.BOTH,
        children: [new TextRun({ text: "Demikian surat ini dibuat, untuk dipergunakan sebagaimana mestinya.", size: 24, font: "Times New Roman" })]
    }),
    ...emptyLine(3),
    new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: `${villageName}, ${dateStr}`, size: 24, font: "Times New Roman" })]
    }),
    new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: `Kepala Desa ${villageName}`, size: 24, font: "Times New Roman" })]
    }),
    ...emptyLine(3),
    new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: namaKades || "................", bold: true, underline: {}, size: 24, font: "Times New Roman" })]
    }),
  ];

  const doc = new Document({
    sections: [{
      properties: {
          page: {
              margin: { top: 720, bottom: 720, left: 1000, right: 1000 },
          }
      },
      children: [...page1Content, ...page2Content],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Pengajuan_SPPT_Baru_${pemohon.replace(/\s+/g, "_")}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
