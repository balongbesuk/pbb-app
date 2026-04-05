# Wiki Sistem PBB Manager v8.0

Selamat datang di Wiki Teknis untuk proyek **PBB Manager**. Dokumen ini berfungsi sebagai pusat informasi mengenai arsitektur, keamanan, GIS, dan pemeliharaan sistem.

---

## Arsitektur & Teknologi

Sistem ini dibangun dengan stack modern yang dioptimalkan untuk performa dan keamanan pada lingkungan server dengan sumber daya terbatas (seperti VPS ARM64).

*   **Framework**: Next.js 16 (App Router) & React 19.
*   **GIS Engine**: Leaflet.js v1.9+ terintegrasi dengan Esri Satellites.
*   **Keamanan Core**: Next-Auth v4 dengan enkripsi `bcryptjs`.
*   **Sanitasi Global**: Utilitas `sanitizeText` & `sanitizeNumberString` untuk keamanan input publik.
*   **ORM / Database**: Prisma dengan SQLite (Default) untuk portabilitas data desa yang mudah dibawa/backup.
*   **Pemrosesan Dokumen**: `pdf-lib` dan `pdfjs-dist` v4.2+ untuk ekstraksi E-SPPT massal.

---

## Hardening & Transparansi Keamanan (Update v8.0)

Kami terus melakukan audit keamanan untuk memastikan data warga tetap terlindungi. Berikut adalah langkah-langkah *hardening* terbaru di v8.0:

### 1. GIS Security & API Protection (v8.0)
- **Admin API Guard**: Seluruh endpoint manajemen peta (`/api/peta/upload` dan `/api/peta/delete`) diproteksi dengan verifikasi sesi server-side (Role ADMIN).
- **Stored XSS Protection on Map**: Metadata wilayah dari file GPX yang digenerasi ke tooltip peta kini disanitasi secara ketat untuk mencegah eksekusi skrip berbahaya.
- **Path Sanitization**: Penanganan file unggahan peta menggunakan sanitasi path untuk mencegah penulisan file di luar direktori `map-data`.

### 2. Sanitasi Input Global (v7.1)
- **Global Stripping**: Seluruh input teks pada portal publik kini diproses melalui algoritma pembersihan karakter HTML/Script.
- **Numeric Validation**: Validasi ketat pada NOP dan NIK menggunakan regex.

---

## Indeks Dokumentasi Lengkap

Gunakan panduan berikut untuk kebutuhan operasional Anda:

| Dokumen | Deskripsi |
| :--- | :--- |
| **[Panduan Instalasi](./PANDUAN_INSTALASI.md)** | Instruksi penyiapan server, Node.js, dan inisialisasi database. |
| **[Dokumentasi Penggunaan](./DOKUMENTASI_PENGGUNAAN.md)** | Panduan fitur dashboard, penagihan, manajemen user, dan GIS. |
| **[Panduan Arsip Digital](./PANDUAN_ARSIP_DIGITAL.md)** | Detail teknis mengenai *Smart Scan* dan *PDF Compression*. |
| **[README Utama](../README.md)** | Gambaran umum proyek dan fitur unggulan. |

---

## Alur Kerja Teknis (Workflows)

### GIS Pipeline (v8.0)
Sistem GIS menggunakan alur modern untuk manajemen spasial:
1. **GPX Ingestion**: File GPX diunggah dan diekstraksi metadatanya (Dusun, RT, RW).
2. **Auto-Conversion**: Objek `LineString` dari GPX dikonversi secara cerdas menjadi `Polygon` untuk representasi wilayah.
3. **Reactive Map States**: Layer filter (RT/RW/Dusun) bersifat kondisional, hanya aktif jika data wilayah tersedia di backend.

### Modul Mutasi SPPT & SPOP (v7.1)
Sistem mutasi menggunakan alur 3-langkah (Steper):
1. **Identifikasi Data Lama**: Penarikan data *real-time* dari database utama.
2. **Input Data Baru**: Form input terenkripsi dengan validasi NIK.
3. **Cetak & Tipografi SPOP**: Standarisasi cetak SPOP dengan tipografi `12px` dan optimasi scaling F4.

---

## Kontak & Pemeliharaan
Pastikan untuk selalu menjalankan `npm audit` secara berkala dan melakukan `git pull` untuk mendapatkan pembaruan keamanan terbaru.

*Terakhir diperbarui: 2 April 2026*
