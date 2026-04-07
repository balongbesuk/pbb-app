# Changelog

## v8.2 - 2026-04-06: Experience & Archive Polish

### Pencarian & Akurasi Data
- **Smart NOP Search Engine**: Optimasi mesin pencari NOP yang kini otomatis mengenali variasi format (angka polos, titik, maupun strip) di seluruh platform Admin dan Portal Publik.
- **Sanitized Search Input**: Pembatasan input pencarian maksimal 30 karakter dan pembersihan otomatis karakter spesial untuk menjaga integritas query database.
- **Riwayat Pencarian (Recent Searches)**: Implementasi penyimpanan 3 riwayat pencarian terakhir di perangkat warga untuk akses cepat data SPPT (Local Storage).
- **Debounce Optimization**: Peningkatan responsivitas pencarian pada popup peta dengan sistem *debounce* yang lebih halus.

### Manajemen Arsip Digital v2.1
- **Advanced PDF Viewer**: Penambahan fitur **Cetak (Print)** dan **Download** langsung dari jendela pratinjau arsip digital, baik di Detail Pajak maupun Kelola Arsip.
- **Real-time Restoration Progress**: Pembaruan fitur *Restore Backup* yang kini menampilkan jumlah file yang sedang diekstrak dan disusun secara riil (streaming), bukan sekadar persentase simulasi.
- **Upload Feedback**: Penambahan indikator jumlah file yang sedang diproses saat melakukan *Manual Upload* massal.
*   **Z-Index Correction**: Perbaikan bug visual di mana viewer PDF tampil di belakang dialog detail pada dashboard admin.

### UI/UX & Stabilitas Dashboard
- **Dynamic Logo Auto-Refresh**: Mekanisme *cache-busting* logo desa berbasis timestamp `updatedAt` untuk memastikan perubahan logo langsung terlihat di sidebar dan login tanpa perlu clear cache manual.
- **Interactive Component Reliability**: Perbaikan bug pada komponen dropdown (Select) di dashboard pajak yang sebelumnya macet, kini kembali responsif untuk pengalokasian wilayah dan status.
- **Mobile GIS Detail Optimization**: Peningkatan tata letak popup informasi wajib pajak pada peta untuk kenyamanan akses melalui perangkat mobile.
- **Theme-Aware Popups**: Perbaikan logika tema pada popup "WP Belum Bayar" di peta admin agar secara dinamis mengikuti mode *Light* atau *Dark* yang dipilih.
- **Rules of Hooks Fix**: Resolusi error teknis React pada komponen dialog wilayah untuk mencegah potensi *crash* saat navigasi cepat di peta.
- **Redundant UI Cleanup**: Penghapusan tombol tutup ganda pada viewer PDF untuk tampilan yang lebih bersih dan minimalis.
- **Next.js Infrastructure Hardening**: Optimasi konfigurasi `serverExternalPackages` untuk Prisma dan SQLite guna menjamin stabilitas query pada lingkungan produksi.

### Konektivitas & Integrasi Eksternal
- **Bapenda Sync Resilience**: Penanganan error "fetch failed" pada sinkronisasi status Bapenda agar aplikasi tidak crash saat API eksternal sulit dijangkau, lengkap dengan indikator *cooldown*.
- **Portal Link Injection**: Sistem cerdas yang otomatis menyisipkan parameter NOP ke tautan cek Bapenda untuk verifikasi data yang lebih instan bagi warga.

---

## v8.1 - 2026-04-02: Security & Stability Hardening

### Keamanan & Proteksi Sistem
- **Login Protection Layer**: Penambahan rate limiting login dan audit log untuk percobaan login gagal agar brute-force lebih sulit dilakukan dan lebih mudah dipantau.
- **Secure Media Upload Validation**: Upload avatar dan logo kini memverifikasi signature file gambar secara biner, bukan hanya MIME type, serta memakai ekstensi file yang dikontrol server.
- **Restore Backup Hardening**: Endpoint restore kini membatasi ukuran ZIP, memvalidasi struktur isi backup, menolak file liar di luar `dev.db` dan `uploads/`, serta memperketat sanitasi path ekstraksi.
- **Safer Failure Recovery**: Proses restore kini lebih aman saat gagal di tengah jalan, termasuk reconnect Prisma otomatis dan warning eksplisit jika sinkronisasi skema pasca-restore tidak berhasil.

### GIS & Public Portal Enhancements
- **Search Unpaid Taxpayers**: Fitur pencarian wajib pajak belum lunas di peta GIS dengan dukungan trigger minimal 3 karakter dan optimasi *debounce*.
- **Recent Searches (Riwayat)**: Implementasi penyimpanan 3 riwayat pencarian terakhir di perangkat warga untuk akses cepat data SPPT.
- **Fullscreen Dialog Resilience**: Perbaikan visibilitas dialog detail wilayah saat mode peta layar penuh dengan sistem *portal* dinamis ke kontainer peta.
- **Public UI Refinement**: Perbaikan kontras warna tab navigasi di mode terang (*light mode*) dan pembaruan favicon aplikasi dengan logo resmi desa.
- **Theme Isolation**: Isolasi tema publik agar tidak terpengaruh oleh status *dark mode* pada dashboard admin, menjamin tampilan konsisten bagi warga.

### Stabilitas Aplikasi & Konsistensi Data
- **Village Config Save Fix**: Field pengaturan desa yang dikosongkan kini benar-benar tersimpan sebagai string kosong, tidak lagi diam-diam diabaikan.
- **Public Search Privacy Cleanup**: Logging sensitif pada pencarian publik dihapus dan lookup arsip dipertahankan tetap kompatibel dengan nama file arsip yang sudah ada.
- **Dashboard & UI Cleanup**: Perbaikan purity render, `prefer-const`, escape karakter JSX, dan penyesuaian anotasi TypeScript untuk menjaga build serta lint tetap sehat.

### Tooling & Verifikasi
- **Security Verification Script**: Penambahan script `verify:security` untuk memeriksa lapisan hardening auth, upload file, dan restore backup secara cepat.
- **ESLint Tooling Recovery**: Konflik dependency `minimatch` dan `brace-expansion` yang membuat lint gagal kini diperbaiki dan disinkronkan ke lockfile.
- **Prisma Config Migration**: Konfigurasi Prisma dipindahkan dari `package.json#prisma` ke `prisma.config.ts` untuk menghilangkan warning deprecated dan menyiapkan kompatibilitas ke versi Prisma berikutnya.

---

## v8.0 - 2026-04-02: The GIS Revolution

### Fitur Utama: GIS Command Center v2.0
- **Peta Interaktif Admin**: Implementasi dashboard manajemen peta desa berbasis GeoJSON dan GPX yang canggih.
- **Interactive Map Picker**: Penentuan titik pusat peta desa secara visual (klik pada peta) yang menggantikan input manual Latitude/Longitude.
- **Bulk GPX Pipeline**: Sistem unggah massal file GPX dengan konversi otomatis dari format `LineString` ke `Polygon` area wilayah.
- **Auto-Metadata Extraction**: Pengenalan otomatis struktur wilayah (RT, RW, Dusun, Desa) dari skema penamaan file GPX.
- **Toggle Satellite Layer**: Integrasi layer citra satelit (World Imagery) pada peta utama dan jendela pemilihan koordinat.

### Perbaikan & Konsolidasi Dashboard
- **Unified Settings Experience**: Penggabungan menu "Pengaturan Peta" langsung ke dalam "Pengaturan Sistem" berbasis tab untuk alur kerja yang lebih efisien.
- **Sidebar Navigation Optimization**: Pembersihan menu navigasi sidebar untuk menghilangkan redundansi dan menyederhanakan akses admin.
- **Advanced UI/UX Refinement**: Perbaikan layout tab, optimasi Dark Mode secara menyuluruh, dan resolusi error hidrasi React pada komponen peta.
- **Pro-Form Validation**: Pembatasan panjang input dan pembersihan otomatis karakter (koma ke titik) pada kolom koordinat.

### Keamanan & Stabilitas GIS
- **Admin API Guard**: Seluruh endpoint API manajemen peta (`upload` & `delete`) kini diproteksi oleh Server-side Session (Role ADMIN).
- **Stored XSS Protection**: Sanitasi otomatis pada metadata (Dusun/RT/RW) yang ditampilkan di tooltip peta untuk mencegah injeksi script berbahaya.
- **Conditional Layer State**: Logika pintar yang hanya mengaktifkan layer filter (RT/RW/Dusun) jika data wilayah terkait tersedia di sistem.

---

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
