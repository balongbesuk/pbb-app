# 📂 Panduan Arsip Digital PBB & Smart Scan

Modul **Arsip Digital PBB** dibuat untuk mempermudah digitalisasi E-SPPT atau dokumen PDF pendukung pajak warga. Dilengkapi dengan teknologi pemilahan cerdas (*Smart Scan*) dan kompresi massal berbasis *WebAssembly* (WASM) yang membuat pemrosesan ribuan file ringan bagi server.

---

## 🚀 1. Fitur Utama

1. **Upload & Pemilahan Cepat (Smart Scan):**
   Mampu menerima file PDF berukuran "gajah" (bundel yang berisi ratusan atau ribuan halaman) dan secara instan dipecah menjadi file-file PDF terpisah. Sistem otomatis membaca pola nomor seri (NOP) di dalam setiap lembar dan menggunakan nomor tersebut sebagai nama file tujuan (Misal: `351704001900100100.pdf`).

2. **Pencarian Instan:**
   File arsip yang sudah dipecah dan diberi nama sesuai NOP akan otomatis terhubung dengan fitur *Pencarian Publik*. Saat warga memasukkan NOP mereka, E-SPPT digital bisa langsung didownload melalui perangkat mereka sendiri.

3. **Kompresi Massal & Streaming:**
   File hasil *Smart Scan* atau *Scanner* sering kali masih bertubuh besar. Gunakan fitur Kompresi Massal untuk memperkecil ukuran ribuan PDF secara otomatis yang berjalan di latar belakang (hingga ~100 KB/file) tanpa memblokir aplikasi.

4. **Alat Pemeliharaan (Backup & Restore Zip):**
   Mengunduh dan memulihkan seluruh arsip PDF lintas-tahun ke dalam format ekstensi `.zip` menggunakan teknologi streaming, yang dirancang bebas *crash* / *Out of Memory* alias kuat memproses file ber-Gigabyte.

---

## 📖 2. Cara Penggunaan Pemilahan Cepat (Smart Scan)

Skenario: Anda mendapat 1 file PDF E-SPPT kolektif dari Bapenda berisi 1.500 halaman.

1. Buka menu **Pengaturan** > Pilih tab **Manajemen Arsip**.
2. Pastikan **Tahun Arsip** di kanan atas sudah sesuai target tahun pajak (Contoh: `2026`).
3. Klik tombol Oranye bertuliskan **Upload & Pemilahan Cepat**.
4. Tarik dan lepas (*Drag & Drop*) file bundel PDF tadi ke dalam area putus-putus, atau klik tombol **Pilih Bundle PDF**.
5. Tunggu proses Upload & Pemilahan. Proses ini terjadi sangat cepat secara instan menggunakan `pdf-lib`.
6. Begitu selesai memilah, sistem akan kembali memuat ulang daftar arsip. Kini terdapat ribuan arsip baru yang dipajang di *dashboard* Anda.

---

## ⚡ 3. Cara Mengecilkan Ukuran Arsip (Kompresi Massal)

PDF hasil *Smart Scan* mewarisi gaya pemformatan dari Bapenda, membuat ukurannya sering di kisaran `2 - 3 MB` *per lembar*. Hal ini akan menguras Disk server jika dibiarkan.

1. Di menu **Manajemen Arsip**, lihat status "Kapasitas" penyimpanan (sebelah judul atas). Jika terlampau besar (Misal: `3.40 GB`), maka kompresi wajib dilakukan.
2. Turun ke bagian bawah halaman di kotak **Alat Pemeliharaan Server**.
3. Klik tombol Hijau **Kompresi Massal**.
4. Akan muncul dialog persetujuan. Klik **OK (Lanjutkan)**.
5. Server secara otomatis akan meremas satu demi satu ukuran file PDF menyusut menjadi sekitar `~100 KB` saja menggunakan pustaka internal Ghostscript.
6. Progresnya terhitung akurat dan dapat dipantau dari indikator kecil (*toast*) di layar. 
7. **Perlu Dibatalkan?** Cukup tekan tombol Merah **Batalkan Kompresi** dan server akan langsung menghentikan proses pemadatan pada sisa antrean detik itu juga.

---

## 🛠️ 4. Aturan Manual Upload

Jika ada PBB milik 1 warga yang terlewat atau PDF lamanya rusak, Anda bisa menggantinya:
1. Klik tombol Putih **Manual Upload**.
2. Pilih file foto (`jpg/png`) atau `pdf`.
3. **PENTING:** Pastikan nama file Anda ubah manual (Rename) sebelum/sesudah diunggah menjadi utuh nama NOP pajaknya supaya file tersebut sinkron dengan Database Publik di Dashboard Utama! (Contoh: `351704...00.pdf`).

---

## 📦 5. Backup & Restore Arsip

Karena arsip E-SPPT adalah aset dokumen elektronik penting, rawatlah secara berkala.
- **Backup:** Di **Alat Pemeliharaan Server**, klik *Backup Arsip*. Tunggu beberapa detik dan browser akan meminta Anda menyimpan file `backup-arsip-pbb-YYYY.zip`. Simpan secara *offline* di *Flashdisk* / laptop.
- **Restore:** Jika di masa depan sistem aplikasi di-install ulang, cukup klik *Restore Arsip*, lalu pilih file ZIP yang pernah Anda backup tersebut. Server akan menyebar PDF kembali ke posisi tahun-tahun yang benar secara pintar.

---
*Digunakan dalam PBB Manager v6.0*
