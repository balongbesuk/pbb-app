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
  Header, 
  Footer, 
  ImageRun, 
  VerticalAlign,
  PageBreak,
  ExternalHyperlink
} from "docx";

interface SpptData {
  nop: string;
  namaWp: string;
  alamat: string;
  luasTanah: number;
  luasBangunan: number;
}

interface MutationData {
  dasar: string;
  pemohon: string;
  nikPemohon: string;
  nomorSurat: string;
  namaKades: string;
  oldData: SpptData;
  newDataList: SpptData[];
  luasSebenarnya: string;
  sisa: string;
  villageName: string;
  districtName: string;
  regencyName: string;
  villageAddress: string;
  villageEmail: string;
  villageZip: string;
  villageLogo?: string | null;
}

export async function generateMutationDocx(data: MutationData) {
  const {
    dasar,
    pemohon,
    nikPemohon,
    nomorSurat,
    namaKades,
    oldData,
    newDataList,
    luasSebenarnya,
    sisa,
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
                new Paragraph({ children: [new TextRun({ text: "Perihal : Perubahan Mutasi/Pemecahan", size: 24, font: "Times New Roman" })] }),
                new Paragraph({ children: [new TextRun({ text: `            Objek/Subjek PBB Tahun ${year}`, size: 24, font: "Times New Roman" })] }),
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
    new Paragraph({
      alignment: AlignmentType.BOTH,
      children: [
        new TextRun({ text: "      Sehubungan dengan terjadinya: ", size: 24, font: "Times New Roman" }),
        new TextRun({ text: dasar.replace("_", " "), bold: true, underline: {}, italics: true, size: 24, font: "Times New Roman" }),
        new TextRun({ text: " ... ", size: 24, font: "Times New Roman" }),
        new TextRun({ text: oldData.namaWp, bold: true, underline: {}, italics: true, size: 24, font: "Times New Roman" }),
        new TextRun({ text: " ... *), kami mohon untuk diadakan perubahan data Objek/Subjek PBB sebagai berikut:", size: 24, font: "Times New Roman" }),
      ]
    }),
    new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Lama:", bold: true, size: 24, font: "Times New Roman" })] }),
    new Table({
        width: { size: 90, type: WidthType.PERCENTAGE },
        indent: { size: 400, type: WidthType.DXA },
        borders: { insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        rows: [
            new TableRow({ children: [noBorderCell("1. NOP SPPT", 35), noBorderCell(":", 5), noBorderCell(oldData.nop, 60, true)] }),
            new TableRow({ children: [noBorderCell("   Nama Wajib Pajak", 35), noBorderCell(":", 5), noBorderCell(oldData.namaWp, 60, true)] }),
            new TableRow({ children: [noBorderCell("   Alamat", 35), noBorderCell(":", 5), noBorderCell(oldData.alamat, 60)] }),
            new TableRow({ children: [noBorderCell("   Luas Tanah", 35), noBorderCell(":", 5), noBorderCell(`${oldData.luasTanah} m²`, 60, true)] }),
            new TableRow({ children: [noBorderCell("   Luas Bangunan", 35), noBorderCell(":", 5), noBorderCell(`${oldData.luasBangunan} m²`, 60, true)] }),
        ]
    }),
    new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Baru:", bold: true, size: 24, font: "Times New Roman" })] }),
    ...newDataList.map((item, idx) => new Table({
        width: { size: 90, type: WidthType.PERCENTAGE },
        indent: { size: 400, type: WidthType.DXA },
        borders: { insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        rows: [
            new TableRow({ children: [noBorderCell(`${idx + 1}. NOP SPPT`, 35), noBorderCell(":", 5), noBorderCell(item.nop || "-", 60, true)] }),
            new TableRow({ children: [noBorderCell("   Nama Wajib Pajak", 35), noBorderCell(":", 5), noBorderCell(item.namaWp || "................", 60, true)] }),
            new TableRow({ children: [noBorderCell("   Alamat", 35), noBorderCell(":", 5), noBorderCell(item.alamat || "................", 60)] }),
            new TableRow({ children: [noBorderCell("   Luas Tanah", 35), noBorderCell(":", 5), noBorderCell(`${item.luasTanah || "...."} m²`, 60, true)] }),
            new TableRow({ children: [noBorderCell("   Luas Bangunan", 35), noBorderCell(":", 5), noBorderCell(`${item.luasBangunan || "...."} m²`, 60, true)] }),
        ]
    })),
    new Paragraph({
        spacing: { before: 400 },
        children: [
            new TextRun({ text: `Luas Tanah dan Bangunan sebenarnya saat ini: ${luasSebenarnya || "........ m²"}, dan saat ini sisa: `, bold: true, size: 24, font: "Times New Roman" }),
            new TextRun({ text: sisa || "HABIS", bold: true, underline: {}, size: 24, font: "Times New Roman" }),
            new TextRun({ text: ".", bold: true, size: 24, font: "Times New Roman" }),
        ]
    }),
    new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Untuk kelengkapan dan proses lebih lanjut, bersama ini kami sertakan:", size: 24, font: "Times New Roman" })] }),
    ...[
        "1. Fotocopy KTP / Kartu Keluarga / Identitas lainnya *)",
        "2. SPPT dan Tanda Bukti Pembayaran (STTS) PBB tahun terakhir",
        "3. Tidak mempunyai tunggakan PBB 5 tahun terakhir (dikeluarkan oleh Dinas)",
        "4. SPOP dan LSPOP yang telah diisi dan ditandatangani",
        "5. Fotocopy salah satu surat tanah dan bangunan (SHM/AJB/IMB/Waris)",
        "6. Alas hak tanah / Akta Jual Beli / Surat Hibah / Surat Tanah *)",
        "7. KTP dan KK pihak-pihak terkait *)",
    ].map(text => new Paragraph({ children: [new TextRun({ text, size: 24, font: "Times New Roman" })], indent: { left: 400 } })),
    ...emptyLine(2),
    new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: `${villageName}, ${dateStr}`, size: 24, font: "Times New Roman" })]
    }),
    new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "Hormat kami,", size: 24, font: "Times New Roman" })]
    }),
    ...emptyLine(3),
    new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: pemohon || "................", bold: true, underline: {}, size: 24, font: "Times New Roman" })]
    }),
    new Paragraph({ children: [new PageBreak()] })
  ];

  // --- PAGE 2: SURAT KETERANGAN DESA ---
  
  // Create Kop
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
    new Paragraph({
        alignment: AlignmentType.BOTH,
        children: [
            new TextRun({ text: `      Yang bertanda tangan di bawah ini, kami Kepala Desa ${villageName}, Kecamatan ${districtName}, Kabupaten ${regencyName}, menerangkan dengan sebenarnya bahwa:`, size: 24, font: "Times New Roman" })
        ]
    }),
    new Paragraph({ spacing: { before: 200 }, children: [
        new TextRun({ text: "      Nama", size: 24, font: "Times New Roman" }),
        new TextRun({ text: `             : ${pemohon || ".........."}`, bold: true, size: 24, font: "Times New Roman" })
    ]}),
    new Paragraph({ children: [
        new TextRun({ text: "      NIK", size: 24, font: "Times New Roman" }),
        new TextRun({ text: `               : ${nikPemohon || ".........."}`, size: 24, font: "Times New Roman" })
    ]}),
    ...emptyLine(1),
    new Paragraph({ children: [new TextRun({ text: "Mengajukan Perubahan SPPT PBB (Pemecahan) sebagai berikut:", size: 24, font: "Times New Roman" })] }),
    new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Lama:", bold: true, size: 24, font: "Times New Roman" })] }),
    new Table({
        width: { size: 90, type: WidthType.PERCENTAGE },
        indent: { size: 400, type: WidthType.DXA },
        borders: { insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        rows: [
            new TableRow({ children: [noBorderCell("1. NOP SPPT", 35), noBorderCell(":", 5), noBorderCell(oldData.nop, 60, true)] }),
            new TableRow({ children: [noBorderCell("   Nama Wajib Pajak", 35), noBorderCell(":", 5), noBorderCell(oldData.namaWp, 60, true)] }),
            new TableRow({ children: [noBorderCell("   Alamat", 35), noBorderCell(":", 5), noBorderCell(oldData.alamat, 60)] }),
            new TableRow({ children: [noBorderCell("   Luas Tanah", 35), noBorderCell(":", 5), noBorderCell(`${oldData.luasTanah} m²`, 60, true)] }),
            new TableRow({ children: [noBorderCell("   Luas Bangunan", 35), noBorderCell(":", 5), noBorderCell(`${oldData.luasBangunan} m²`, 60, true)] }),
        ]
    }),
    new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Baru:", bold: true, size: 24, font: "Times New Roman" })] }),
    ...newDataList.map((item, idx) => new Table({
        width: { size: 90, type: WidthType.PERCENTAGE },
        indent: { size: 400, type: WidthType.DXA },
        borders: { insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        rows: [
            new TableRow({ children: [noBorderCell(`${idx + 1}. NOP SPPT`, 35), noBorderCell(":", 5), noBorderCell(item.nop || "-", 60, true)] }),
            new TableRow({ children: [noBorderCell("   Nama Wajib Pajak", 35), noBorderCell(":", 5), noBorderCell(item.namaWp || "................", 60, true)] }),
            new TableRow({ children: [noBorderCell("   Alamat", 35), noBorderCell(":", 5), noBorderCell(item.alamat || "................", 60)] }),
            new TableRow({ children: [noBorderCell("   Luas Tanah", 35), noBorderCell(":", 5), noBorderCell(`${item.luasTanah || "...."} m²`, 60, true)] }),
            new TableRow({ children: [noBorderCell("   Luas Bangunan", 35), noBorderCell(":", 5), noBorderCell(`${item.luasBangunan || "...."} m²`, 60, true)] }),
        ]
    })),
    ...emptyLine(2),
    new Paragraph({
        alignment: AlignmentType.BOTH,
        children: [new TextRun({ text: "      Demikian Surat Keterangan ini kami buat dengan sebenarnya untuk dapat dipergunakan sebagai dasar penetapan PBB bagi yang bersangkutan sesuai keadaan saat ini.", size: 24, font: "Times New Roman" })]
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
  link.download = `Mutasi_PBB_${pemohon.replace(/\s+/g, "_")}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
