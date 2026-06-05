import type { SpopFormData } from "@/lib/spop-form";
import { esc, digits, text, formDate, splitDate, cells, opt, label, bar } from "@/lib/spop-print-helpers";
import { SPOP_PRINT_CSS } from "@/lib/spop-print-styles";


function page1(f: SpopFormData, config?: { kabupaten?: string; logoUrl?: string | null }) {
  const nop = digits(f.nop).slice(0, 18);
  const bersama = digits(f.nopBersama);
  const asal = digits(f.nopAsal);
  return `
  <section class="page">
    <div class="pno">- 1 -</div>
    <div class="head">
      <div class="head-l"><div class="logo emblem"><img src="${esc(config?.logoUrl || "/uploads/logo-desa.png")}" alt="Lambang Kabupaten ${esc(config?.kabupaten || "Jombang")}" /></div><div class="gov-wrap"><div class="gov">PEMERINTAH KABUPATEN ${esc(config?.kabupaten || "JOMBANG")}</div><div class="gov gov-sub">BADAN PENDAPATAN DAERAH</div></div></div>
      <div class="head-r"><div class="fno-box"><span>No. Formulir</span>${cells("", 2, "tiny")}${cells("", 4, "tiny")}${cells("", 3, "tiny")}</div><div class="ins-box">Selain yang diisi oleh petugas (bagian yang diarsir)<br/>diisi oleh wajib pajak<br />Beri tanda silang pada kolom yang sesuai</div></div>
    </div>
    <div class="title">SURAT PEMBERITAHUAN OBJEK PAJAK</div>
    <div class="blk">
      <div class="row">${label("1", "JENIS TRANSAKSI")}<div class="body opts" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; width: 100%;">${opt("1", "Perekaman Data", f.transactionType === "PEREKAMAN")}${opt("2", "Pemutakhiran Data", f.transactionType === "PEMUTAKHIRAN")}${opt("3", "Penghapusan Data", f.transactionType === "PENGHAPUSAN")}</div></div>
      <div class="row">${label("2", "NOP")}<div class="body" style="padding-top: 2px;"><div class="v-seg" style="border-right: 0; flex: 1;"><div class="mh"><span>PR</span><span>DT II</span><span>KEC</span><span>KEL./DES.</span><span>BLOK</span><span>NO. URUT</span><span>KODE</span></div><div class="mv">${cells(nop.slice(0, 2), 2)}${cells(nop.slice(2, 4), 2)}${cells(nop.slice(4, 7), 3)}${cells(nop.slice(7, 10), 3)}${cells(nop.slice(10, 13), 3)}${cells(nop.slice(13, 17), 4)}${cells(nop.slice(17, 18), 1)}</div></div></div></div>
      <div class="row">${label("3", "NOP BERSAMA")}<div class="body"><div class="mv">${cells(bersama.slice(0, 2), 2)}${cells(bersama.slice(2, 4), 2)}${cells(bersama.slice(4, 7), 3)}${cells(bersama.slice(7, 10), 3)}${cells(bersama.slice(10, 13), 3)}${cells(bersama.slice(13, 17), 4)}${cells(bersama.slice(17, 18), 1)}</div></div></div>
    </div>
    ${bar("A", "INFORMASI TAMBAHAN UNTUK DATA BARU")}
    <div class="blk">
      <div class="row">${label("4", "NOP ASAL")}<div class="body"><div class="mv">${cells(asal.slice(0, 2), 2)}${cells(asal.slice(2, 4), 2)}${cells(asal.slice(4, 7), 3)}${cells(asal.slice(7, 10), 3)}${cells(asal.slice(10, 13), 3)}${cells(asal.slice(13, 17), 4)}${cells(asal.slice(17, 18), 1)}</div></div></div>
      <div class="row no-border-b">${label("5", "NO. SPPT LAMA", "twoline")}<div class="body">${cells("", 4)}</div></div>
    </div>
    ${bar("B", "DATA LETAK OBJEK")}
    <div class="blk">
      <div class="r2">
        <div class="v-seg">${label("6", "NAMA JALAN")}<div class="body">${cells(text(f.namaJalanObjek), 21)}</div></div>
        <div class="v-seg side">${label("7", "NOMOR / KAV / BLOK")}<div class="body">${cells(text(f.nomorBlokObjek), 12)}</div></div>
      </div>
      <div class="r3" style="grid-template-columns: 1.5fr 0.5fr 0.5fr">
        <div class="v-seg">${label("8", "NAMA DESA / KELURAHAN")}<div class="body">${cells(text(f.desaObjek), 21)}</div></div>
        <div class="v-seg side small">${label("9", "RW")}<div class="body">${cells(digits(f.rwObjek), 2, "", "left")}</div></div>
        <div class="v-seg side small">${label("10", "RT")}<div class="body">${cells(digits(f.rtObjek), 2, "", "left")}</div></div>
      </div>
    </div>
    ${bar("C", "DATA OBJEK PAJAK")}
    <div class="blk">
      <div class="row">${label("11", "STATUS")}<div class="body opts" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; width: 100%;">${opt("1", "Pemilik", f.statusSubjek === "PEMILIK")}${opt("2", "Penyewa", f.statusSubjek === "PENYEWA")}${opt("3", "Pengelola", f.statusSubjek === "PENGELOLA")}${opt("4", "Pemakai", f.statusSubjek === "PEMAKAI")}${opt("5", "Sengketa", f.statusSubjek === "SENGKETA")}</div></div>
      <div class="row">${label("12", "PEKERJAAN")}<div class="body opts" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; width: 100%;">${opt("1", "PNS *)", f.pekerjaan === "PNS")}${opt("2", "TNI *)", f.pekerjaan === "TNI")}${opt("3", "Pensiunan *)", f.pekerjaan === "PENSIUNAN")}${opt("4", "Badan", f.pekerjaan === "BADAN")}${opt("5", "Lainnya", f.pekerjaan === "LAINNYA")}</div></div>
      <div class="r2">
        <div class="v-seg">${label("13", "NAMA SUBJEK PAJAK")}<div class="body">${cells(text(f.namaSubjekPajak), 21)}</div></div>
        <div class="v-seg side">${label("14", "NPWP")}<div class="body">${cells(digits(f.npwp), 14)}</div></div>
      </div>
      <div class="r2">
        <div class="v-seg">${label("15", "NAMA JALAN")}<div class="body">${cells(text(f.namaJalanSubjek), 21)}</div></div>
        <div class="v-seg side">${label("16", "BLOK/KAV./NOMOR")}<div class="body">${cells(text(f.blokSubjek), 12)}</div></div>
      </div>
      <div class="r3" style="grid-template-columns: 1.5fr 0.5fr 0.5fr">
        <div class="v-seg">${label("17", "KELURAHAN / DESA")}<div class="body">${cells(text(f.desaSubjek), 21)}</div></div>
        <div class="v-seg side small">${label("18", "RW")}<div class="body">${cells(digits(f.rwSubjek), 2, "", "left")}</div></div>
        <div class="v-seg side small">${label("19", "RT")}<div class="body">${cells(digits(f.rtSubjek), 2, "", "left")}</div></div>
      </div>
      <div class="r2">
        <div class="v-seg no-border-r">${label("20", "KABUPATEN / KOTA MADYA")}<div class="body">${cells(text(f.kabupaten), 8)}</div></div>
        <div class="v-seg side">${label("", "KODE POS")}<div class="body">${cells(digits(f.kodePosSubjek), 5)}</div></div>
      </div>
      <div class="row no-grid no-border-b">
        <div class="v-seg full-w">${label("21", "NOMOR KTP")}<div class="body">${cells(digits(f.nomorKtp), 16)}</div></div>
      </div>
    </div>
    ${bar("D", "DATA TANAH")}
    <div class="blk">
      <div class="r2">
        <div class="seg">${label("22", "LUAS TANAH (M2)", "twoline")}<div class="body">${cells(digits(f.luasTanah), 10, "", "right")}</div></div>
        <div class="seg side">${label("23", "ZONA NILAI TANAH")}<div class="body">${cells(text(f.zonaNilaiTanah), 3)}</div></div>
      </div>
      <div class="row nob">${label("24", "JENIS TANAH")}<div class="body opts soil">${opt("1", "Tanah+Bangunan", f.jenisTanah === "TANAH_BANGUNAN")}${opt("2", "Kav.Siap Bangun", f.jenisTanah === "KAVLING_SIAP_BANGUN")}${opt("3", "Tanah Kosong", f.jenisTanah === "TANAH_KOSONG")}${opt("4", "Fasilitas Umum", f.jenisTanah === "FASILITAS_UMUM")}</div></div>
    </div>
    <div class="foot"><span>Catatn: * ) yang penghasilannya semata - mata berasal dari gaji atau uang pensiunan</span><span>Dilanjutkan di halaman berikutnya</span></div>
  </section>`;
}

function page2(f: SpopFormData) {
  const [d, m, y] = splitDate(f.tanggalTandaTangan);
  return `
  <section class="page">
    <div class="pno">- 2 -</div>
    ${bar("E", "DATA BANGUNAN")}
    <div class="blk">
      <div class="row no-border-b" style="display: flex; align-items: center;">${label("25", "JUMLAH BANGUNAN")}<div class="body" style="padding-left: 0;">${cells("", 3, "", "right")}</div></div>
    </div>
    ${bar("F", "PERNYATAAN SUBJEK PAJAK")}
    <div class="blk">
      <div class="stmt">Saya Menyatakan bahwa informasi yang telah saya berikan dalam formulir ini termasuk lampirannya adalah benar, jelas dan dan lengkap menurut keadaan yang sebenarnya, sesuai dengan Pasal 83 ayat (2) Undang - Undang No. 28 Tahun 2009</div>
      <div class="sig3">
        <div><div class="st">26. NAMA SUBJEK PAJAK /<br />KUASANYA</div><div class="line long">${esc(text(f.namaPenandatangan))}</div></div>
        <div><div class="st">27. TANGGAL</div><div class="dt" style="justify-content: center; font-weight: 700; font-size: 13px; margin-top: 18px">${esc(`${d}/${m}/${y}`)}</div></div>
        <div><div class="st">28. TANDA TANGAN</div><div class="line"></div></div>
      </div>
      <div class="notes"><div>- Dalam Hal bertindak selaku Kuasa, Surat Kuasa harap dilampirkan</div><div>- Dalam Hal Subjek Pajak mendatarkan diri sendiri Objek Pajak supaya menggambarkan Sket / Denah Lokasi Objek Pajak</div><div>- Batas waktu pengembalian SPOP 30 (tiga puluh) hari sejak diterima oleh Subyek Pajak sesuai Pasal 83 ayat (2) Undang - Undang No. 28 Tahun 2009</div></div>
    </div>
    ${bar("G", "IDENTITAS PENDATA / PEJABAT YG BERWENANG")}
    <div class="blk idb">
      <div class="col"><div class="ct">PETUGAS PENDATA</div><div class="idr"><span>29. TANGGAL (TGL/BLN/THN)</span><div class="dt">${cells(d, 2)} / ${cells(m, 2)} / ${cells(y, 4)}</div></div><div class="lf"><span>30. TANDA TANGAN</span><div class="lv"></div></div><div class="lf"><span>31. NAMA JELAS</span><div class="lv">${esc(text(f.petugasPendata))}</div></div><div class="lf"><span>32. NIP</span><div class="lv">${esc(digits(f.nipPetugasPendata))}</div></div></div>
      <div class="col"><div class="ct">MENGETAHUI PEJABAT YG BERWENANG</div><div class="idr"><span>29. TANGGAL (TGL/BLN/THN)</span><div class="dt">${cells(d, 2)} / ${cells(m, 2)} / ${cells(y, 4)}</div></div><div class="lf"><span>30. TANDA TANGAN</span><div class="lv"></div></div><div class="lf"><span>31. NAMA JELAS</span><div class="lv">${esc(text(f.pejabatBerwenang))}</div></div><div class="lf"><span>32. NIP</span><div class="lv">${esc(digits(f.nipPejabatBerwenang))}</div></div></div>
    </div>
    <div class="title">SKET / DENAH LOKASI OBJEK PAJAK</div>
    <div class="sketch">
      ${f.sketImage ? `<img src="${f.sketImage}" style="width: 100%; height: 100%; object-fit: contain; display: block;" />` : ""}
      <div class="north"><div>U</div><div class="arr dark"></div></div>
    </div>
    <div class="guides">
      <div><div class="gt">KETERANGAN</div><div>- Gambarkan sket / denah lokasi objek pajak (tanpa skala) yang dihubungkan dengan jalan raya / protokol, jalan lingkungan dan lain-lain yang sudah diketahui umum</div><div>- Sebutkan batas - batas kepemilikan sebelah utara, selatan, timur dan barat</div></div>
      <div><div class="gt">CONTOH PENGGAMBARAN</div><div class="ex"><div class="rh t">Jl. Seroja</div><div class="rh m">SAIM</div><div class="rv l"></div><div class="rv r"></div><div class="b b1">UCUP</div><div class="b b2">SAKLIS</div><div class="b b3">ANAM</div><div class="nu"><div>U</div><div class="arr dark"></div></div></div></div>
    </div>
  </section>`;
}

function page3(f: SpopFormData) {
  const nop = digits(f.nop).slice(0, 18);
  return `
  <section class="page">
    <div class="pno">- 3 -</div>
    <div class="lshead"><div class="lst">LAMPIRAN SURAT PEMBERITAHUAN OBJEK PAJAK</div><div class="fno-box" style="margin-bottom: 0;"><span>No. Formulir</span>${cells("", 2, "tiny")}${cells("", 4, "tiny")}${cells("", 3, "tiny")}</div></div>
    <div class="blk">
      <div class="row">${label("1", "JENIS TRANSAKSI", "twoline")}<div class="body opts" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; width: 100%;">${opt("1", "Perekaman Data", f.transactionType === "PEREKAMAN")}${opt("2", "Pemutakhiran Data", f.transactionType === "PEMUTAKHIRAN")}${opt("3", "Penghapusan Data", f.transactionType === "PENGHAPUSAN")}${opt("4", "Penilaian Individual", false)}</div></div>
      <div class="r2 no-grid" style="grid-template-columns: 1.4fr 0.6fr; display: grid;">
        <div class="row" style="border-bottom: 0;">${label("2", "NOP")}<div class="body" style="padding-top: 2px;"><div class="v-seg" style="border-right: 0; flex: 1;"><div class="mh"><span>PR</span><span>DT II</span><span>KEC</span><span>KEL./DES.</span><span>BLOK</span><span>NO. URUT</span><span>KODE</span></div><div class="mv">${cells(nop.slice(0, 2), 2)}${cells(nop.slice(2, 4), 2)}${cells(nop.slice(4, 7), 3)}${cells(nop.slice(7, 10), 3)}${cells(nop.slice(10, 13), 3)}${cells(nop.slice(13, 17), 4)}${cells(nop.slice(17, 18), 1)}</div></div></div></div>
        <div class="side-blk" style="display: flex; flex-direction: column; height: 100%; border-bottom: 0;"><div class="flex-row" style="border-bottom: 1px solid #222; padding: 4px 6px; flex: 1; white-space: nowrap;">${label("3", "JUMLAH BANGUNAN")}${cells(digits(f.jumlahBangunan), 3, "", "right")}</div><div class="flex-row" style="padding: 4px 6px; flex: 1; white-space: nowrap;">${label("4", "BANGUNAN KE")}${cells("1", 2, "", "right")}</div></div>
      </div>
      ${bar("A", "RINCIAN DATA BANGUNAN")}
      <div class="row">
        ${label("5", "JENIS PENGGUNAAN BANGUNAN", "twoline")}
        <div class="body wr g3">
          ${opt("1", "Perumahan", f.jenisBangunan === "PERUMAHAN")}
          ${opt("2", "Perkantoran", f.jenisBangunan === "PERKANTORAN")}
          ${opt("3", "Pabrik", f.jenisBangunan === "PABRIK")}
          ${opt("4", "Toko/Apotik/Pasar/Ruko", f.jenisBangunan === "TOKO")}
          ${opt("5", "Rumah Sakit/Klinik", f.jenisBangunan === "RUMAH_SAKIT")}
          ${opt("6", "Olah Raga/Rekreasi", f.jenisBangunan === "OLAHRAGA")}
          ${opt("7", "Hotel/Wisma", f.jenisBangunan === "HOTEL")}
          ${opt("8", "Bengkel/Gedung/Pertanian", f.jenisBangunan === "BENGKEL")}
          ${opt("9", "Gedung Pemerintah", f.jenisBangunan === "GEDUNG_PEMERINTAH")}
          ${opt("10", "Lain-lain", f.jenisBangunan === "LAINNYA")}
          ${opt("11", "Bangunan Tidak Kena Pajak", f.jenisBangunan === "BANGUNAN_TIDAK_KENA_PAJAK")}
          ${opt("12", "Bangun Parkir", f.jenisBangunan === "BANGUN_PARKIR")}
          ${opt("13", "Apartemen", f.jenisBangunan === "APARTEMEN")}
          ${opt("14", "Pompa Bensin", f.jenisBangunan === "POMPA_BENSIN")}
          ${opt("15", "Tangki Minyak", f.jenisBangunan === "TANGKI_MINYAK")}
          ${opt("16", "Gedung Sekolah", f.jenisBangunan === "GEDUNG_SEKOLAH")}
        </div>
      </div>
      <div class="g2 border-b">
        <div class="it pad" style="display: flex; align-items: center; gap: 8px;"><span>6. LUAS BANGUNAN (M2)</span> ${cells(digits(f.luasBangunan), 9, "", "right")}</div>
        <div class="it pad side" style="display: flex; align-items: center; gap: 8px;"><span>7. JUMLAH LANTAI</span> ${cells(digits(f.jumlahLantai), 3, "", "right")}</div>
      </div>
      <div class="row border-b">${label("8", "TAHUN DIBANGUN")}<div class="body">${cells(digits(f.tahunDibangun), 4)}</div></div>
      <div class="g2 border-b" style="grid-template-columns: 1fr 1.5fr;">
        <div class="it pad" style="display: flex; align-items: center; gap: 8px;"><span>9. TAHUN DIRENOVASI</span> ${cells(digits(f.tahunRenovasi), 4)}</div>
        <div class="it pad side" style="display: flex; align-items: center; gap: 8px;"><span>10. DAYA LISTRIK TERPASANG WATT</span> <div style="display: flex; align-items: center;">${cells(digits(f.dayaListrik), 7, "", "right")}<div class="cell" style="width: 40px; border-left: 0;">WATT</div></div></div>
      </div>
      <div class="row border-b">${label("11", "KONDISI PADA\nUMUMNYA", "twoline")}<div class="body opts" style="gap: 16px;">${opt("1", "Sangat Baik", f.kondisi === "SANGAT_BAIK")}${opt("2", "Baik", f.kondisi === "BAIK")}${opt("3", "Sedang", f.kondisi === "SEDANG")}${opt("4", "Jelek", f.kondisi === "JELEK")}</div></div>
      <div class="row border-b">${label("12", "KONSTRUKSI")}<div class="body opts" style="gap: 16px;">${opt("1", "Baja", f.konstruksi === "BAJA")}${opt("2", "Beton", f.konstruksi === "BETON")}${opt("3", "Batu Bata", f.konstruksi === "BATU_BATA")}${opt("4", "Kayu", f.konstruksi === "KAYU")}</div></div>
      <div class="row border-b">${label("13", "ATAP")}<div class="body opts" style="gap: 12px;">${opt("1", "Decrabon/Beton", f.atap === "DECRABON" || f.atap === "GENTENG_BETON")}${opt("2", "Gtg Beton", f.atap === "GENTENG_BETON")}${opt("3", "Gtg Biasa/Sirap", f.atap === "GENTENG_BIASA")}${opt("4", "Asbes", f.atap === "ASBES")}${opt("5", "Seng", f.atap === "SENG")}</div></div>
      <div class="row border-b">${label("14", "DINDING")}<div class="body opts" style="gap: 8px;">${opt("1", "Kaca/Alumunium", f.dinding === "KACA")}${opt("2", "Beton", f.dinding === "BETON")}${opt("3", "Bata/Conblok", f.dinding === "BATA")}${opt("4", "Kayu", f.dinding === "KAYU")}${opt("5", "Seng", f.dinding === "SENG")}${opt("6", "Tdk ada Dinding", f.dinding === "TANPA_DINDING")}</div></div>
      <div class="row border-b">${label("15", "LANTAI")}<div class="body opts" style="gap: 12px;">${opt("1", "Marmer", f.lantai === "MARMER")}${opt("2", "Keramik", f.lantai === "KERAMIK")}${opt("3", "Teraso", f.lantai === "TERASO")}${opt("4", "Ubin PC/Papan", f.lantai === "UBIN")}${opt("5", "Semen", f.lantai === "SEMEN")}</div></div>
      <div class="row border-b">${label("16", "LANGIT - LANGIT")}<div class="body opts" style="gap: 16px;">${opt("1", "Akustik/Jati", f.langitLangit === "AKUSTIK")}${opt("2", "Triplek/Asbes/Bambu", f.langitLangit === "TRIPLEK")}${opt("3", "Tidak ada", f.langitLangit === "TANPA_LANGIT")}</div></div>
      ${bar("B", "FASILITAS")}
      <div class="g2 border-b">
        <div class="it pad" style="display: flex; align-items: center; gap: 8px;"><span>17. JUMLAH AC</span> <div style="display: flex; align-items: center; gap: 4px;">${cells("", 2)} Split ${cells("", 2)} Window</div></div>
        <div class="it pad side" style="display: flex; align-items: center; gap: 8px;"><span>18. AC SENTRAL</span> <div class="opts" style="margin-left: 0;">${opt("1", "Ada", false)}${opt("2", "Tidak Ada", false)}</div></div>
      </div>
      <div class="g2 border-b">
        <div class="it pad"><div style="display: grid; grid-template-columns: 180px 1fr; align-items: center; margin-bottom: 5px;"><span>19. LUAS KOLAM RENANG (M2)</span>${cells("", 4)}</div> <div class="opts" style="gap: 12px; margin-left: 0;">${opt("1", "Diplester", false)}${opt("2", "Dengan Pelapis", false)}</div></div>
        <div class="it pad side">20. LUAS PERKERASAN HALAMAN (M2)
          <div class="body stack" style="margin-top: 5px">
            <div class="row no-border-b no-grid no-gap">${cells("", 4)} Ringan &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${cells("", 4)} Berat</div>
            <div class="row no-border-b no-grid no-gap">${cells("", 4)} Sedang &nbsp;&nbsp;&nbsp;&nbsp; ${cells("", 4)} Dgn Penutup Lantai</div>
          </div>
        </div>
      </div>
      <div class="g2 border-b">
        <div class="it pad">
          <div class="v-seg no-border-b" style="min-height: 0">
            <div style="font-size: 12px; margin-bottom: 5px;">21. JUMLAH LAPANGAN TENIS</div>
            <table class="grid-table" style="width: auto; gap: 20px;">
              <tr>
                <td style="width: 100px;"></td>
                <td style="text-align: center; padding-bottom: 4px;">Dengan Lampu</td>
                <td style="text-align: center; padding-bottom: 4px; padding-left: 20px;">Tanpa Lampu</td>
              </tr>
              <tr><td>Beton</td><td style="text-align: center;">${cells("", 2)}</td><td style="text-align: center; padding-left: 20px;">${cells("", 2)}</td></tr>
              <tr><td>Aspal/Tanah Liat</td><td style="text-align: center;">${cells("", 2)}</td><td style="text-align: center; padding-left: 20px;">${cells("", 2)}</td></tr>
              <tr><td>Rumput</td><td style="text-align: center;">${cells("", 2)}</td><td style="text-align: center; padding-left: 20px;">${cells("", 2)}</td></tr>
            </table>
          </div>
        </div>
        <div class="it pad side">
          <div class="g2 no-grid" style="grid-template-columns: 1fr 1fr; border-bottom: 0">
            <div class="v-seg no-border-b no-border-r">
              <div style="font-size: 11px; margin-bottom: 5px">22. JUMLAH LIFT</div>
              <div class="body stack no-gap" style="gap: 2px;">
                <div>${cells("", 2)} Penumpang</div>
                <div>${cells("", 2)} Kapsul</div>
                <div>${cells("", 2)} Barang</div>
              </div>
            </div>
            <div class="v-seg no-border-b no-border-r">
              <div style="font-size: 11px; margin-bottom: 5px">23. JUMLAH TANGGA BERJALAN</div>
              <div class="body stack no-gap" style="gap: 2px;">
                <div>Lebar < 0,80 M ${cells("", 2)}</div>
                <div>Lebar > 0,80 M ${cells("", 2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="g2 border-b">
        <div class="it pad">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 12px;">24. PANJANG PAGAR</span> ${cells("", 4)} <span style="font-size: 12px;">Meter</span>
          </div>
          <div class="opts" style="gap: 12px; margin-left: 0;">
            ${opt("1", "Baja / Besi", false)}${opt("2", "Bata / Batako", false)}
          </div>
        </div>
        <div class="it pad side no-border-b">
          <div style="margin-bottom: 4px; font-size: 11px;">25. PEMADAM KEBAKARAN</div>
          <table class="grid-table" style="margin-left: -4px">
            <tr><td>${opt("1", "Hydrant", false)}</td><td>${opt("1", "Ada", false)}</td><td>${opt("2", "Tidak Ada", false)}</td></tr>
            <tr><td>${opt("2", "Sprinkler", false)}</td><td>${opt("1", "Ada", false)}</td><td>${opt("2", "Tidak Ada", false)}</td></tr>
            <tr><td>${opt("3", "Fire Alarm", false)}</td><td>${opt("1", "Ada", false)}</td><td>${opt("2", "Tidak Ada", false)}</td></tr>
          </table>
        </div>
      </div>
      <div class="g2">
        <div class="it pad">26. JUMLAH SALURAN PES PABX<div class="body" style="margin-top: 5px">${cells("", 5)}</div></div>
        <div class="it pad side">27. KEDALAMAN SUMUR ARTESIS (M)<div class="body" style="margin-top: 5px">${cells("", 5)}</div></div>
      </div>
    </div>
  </section>`;
}

function page4(f: SpopFormData) {
  return `
  <section class="page">
    <div class="pno">- 4 -</div>
    ${bar("C", "DATA TAMBAHAN UNTUK JPB = 3/8")}
    <div class="blk compact" style="padding: 5px 6px;">
      <div class="opt" style="font-size: 11px; margin-bottom: 8px;">
        <div class="cb">${f.jenisBangunan === "PABRIK" || f.jenisBangunan === "BENGKEL" ? "X" : ""}</div> PABRIK / BENGKEL/GUDANG/PERTANIAN (JPB=3/8)
      </div>
      <div style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 6px 12px;">
         <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 135px; line-height: 1.1">28. TINGGI KOLOM (M)</div> ${cells("", 2)}
         </div>
         <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 145px; line-height: 1.1">29. LEBAR BENTENG (M)</div> ${cells("", 2)}
         </div>
         <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 135px; line-height: 1.1">30. DAYA DUKUNG<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;LANTAI (kg/M2)</div> ${cells("", 4)}
         </div>
         <div style="display: flex; align-items: center; gap: 8px; grid-column: span 1 / span 1;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 145px; line-height: 1.1">31. KELILING DINDING (M)</div> ${cells("", 4)}
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-left: 20px;">
              <div style="width: 145px; line-height: 1.1">32. LUAS MEZZANINE (M2)</div> ${cells("", 5)}
            </div>
         </div>
      </div>
    </div>
    ${bar("D", "DATA TAMBAHAN UNTUK BANGUNAN NON - STANDAR")}
    <div class="blk compact ns">
      <div class="nr">
        <div class="nl" style="display: flex; align-items: center; gap: 8px;">
          <div class="cb">${f.jenisBangunan === "PERKANTORAN" || f.jenisBangunan === "GEDUNG_PEMERINTAH" ? "X" : ""}</div> PERKANTORAN / SWASTA / GEDUNG PEMERINTAH (JPB-2/9)
        </div>
        <div class="wr">${label("33", "KELAS BANGUNAN")}${opt("1", "Kelas 1", false)}${opt("2", "Kelas 2", false)}${opt("3", "Kelas 3", false)}${opt("4", "Kelas 4", false)}</div>
      </div>
      <div class="nr">
        <div class="nl" style="display: flex; align-items: center; gap: 8px;">
          <div class="cb">${f.jenisBangunan === "TOKO" ? "X" : ""}</div> TOKO/APOTIK/PASAR/RUKO (JPB-4)
        </div>
        <div class="wr">${label("34", "KELAS BANGUNAN")}${opt("1", "Kelas 1", false)}${opt("2", "Kelas 2", false)}${opt("3", "Kelas 3", false)}${opt("4", "Kelas 4", false)}</div>
      </div>
      <div class="nr">
        <div class="nl" style="display: flex; align-items: center; gap: 8px;">
          <div class="cb">${f.jenisBangunan === "RUMAH_SAKIT" ? "X" : ""}</div> RUMAH SAKIT/KLINIK (JPB-5)
        </div>
        <div class="wr">${label("35", "KELAS BANGUNAN")}${opt("1", "Kelas 1", false)}${opt("2", "Kelas 2", false)}${opt("3", "Kelas 3", false)}${opt("4", "Kelas 4", false)}</div>
        <div class="extra" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap;"><span>36. LUAS KAMAR DNGN AC SENTRAL (M2)</span> ${cells("", 6)}</div>
          <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap;"><span>37. LUAS LAIN DNGN AC SENTRAL (M2)</span> ${cells("", 6)}</div>
        </div>
      </div>
      <div class="nr">
        <div class="nl" style="display: flex; align-items: center; gap: 8px;">
          <div class="cb">${f.jenisBangunan === "OLAHRAGA" ? "X" : ""}</div> OLAH RAGA / REKREASI (JPB-6)
        </div>
        <div class="wr">${label("38", "KELAS BANGUNAN")}${opt("1", "Kelas 1", false)}${opt("2", "Kelas 2", false)}</div>
      </div>
      <div class="nr">
        <div class="nl" style="display: flex; align-items: center; gap: 8px;">
          <div class="cb">${f.jenisBangunan === "HOTEL" ? "X" : ""}</div> HOTEL / WISMA (JPB-7)
        </div>
        <div class="wr">${label("39", "JENIS HOTEL")}${opt("1", "Non Resort", false)}${opt("2", "Resort", false)}</div>
        <div class="wr">${label("40", "JML BINTANG")}${opt("1", "Bintang 5", false)}${opt("2", "Bintang 4", false)}${opt("3", "Bintang 3", false)}${opt("4", "Bintang 1-2", false)}${opt("5", "Non Bintang", false)}</div>
        <div class="extra" style="display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 8px;">
          <div style="display: flex; flex-direction: column; gap: 2px;">${label("41", "JML KAMAR")} ${cells("", 4)}</div>
          <div style="display: flex; flex-direction: column; gap: 2px;">${label("42", "LUAS APT DGN AC SENTRAL (M2)")} ${cells("", 6)}</div>
          <div style="display: flex; flex-direction: column; gap: 2px;">${label("43", "LUAS RUANG LAIN DGN AC SENTRAL (M2)")} ${cells("", 6)}</div>
        </div>
      </div>
      <div class="nr">
        <div class="nl" style="display: flex; align-items: center; gap: 8px;">
          <div class="cb">${f.jenisBangunan === "BANGUN_PARKIR" ? "X" : ""}</div> BANGUNAN PARKIR (JPB - 12)
        </div>
        <div class="wr">${label("44", "TIPE BANGUNAN")}${opt("1", "Tipe 4", false)}${opt("2", "Tipe 3", false)}${opt("3", "Tipe 2", false)}${opt("4", "Tipe 1", false)}</div>
      </div>
      <div class="nr">
        <div class="nl" style="display: flex; align-items: center; gap: 8px;">
          <div class="cb">${f.jenisBangunan === "APARTEMEN" ? "X" : ""}</div> APARTEMEN (JPB=13)
        </div>
        <div class="wr">${label("45", "KELAS BANGUNAN")}${opt("1", "Kelas 1", false)}${opt("2", "Kelas 2", false)}${opt("3", "Kelas 3", false)}${opt("4", "Kelas 4", false)}</div>
        <div class="extra" style="display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 8px;">
          <div style="display: flex; flex-direction: column; gap: 2px;">${label("46", "JML APARTEMEN")} ${cells("", 4)}</div>
          <div style="display: flex; flex-direction: column; gap: 2px;">${label("47", "LUAS KMR DG AC SENTRAL (M2)")} ${cells("", 6)}</div>
          <div style="display: flex; flex-direction: column; gap: 2px;">${label("48", "LUAS RUANG LAIN DGN AC SENTRAL (M2)")} ${cells("", 6)}</div>
        </div>
      </div>
      <div class="nr">
        <div class="nl" style="display: flex; align-items: center; gap: 8px;">
          <div class="cb">${f.jenisBangunan === "TANGKI_MINYAK" ? "X" : ""}</div> TANGKI MINYAK (JPB=15)
        </div>
        <div class="wr">${label("49", "KAPASITAS TANGKI (M3)")} ${cells("", 6)}</div>
        <div class="wr">${label("50", "LETAK TANGKI")}${opt("1", "Di Atas Tanah", false)}${opt("2", "Di Bawah Tanah", false)}</div>
      </div>
      <div class="nr">
        <div class="nl" style="display: flex; align-items: center; gap: 8px;">
          <div class="cb">${f.jenisBangunan === "GEDUNG_SEKOLAH" ? "X" : ""}</div> GEDUNG SEKOLAH (JPB-16)
        </div>
        <div class="wr">${label("51", "KELAS BANGUNAN")}${opt("1", "Kelas 1", false)}${opt("2", "Kelas 2", false)}</div>
      </div>
    </div>
    ${bar("E", "PENILAIAN INDIVIDUAL ( X 1000 Rp. )")}
    <div class="blk compact"><div class="g2"><div class="it pad" style="display: flex; align-items: center; gap: 8px;"><span>52. NILAI SISTEM</span> ${cells("", 10)}</div><div class="it pad side" style="display: flex; align-items: center; gap: 8px;"><span>53. NILAI INDIVIDUAL</span> ${cells("", 10)}</div></div></div>
    ${bar("F", "IDENTITAS PENDATA / PEJABAT YANG BERWENANG")}
    <div class="blk idb"><div class="col"><div class="ct">PETUGAS PENDATA</div><div class="idr"><span>54. TGL. KUNJUNGAN KEMBALI</span><div class="dt">${cells("", 2)} / ${cells("", 2)} / ${cells("", 4)}</div></div><div class="lf"><span>55. TGL. PENDATAAN</span><div class="lv"></div></div><div class="lf"><span>56. TANDA TANGAN</span><div class="lv"></div></div><div class="lf"><span>57. NAMA JELAS</span><div class="lv"></div></div><div class="lf"><span>58. NIP</span><div class="lv"></div></div></div><div class="col"><div class="ct">PEJABAT YANG BERWENANG</div><div class="idr"><span>59. TGL. PENELITIAN</span><div class="dt">${cells("", 2)} / ${cells("", 2)} / ${cells("", 4)}</div></div><div class="lf"><span>56. TANDA TANGAN</span><div class="lv"></div></div><div class="lf"><span>57. NAMA JELAS</span><div class="lv"></div></div><div class="lf"><span>58. NIP.</span><div class="lv"></div></div></div></div>
  </section>`;
}

export function buildSpopPrintHtml(form: SpopFormData, config?: { kabupaten?: string; logoUrl?: string | null }) {
  const isTanahKosong = form.jenisTanah === "TANAH_KOSONG";
  
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>SPOP / LSPOP</title><style>
  ${SPOP_PRINT_CSS}
  </style></head><body><div class="doc">${page1(form, config)}${page2(form)}${!isTanahKosong ? page3(form) + page4(form) : ""}</div></body></html>`;
}

