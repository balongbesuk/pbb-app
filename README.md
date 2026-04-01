<img width="2536" height="923" alt="PBB Manager Dashboard" src="https://github.com/user-attachments/assets/d540a662-121b-41d0-8882-5cb8455aa37b" />

# 🛰️ PBB Manager — The GIS Revolution `v8.0`

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma)](https://prisma.io)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![Version](https://img.shields.io/badge/Version-8.0-blue)](https://github.com/balongbesuk/pbb-app/tags)

**PBB Manager v8.0 (The GIS Revolution)** menghadirkan lompatan teknologi dengan komando GIS penuh. Platform ini kini terintegrasi dengan pemetaan wilayah digital yang interaktif, memungkinkan visualisasi data pajak langsung dari peta satelit. Dirancang untuk mentransformasi tata kelola PBB desa secara total—mulai dari pendataan spasial, transparansi penagihan, hingga layanan mandiri digital yang aman.

---

## ✨ Fitur Unggulan v8.0

| Fitur | Deskripsi |
|---|---|
| **🛰️ GIS Command Center v2.0** | **BARU (v8.0):** Dashboard peta interaktif berbasis GeoJSON/GPX untuk manajemen wilayah RT/RW/Dusun secara visual dengan layer citra satelit. |
| **📍 Interactive Map Picker** | **BARU (v8.0):** Penentuan titik koordinat pusat wilayah langsung dari peta tanpa input manual Latitude/Longitude (Point-and-Click). |
| **🏗️ Bulk GPX Pipeline** | **BARU (v8.0):** Unggah massal file GPX dengan ekstraksi metadata otomatis (RT/RW) dan konversi cerdas dari `LineString` ke `Polygon`. |
| **🛡️ GIS Security & Guard** | **BARU (v8.0):** Proteksi API manajemen peta (Role ADMIN) dan sistem sanitasi otomatis pada tooltip peta untuk mencegah serangan Stored XSS. |
| **🏢 Portal Mutasi (Self-Service)** | Memungkinkan warga mengajukan perubahan data (Hibah, Waris, Jual Beli) dan mencetak draf dokumen resmi secara mandiri. |
| **🚀 Arsip Digital (Smart Scan)** | Algoritma ekstraksi otomatis yang memecah ribuan lembar E-SPPT menjadi file personal berdasarkan NOP secara instan. |
| **🔄 Smart Sync (Excel)** | Integrasi DHKP cerdas yang memungkinkan pembaruan data ribuan wajib pajak tanpa risiko duplikasi. |
| **📊 Dashboard Eksekutif** | Visualisasi statistik realisasi harian, performa petugas per dusun, dan tren pembayaran secara *real-time*. |

---

## 👥 Hirarki Akses

Sistem keamanan berlapis untuk menjaga integritas data desa:

*   **👑 ADMIN (Kepala Desa / Admin IT)**: Memegang kendali penuh atas konfigurasi instansi, GIS, sinkronisasi data pusat, pengelolaan arsip digital, dan manajemen akun pengguna.
*   **📱 PENARIK (Kepala Dusun / Petugas)**: Antarmuka yang dioptimalkan untuk perangkat mobile. Fokus pada pembaruan status bayar di lapangan dan manajemen rotasi wajib pajak.
*   **🛡️ PENGGUNA (Viewer)**: Akses terbatas hanya untuk melihat data dan laporan tanpa izin modifikasi (Read-Only).

---

## 🛠️ Dokumentasi & Panduan

Kami telah menyusun panduan lengkap agar Anda dapat mengoperasikan sistem ini dengan mudah:

1.  **[Wiki Teknis & Keamanan](./docs/WIKI.md)**: Ringkasan arsitektur, hardening keamanan, dan indeks teknis GIS.
2.  **[Panduan Instalasi Pemula](./docs/PANDUAN_INSTALASI.md)**: Langkah demi langkah instalasi dari nol untuk pengguna baru.
3.  **[Panduan Arsip Digital E-SPPT](./docs/PANDUAN_ARSIP_DIGITAL.md)**: Petunjuk teknis penggunaan fitur Smart Scan, Kompresi, dan Manajemen File.
4.  **[Dokumentasi Penggunaan](./docs/DOKUMENTASI_PENGGUNAAN.md)**: Panduan operasional fitur harian bagi admin dan petugas.

---

## 🚀 Instalasi Cepat (Automated Setup)

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

## 🔄 Pembaruan (Update)

Untuk memperbarui aplikasi ke versi terbaru tanpa kehilangan data:

```bash
git pull origin main
npm install
npm run build
npm run start
```
*Sistem kami akan otomatis mendeteksi perubahan skema database dan melakukan pembaruan di latar belakang.*

---

## 📡 Tech Stack

*   **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS
*   **GIS Engine**: Leaflet.js with Mapbox/Esri Satellites
*   **Backend**: Next.js Server Actions, Prisma ORM
*   **Database**: SQLite (Local) / PostgreSQL (Optional)
*   **Storage**: Local Streaming File System

---

*Dikembangkan untuk kemajuan digitalisasi desa di Indonesia.*
*Terakhir Diperbarui: April 2026*
