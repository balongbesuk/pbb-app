<img width="2536" height="923" alt="PBB Manager Dashboard" src="https://github.com/user-attachments/assets/d540a662-121b-41d0-8882-5cb8455aa37b" />

# PBB Manager — Experience & Archive Polish `v8.2.1`

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma)](https://prisma.io)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![Version](https://img.shields.io/badge/Version-8.2.1-blue)](https://github.com/balongbesuk/pbb-app/tags)

**PBB Manager v8.2.1 (Experience & Archive Polish)** menghadirkan penyempurnaan pada stabilitas sistem, performa pencarian, dan manajemen arsip digital. Dilengkapi dengan infrastruktur GIS yang matang, sistem sinkronisasi Bapenda yang tangguh, serta fitur *Experience Polish* (Export Word & Area Validation) yang menjamin kenyamanan operasional tingkat tinggi bagi admin desa dan pelayanan publik yang lebih instan bagi warga. Dirancang untuk mentransformasi tata kelola PBB desa secara total—mulai dari pendataan spasial, transparansi penagihan, hingga layanan mandiri digital yang aman.

---

## Fitur Unggulan v8.0

| Fitur | Deskripsi |
|---|---|
| **Bapenda Sync Resilience** | **BARU (v8.2):** Penanganan error sinkronisasi Bapenda yang tangguh dan penyisipan parameter NOP otomatis ke portal portal pajak daerah. |
| **Dynamic Logo Refresh** | **BARU (v8.2):** Mekanisme *cache-busting* logo desa otomatis untuk pembaruan tampilan instansi secara *real-time*. |
| **Smart NOP Search** | **BARU (v8.2):** Mesin pencari NOP yang mengenali berbagai format input dan fitur riwayat pencarian warga (Recent Searches). |
| **GIS Command Center v2.0** | Dashboard peta interaktif berbasis GeoJSON/GPX untuk manajemen wilayah RT/RW/Dusun secara visual dengan layer citra satelit. |
| **Portal Mutasi (Self-Service)** | Memungkinkan warga mengajukan perubahan data (Hibah, Waris, Jual Beli) dan mencetak draf dokumen resmi. **BARU (v8.2.1):** Fitur ekspor ke Microsoft Word (.docx). |
| **Area Guard Validation** | **BARU (v8.2.1):** Validasi ketat pada form mutasi untuk mencegah input luas bangunan yang melebihi luas tanah. |
| **Mobile-First Action Bar** | **BARU (v8.2.1):** Layout tombol dialog yang adaptif dan efisien untuk navigasi di perangkat smartphone. |
| **Arsip Digital (Smart Scan)** | Algoritma ekstraksi otomatis yang memecah ribuan lembar E-SPPT menjadi file personal berdasarkan NOP secara instan. |
| **Smart Sync (Excel)** | Integrasi DHKP cerdas yang memungkinkan pembaruan data ribuan wajib pajak tanpa risiko duplikasi. |
| **Dashboard Eksekutif** | Visualisasi statistik realisasi harian, performa petugas per dusun, dan tren pembayaran secara *real-time*. |

---

## Hirarki Akses

Sistem keamanan berlapis untuk menjaga integritas data desa:

*   **ADMIN (Kepala Desa / Admin IT)**: Memegang kendali penuh atas konfigurasi instansi, GIS, sinkronisasi data pusat, pengelolaan arsip digital, dan manajemen akun pengguna.
*   **PENARIK (Kepala Dusun / Petugas)**: Antarmuka yang dioptimalkan untuk perangkat mobile. Fokus pada pembaruan status bayar di lapangan dan manajemen rotasi wajib pajak.
*   **PENGGUNA (Viewer)**: Akses terbatas hanya untuk melihat data dan laporan tanpa izin modifikasi (Read-Only).

---

## Dokumentasi & Panduan

Kami telah menyusun panduan lengkap agar Anda dapat mengoperasikan sistem ini dengan mudah:

1.  **[Wiki Teknis & Keamanan](./docs/WIKI.md)**: Ringkasan arsitektur, hardening keamanan, dan indeks teknis GIS.
2.  **[Panduan Instalasi Pemula](./docs/PANDUAN_INSTALASI.md)**: Langkah demi langkah instalasi dari nol untuk pengguna baru.
3.  **[Panduan Arsip Digital E-SPPT](./docs/PANDUAN_ARSIP_DIGITAL.md)**: Petunjuk teknis penggunaan fitur Smart Scan, Kompresi, dan Manajemen File.
4.  **[Dokumentasi Penggunaan](./docs/DOKUMENTASI_PENGGUNAAN.md)**: Panduan operasional fitur harian bagi admin dan petugas.

---

## Instalasi Cepat (Automated Setup)

Instalasi sekarang sepenuhnya otomatis. Cukup pastikan Anda memiliki **Node.js (v20+)** dan **Git**.

1. **Clone Proyek:**
   ```bash
   git clone https://github.com/balongbesuk/pbb-app.git
   cd pbb-app
   ```

2. **Setup Otomatis:**
   Gunakan satu perintah ini untuk menyiapkan konfigurasi `.env`, mendownload library, dan menginisialisasi database:
   ```bash
   npm install
   ```

3. **Jalankan:**
   ```bash
   # Mode Pengembangan
   npm run dev

   # Mode Produksi (Direkomendasikan)
   npm run build
   npm run start
   ```

**Kredensial Default:** `admin` / (Sesuai `ADMIN_PASSWORD` di `.env`)

---

## Pembaruan (Update)

Untuk memperbarui aplikasi ke versi terbaru tanpa kehilangan data:

```bash
git pull origin main
npm install
npm run build
npm run start
```
*Sistem kami akan otomatis mendeteksi perubahan skema database dan melakukan pembaruan di latar belakang.*

---

## Tech Stack

*   **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS
*   **GIS Engine**: Leaflet.js with Mapbox/Esri Satellites
*   **Backend**: Next.js Server Actions, Prisma ORM
*   **Database**: SQLite (Local) / PostgreSQL (Optional)
*   **Storage**: Local Streaming File System

---

## Project Structure

Struktur direktori proyek dirancang terstruktur dengan memisahkan wilayah *client-side*, *server-side*, komponen *user interface*, serta *core business logic*.

```text
.
├── .github/              # Konfigurasi GitHub Workflows & Actions
├── backups/              # Direktori penyimpanan otomatis file backup database (.bak)
├── docs/                 # Dokumentasi Teknis (WIKI) & Panduan Pengguna
├── map-data/             # Berkas pemetaan spasial lokal (GeoJSON) untuk GIS Command Center
├── prisma/               # Skema Database (Prisma ORM) & Inisialisasi Data Default (Seed)
├── public/               # Aset Statis (Logo instansi, Gambar, Marker Ikon GIS)
├── scripts/              # Skrip Utilitas (Audit Keamanan, Setup Awal, Seed Database)
├── storage/              # Repositori lokal output ekstraksi E-SPPT (Arsip Digital)
├── tmp/                  # Folder tembolok logis (Chunk upload & Pemrosesan sinkronisasi)
└── src/
    ├── app/              # Next.js App Router (Routing, Layout, Server Actions)
    │   ├── (dashboard)/  # Grup routing berpelindung akses untuk antarmuka administratif
    │   ├── actions/      # Next.js Server Actions (Mutasi DB secara langsung & aman)
    │   ├── api/          # Endpoint REST API (Backup, Parse PDF, Map GeoJSON Stream)
    │   ├── arsip-pbb/    # Portal layanan mandiri warga & pencarian publik
    │   ├── login/        # Halaman dan routing otentikasi lapis otorisasi
    │   └── globals.css   # Deklarasi Tailwind dasar & Token CSS Global
    ├── components/       # Komponen UI Berbasis Fungsionalitas & Atomic Modular 
    │   ├── dashboard/    # Komponen grafis eksekutif (Statistik, Grafik performa)
    │   ├── map/          # Integrasi komponen LeafletGIS (Layer, Marker Picker)
    │   ├── tax/          # Komponen pengelolaan administrasi Pajak, sinkronisasi DHKP
    │   ├── public/       # Portal eksternal berbasis geospasial
    │   └── ui/           # Komponen UI primitif modular (Shadcn/UI & Radix UI)
    ├── constants/        # Daftar value konstan aplikasi dan enumerasi global
    ├── hooks/            # Custom React Hooks (Manajemen Fetch State, Navigasi form)
    ├── lib/              # Pustaka Penggerak Utama & Business Logic (Backend Engine)
    │   ├── archive-utils.ts # Algoritma pemecah & penamaan file PDF (Smart Scan)
    │   ├── bapenda-sync.ts  # Mesin perbandingan rekonsiliasi Excel DHKP (Smart Sync)
    │   ├── excel-processor.ts # Pengurai dan importir format *spreadsheet*
    │   ├── file-security.ts # Middleware proteksi XSS & file payload berbahaya
    │   ├── spop-print.ts    # Generator iReport Draf SPOP secara *Serverless*
    │   └── validations/     # Zod Type Validations (Pelindung Form Validation)
    ├── pages/            # Next.js Legacy Pages (Untuk route API khusus/fallback)
    └── types/            # Definisi Interface Ekspor Data (TypeScript Global)
```

---

*Dikembangkan untuk kemajuan digitalisasi desa di Indonesia.*
*Terakhir Diperbarui: April 2026*
