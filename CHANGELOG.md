# Changelog

## v9.2 - 2026-04-28: Security, Resilience & Production Hardening

Pembaruan besar pada keamanan backend, penguatan upload/restore, optimasi performa publik, dan kesiapan produksi agar PBB Manager lebih aman dipakai di lingkungan nyata.

### Security Hardening
- **Mobile Bearer Authentication**: Seluruh endpoint operasional mobile petugas kini mewajibkan `Authorization: Bearer` dan tidak lagi mempercayai `userId` dari body/query.
- **Role Ownership Enforcement**: Akses petugas `PENARIK` diperketat agar hanya bisa melihat dan memodifikasi data yang memang menjadi alokasinya.
- **Archive & Report Sanitization**: Penambahan helper sanitasi untuk mencegah HTML injection pada laporan cetak dan formula injection pada ekspor/impor Excel.
- **Safer Production Defaults**: `.env.example` diperbarui agar tidak lagi mencontohkan secret dan password lemah, serta menambahkan flag `TRUST_PROXY`.

### Backup, Restore & Operational Safety
- **Database Path Consistency Fix**: Mekanisme backup kini membaca path SQLite dari `DATABASE_URL` secara konsisten, bukan hardcoded ke lokasi lama.
- **Web Database Restore Disabled**: Restore database penuh via endpoint web dinonaktifkan demi keamanan.
- **Manual Maintenance Restore Tool**: Penambahan script `scripts/restore-database-from-backup.mjs` untuk proses restore database dalam mode maintenance/manual.
- **Background Archive Restore**: Restore arsip digital dipindah ke sistem job background dengan polling status.
- **Background Map Restore**: Restore data peta juga dipindah ke model background job untuk menghindari request panjang yang rapuh.

### Performance & Scalability
- **Background Smart Scan**: Pemecahan PDF bundle arsip kini berjalan sebagai background job, sehingga UI tidak lagi tergantung koneksi streaming panjang.
- **Region Stats Aggregate Optimization**: Endpoint statistik wilayah tidak lagi menarik seluruh data ke memory Node, tetapi menghitung agregat langsung di database.
- **Cached Public Archive Index**: Pencarian publik tidak lagi melakukan scan folder arsip mentah di setiap request; indeks arsip sekarang dicache per tahun/folder.
- **Persistent Rate Limit Backend**: Rate limiter kini memakai backend SQLite persisten dengan fallback memory, jauh lebih stabil dibanding limiter in-memory murni.
- **Trusted Proxy IP Handling**: Pengambilan IP klien disatukan melalui helper khusus dan hanya mempercayai `x-forwarded-for`/`x-real-ip` saat `TRUST_PROXY=true`.

### Upload & File Validation
- **Global Request Limit Tightening**: `serverActions.bodySizeLimit` diturunkan dari `500mb` menjadi `25mb`.
- **Route-Specific Upload Guards**: Validasi ketat ditambahkan untuk PDF/ZIP/GPX berdasarkan ukuran, jumlah file, MIME type, ekstensi, dan jumlah entry ZIP.
- **Archive Restore ZIP Validation**: Restore arsip sekarang menolak ZIP yang kosong, terlalu besar, terlalu banyak file, atau berisi file non-PDF.
- **Map Restore ZIP Validation**: Restore peta kini membatasi ukuran ZIP, jumlah entry, dan jenis file yang boleh diekstrak.

### Build & Production Readiness
- **Production Build Fix**: Error `useSearchParams()` nullable pada formulir publik diperbaiki sehingga `next build` kembali sukses.
- **Production Checklist**: Penambahan `docs/CHECKLIST_PRODUCTION.md` untuk panduan environment, proxy, upload, backup, dan verifikasi sebelum go-live.
- **README Ops Update**: README diperbarui agar checklist produksi ikut terdokumentasi resmi.

---

## v9.1 - 2026-04-27: Portal Publik & SPOP Standalone

Pembaruan besar pada portal publik dengan fokus pada kemandirian warga dalam pengajuan data melalui sistem formulir mandiri dan standarisasi desain antarmuka.

### Portal Publik & Layanan Mandiri
- **SPOP Sketch Insertion**: Implementasi fitur unggah gambar denah lokasi/peta pada formulir SPOP (Maks. 2MB). Gambar secara otomatis disisipkan ke dalam bingkai "SKET / DENAH" pada pratinjau dan dokumen cetak.
- **Popup Layout Fix**: Optimalisasi grid pada SPOP Dialog untuk memperbaiki tampilan baris RT/RW dan penempatan kotak denah agar lebih proporsional pada layar dialog.
- **Contextual Defaults**: Penyesuaian cerdas jenis transaksi; Default **Pemutakhiran** untuk versi Popup (basis NOP ada) dan **Perekaman** untuk versi Standalone (pendaftaran baru).
- **Branding Refinement**: Perubahan label layanan menjadi **SPOP / LSPOP** pada kartu beranda untuk kejelasan terminologi teknis bagi warga.
- **Search Results UI Consistency**: Penyelarasan warna tombol pada hasil pencarian (SPOP: Amber, Mutasi: Sky Blue) agar selaras dengan identitas visual di seluruh portal.
- **Form Cleanup**: Penghapusan *placeholder* yang tidak perlu pada isian No. Surat Keterangan untuk tampilan formulir yang lebih bersih.
- **Navbar Streamlining**: Penghapusan tautan "Pengajuan Baru" dari navigasi atas untuk menyederhanakan antarmuka dan memfokuskan navigasi melalui beranda.
- **Standalone SPOP/LSPOP Page**: Implementasi halaman mandiri `/spop` dengan sistem tanya jawab interaktif untuk pengajuan Mutasi, Koreksi, dan Perekaman data baru.
- **Standalone Pengajuan Baru**: Halaman mandiri `/pengajuan` untuk pendaftaran SPPT PBB Baru dengan formulir yang lebih lega dan fokus.
- **Dynamic NOP Validation**: Sistem validasi NOP cerdas yang bersifat opsional untuk Perekaman baru, namun wajib (minimal 13 digit) untuk Pemutakhiran dan Penghapusan.
- **Strict Form Sanitization**: Pengetatan batas karakter isian formulir (Nama: 21, Alamat: 21, Desa: 11, Kab: 8) sesuai standar fisik dokumen SPOP/LSPOP untuk akurasi cetak.
- **Unified Squircle UI**: Standarisasi seluruh elemen tombol publik menggunakan desain *Squircle* (`rounded-2xl`) untuk identitas visual yang lebih konsisten dan modern.
- **Mobile Navigation Polish**: Optimasi navbar mobile dengan ikon login minimalis dan logo desa yang terintegrasi dengan tautan beranda.
- **Hybrid Search Results**: Pengembalian fitur popup pada hasil pencarian NOP sementara tetap menyediakan akses ke halaman mandiri, memberikan fleksibilitas akses bagi warga.
- **Auto-fill Applicant Identity**: Sinkronisasi otomatis antara Nama Pemohon (Tahap 1) dan Nama Wajib Pajak (Tahap 2) pada form pengajuan SPPT baru untuk mempercepat input data.
- **Smart Vacant Land Flow**: Jalur navigasi cerdas pada form SPOP yang secara otomatis menyembunyikan tahap isian bangunan jika jenis tanah adalah "Tanah Kosong", lengkap dengan penyesuaian label tombol pratinjau.
- **Enhanced Form Guidance**: Penambahan *placeholder* informatif pada kolom Alamat/Jalan untuk memandu warga memberikan data lokasi yang lebih presisi.
- **Default Perekaman Transaction**: Penentuan "Perekaman Data Baru" sebagai opsi standar pada formulir SPOP untuk mempercepat proses pengisian bagi mayoritas warga.
- **Unified Brand Footer**: Integrasi ikon GitHub dan tautan repositori pada seluruh halaman layanan mandiri (`/spop` & `/pengajuan`) untuk konsistensi identitas digital proyek.

### PBB Mobile (Fitur Operasional)
- **Dynamic Action Footer**: Implementasi barisan tombol aksi di Detail WP (Sengketa, Tdk Terbit, Tandai Lunas, Batal Lunas) yang menyederhanakan pembaruan status data langsung dari lapangan.
- **EPAY Jombang Integration**: Fitur "Bayar Online" yang secara otomatis mengecek status ke Bapenda pusat dan mengarahkan petugas/WP ke portal EPAY Jombang dengan NOP terisi otomatis.
- **Interactive Notifications**: Penarikan notifikasi pemindahan alokasi kini dilengkapi tombol aksi (Terima/Tolak) yang memicu pembaruan status alokasi secara instan.
- **Premium Feedback Modals**: Penggantian alert sistem dengan *Custom Status Modal* (High-Fidelity) untuk memberikan umpan balik sukses/gagal yang lebih seragam dan modern.
- **Logout Protection**: Penambahan dialog konfirmasi keluar sesi untuk menghindari penghentian sesi petugas secara tidak sengaja.
- **Village Dynamic Branding**: Penampilan nama desa secara dinamis pada footer halaman login (Contoh: PBB Mobile Desa Balongbesuk).

### Core Backend & Logics
- **Taxpayer Status API**: Endpoint baru `/api/mobile/officer/taxpayers/status` dengan penambahan logika *Audit Log* otomatis untuk setiap pembaruan status data.
- **Transfer Response API**: Pembaruan sistem penanganan transfer data dengan sinkronisasi status alokasi real-time.
- **Advanced Activity Tracking**: Perbaikan algoritma penarikan log pada Dashboard API yang kini mencakup seluruh spektrum aktivitas petugas (Update Status, Transfer, Sinkronisasi).
- **Server Session Fix**: Pembaruan parameter `userId` pada pemanggilan *logging* server-side untuk mencegah *hang* saat pengiriman data dari platform mobile.

### UI/UX Polish
- **Rebranding Update**: Pembaruan teks label login dan identitas utama menjadi **PBB Mobile** untuk kejelasan fungsi sebagai alat operasional lapangan.
- **Layout Overlap Fix**: Optimalisasi *bottom padding* dan *safe area* pada layar detail untuk memastikan semua elemen interaktif dapat diakses dengan nyaman.

### Security Hardening & Maintenance
- **XSS Protection (DOMPurify)**: Implementasi pembersihan HTML (*HTML Sanitization*) menyeluruh menggunakan library `dompurify` pada seluruh fitur cetak dokumen publik (SPPT Baru, SPOP/LSPOP, dan Mutasi).
- **GitHub Security Alignment**: Penyinkronan kode dengan rekomendasi keamanan *GitHub Advanced Security (CodeQL)* untuk mencegah celah injeksi kode melalui input formulir warga.
- **Build Optimization**: Perbaikan kesalahan deklarasi variabel ganda dan inkonsistensi tipe data (*TypeScript Type Mismatch*) pada formulir publik untuk menjamin kelancaran proses *production build*.
- **Robust Dependency Management**: Penambahan library keamanan industri (`dompurify`) ke dalam dependensi inti proyek.

---


## v9.0 - 2026-04-16: PBB Mobile Excellence

Pembaruan besar pada ekosistem mobile yang mentransformasi PBB Manager menjadi alat operasional lapangan yang tangguh, cepat, dan modern.

### PBB Manager Mobile (Petugas)
- **Modern UI Redesign**: Redesain total antarmuka petugas dan halaman login menggunakan tema *Premium Light Mode* yang bersih, profesional, dan seragam dengan dashboard utama.
- **Taxpayer Lazy Load (Paging)**: Implementasi sistem pemuatan bertahap (pagination) pada daftar Wajib Pajak untuk memastikan aplikasi tetap responsif saat menangani ribuan data.
- **Billing History Timeline**: Fitur baru untuk melihat seluruh riwayat aktivitas penagihan petugas dalam format garis waktu (*timeline*) yang informatif.
- **Smart Notification System**: Penambahan ikon lonceng dengan *badge* notifikasi real-time untuk memantau pengumuman sistem dan permintaan transfer data.
- **Enhanced Search Experience**: Integrasi mekanisme *debounce* pada pencarian daftar WP untuk pencarian yang lebih instan tanpa membebani server.
- **Performance Card Update**: Visualisasi progres realisasi penagihan per petugas dengan progress bar dan statistik nominal (Rupiah) yang presisi.

### Backend & API Integration
- **Officer Analytics API**: Endpoint baru `/api/mobile/officer/dashboard` yang menyediakan statistik performa individu petugas (Target vs Terkumpul).
- **Paginated Taxpayers API**: Endpoint baru `/api/mobile/officer/taxpayers` dengan dukungan parameter `page` dan `limit` untuk optimasi bandwidth.
- **Activity Logs API**: Endpoint `/api/mobile/officer/logs` untuk penarikan riwayat transaksi digital yang tersaring khusus per petugas.
- **Notification Engine**: Infrastruktur backend untuk pengelolaan status baca (*mark as read*) dan distribusi notifikasi sistem.

### Infrastruktur & Branding
- **Project Rebranding**: Sinkronisasi identitas proyek menjadi **PBB Manager** dengan fokus keunggulan pada platform **PBB Mobile**.
- **EAS Build Ready**: Penambahan konfigurasi `eas.json` dan `app.json` (Android Package) untuk mendukung pembuatan file APK secara instan melalui Expo Application Services.
- **Documentation Audit**: Pembaruan menyeluruh pada `README.md` untuk merefleksikan fitur-fitur baru v9.0 dan panduan build aplikasi.

---

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
- *   **Z-Index Correction**: Perbaikan bug visual di mana viewer PDF tampil di belakang dialog detail pada dashboard admin.

... (sisanya tetap sama)
