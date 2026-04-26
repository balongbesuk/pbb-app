# Wiki Sistem PBB Manager v9.0

Selamat datang di Wiki Teknis untuk proyek **PBB Manager**. Dokumen ini berfungsi sebagai pusat informasi mengenai arsitektur, keamanan, GIS, dan pemeliharaan sistem terintegrasi (Web & Mobile).

---

## Arsitektur & Teknologi

Sistem ini dibangun dengan stack modern yang dioptimalkan untuk performa dan keamanan pada lingkungan server dengan sumber daya terbatas (seperti VPS ARM64) serta operasional lapangan berbasis mobile.

### Core Backend & Web
*   **Framework**: Next.js 16 (App Router) & React 19.
*   **Keamanan Core**: Next-Auth v4 dengan enkripsi `bcryptjs`.
*   **ORM / Database**: Prisma dengan SQLite (Default) untuk portabilitas data desa yang mudah dibawa/backup.

### PBB Mobile Excellence (v9.0)
*   **Platform**: React Native (Expo SDK 54).
*   **Styling**: NativeWind (Tailwind CSS for Native).
*   **Bridging**: Mekanisme `magicToken` untuk otentikasi aman antara aplikasi native dengan fitur berbasis WebView.
*   **Building**: Terintegrasi dengan **EAS Build** (Expo Application Services) untuk otomasi pembuatan file APK.

---

## Hardening & Transparansi Keamanan (Update v9.0)

Kami terus melakukan audit keamanan untuk menjamin integritas data desa baik melalui akses Web maupun Mobile.

### 1. Mobile Security Guard (v9.0)
- **Officer API Protection**: Seluruh endpoint khusus petugas (seperti `/api/mobile/officer/*`) dilindungi oleh lapisan otentikasi token.
- **Role-Based Access**: Sistem memastikan hanya akun dengan role `PENARIK` (Petugas) yang dapat mengakses fitur penagihan masif dan riwayat transaksi lapangan.

### 2. GIS Security & API Protection (v8.0)
- **Admin API Guard**: Seluruh endpoint manajemen peta diproteksi dengan verifikasi sesi server-side.
- **Stored XSS Protection on Map**: Metadata wilayah dari file GPX disanitasi secara ketat.

---

## Indeks Dokumentasi Lengkap

Gunakan panduan berikut untuk kebutuhan operasional Anda:

| Dokumen | Deskripsi |
| :--- | :--- |
| **[Panduan Instalasi](./PANDUAN_INSTALASI.md)** | Instruksi penyiapan server dan inisialisasi database. |
| **[Dokumentasi Penggunaan](./DOKUMENTASI_PENGGUNAAN.md)** | **UPDATE v9.0:** Panduan dashboard admin dan operasional petugas mobile. |
| **[Panduan Arsip Digital](./PANDUAN_ARSIP_DIGITAL.md)** | Detail teknis mengenai *Smart Scan* dan *PDF Compression*. |
| **[README Utama](../README.md)** | Gambaran umum proyek dan fitur unggulan. |

---

## Alur Kerja Teknis (Workflows)

### Mobile Data Paging (v9.0)
Untuk menangani ribuan data Wajib Pajak di perangkat mobile:
1. **Lazy Loading**: Aplikasi meminta data dalam potongan kecil (Pagination) berbasis parameter `skip` dan `take`.
2. **Debounced Local Search**: Pencarian dilakukan dengan jeda waktu untuk mengurangi beban query database secara simultan.

### GIS Pipeline (v8.0)
Sistem GIS menggunakan alur modern: GPX Ingestion -> Auto-Conversion -> Reactive Map States.

---

## Kontak & Pemeliharaan
Pastikan untuk menjalankan `git pull` secara berkala dan perbarui build APK Anda saat ada perubahan besar pada logika API mobile.

*Terakhir diperbarui: 16 April 2026*
