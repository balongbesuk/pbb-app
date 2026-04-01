# Changelog

## v7.2 - 2026-04-02

### Perbaikan & Penyempurnaan Sistem (Akurat Sesuai GitHub Commit)
- **Refining SPOP Print Layout**: Pembersihan navigasi visual pada halaman 3 & 4 form SPOP, penghapusan garis border vertikal yang tidak perlu untuk tampilan yang lebih profesional.
- **Tax Research Sync Optimization**: Sinkronisasi pencarian data pajak yang lebih cepat dan perbaikan fitur autofill pada mutasi form SPOP.
- **Smart NOP Search**: Implementasi pencarian NOP yang lebih cerdas dan dukungan input data manual yang sudah difinalisasi.
- **Build Performance Optimization**: Pemindahan direktori storage ke luar root project dan sentralisasi konfigurasi `STORAGE_ROOT` via `.env` untuk mempercepat proses kompilasi/build.

### UI/UX & Keamanan (Polish)
- **Login & Search Security**: Pembatasan jumlah karakter pada kolom input Login dan pencarian untuk mencegah serangan overflow sederhana dan meningkatkan validitas data.
- **Enhanced Dashboard Visuals**: Penambahan ikon informatif pada kartu ringkasan dashboard dan penyesuaian label mata uang (jutaan) agar lebih mudah dibaca.
- **Particles & Dialog Optimization**: Optimasi efek partikel latar belakang dan perbaikan kontras warna background pada komponen dialog agar tetap solid di berbagai mode.
- **Admin Security**: Penambahan tutorial reset password admin dan pembersihan skrip middleware/test yang sudah tidak digunakan.

---

## v7.1 - 2026-03-30

### Fitur Baru
- **Portal Mutasi (Self-Service) v7.1**: Memungkinkan warga mengajukan perubahan data (Hibah, Waris, Jual Beli) dan mencetak draf dokumen resmi (Surat Permohonan & Keterangan Desa) secara mandiri.
- **Cetek SPOP & Dokumen Mutasi yang Disempurnakan**: Penambahan kemampuan pratinjau dan cetak form SPOP / LSPOP dengan standarisasi tipografi yang proporsional (ukuran 12px), pemisahan kolom alamat, pembersihan logo garuda (tanpa bingkai), serta dukungan untuk input profil desa (alamat kantor, kodepos, dan nama kades) secara terpusat.
- **Keamanan Data & Sanitasi Berbasis XSS v7.1**: Implementasi sanitasi input tingkat lanjut untuk mencegah serangan XSS secara ketat, terutama di seluruh isian data warga seperti NIK, data ahli waris, beserta dokumen pelaporan perpajakannya.

### Perbaikan & Penyempurnaan
- **Validasi Cetak SPPT**: Menambahkan pengecekan status validasi data sebelum dokumen SPPT dapat dicetak untuk memastikan akurasi data wajib pajak.
- **UI Dark Mode**: Memperbaiki visibilitas input dan ikon pada dialog mutasi di mode gelap.
- **Hover Text Colors**: Warna teks hover di dark mode kini kontras tinggi untuk pengalaman pengguna yang lebih baik.
- **Filter Chips Visibility**: Chip filter pada tampilan mobile tetap terlihat di dark mode.
- **Sorting NOP ASC**: Penyortiran data NOP secara naik di seluruh platform.

### Dokumentasi
- Memperbarui `README.md` dan `docs/WIKI.md` dengan referensi versi v7.1.
- Menambahkan bagian **Perubahan v7.1** pada Wiki.

### Lainnya
- Tag release `v7.1` dibuat di Git.
