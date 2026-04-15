# Changelog

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
