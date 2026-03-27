<img width="2536" height="923" alt="PBB Manager Dashboard" src="https://github.com/user-attachments/assets/d540a662-121b-41d0-8882-5cb8455aa37b" />

# 🏦 PBB Manager — Solusi Digitalisasi Pajak Desa `v6.0`

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma)](https://prisma.io)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![Version](https://img.shields.io/badge/Version-6.0-blue)](https://github.com/balongbesuk/pbb-app/tags)

**PBB Manager v6.0** adalah platform manajemen pajak desa modern yang dirancang untuk mentransformasi tata kelola PBB secara digital. Menghadirkan efisiensi dalam pendataan, transparansi penagihan, serta kecanggihan pengarsipan elektronik (E-SPPT) untuk desa yang lebih mandiri dan profesional.

---

## ✨ Fitur Unggulan v6.0

| Fitur | Deskripsi |
|---|---|
| **🚀 Arsip Digital (Smart Scan)** | **BARU:** Algoritma ekstraksi otomatis yang memecah ribuan lembar E-SPPT menjadi file personal berdasarkan NOP secara instan. |
| **📉 Kompresi PDF Intelligent** | **BARU:** Teknologi *Streaming Compression* untuk mengecilkan ukuran PDF massal tanpa membebani memori server, menghemat penyimpanan hingga 80%. |
| **🔄 Smart Sync (Excel)** | Integrasi DHKP cerdas yang memungkinkan pembaruan data ribuan wajib pajak tanpa risiko duplikasi atau penghapusan manual. |
| **⚡ Mass Allocation** | Distribusi tugas penarikan pajak ke petugas lapangan dalam satu klik menggunakan filter wilayah yang fleksibel. |
| **📏 Auto Normalization** | Standarisasi otomatis format wilayah (RT/RW) untuk memastikan keakuratan laporan dan statistik tanpa *inputan* manual yang salah. |
| **📊 Dashboard Eksekutif** | Visualisasi statistik realisasi harian, performa petugas per dusun, dan tren pembayaran secara *real-time*. |
| **📱 Portal Warga Premium** | Antarmuka publik yang elegan dengan efek *glassmorphism*, memudahkan warga mengecek tagihan dan mengunduh E-SPPT secara mandiri. |
| **🔒 Audit Trail & Security** | Pencatatan setiap log aktivitas untuk transparansi penuh, dilengkapi dengan sistem hak akses (*Role-Based Access Control*). |

---

## 👥 Hirarki Akses

Sistem keamanan berlapis untuk menjaga integritas data desa:

*   **👑 ADMIN (Kepala Desa / Admin IT)**: Memegang kendali penuh atas konfigurasi instansi, sinkronisasi data pusat, pengelolaan arsip digital, dan manajemen akun pengguna.
*   **📱 PENARIK (Kepala Dusun / Petugas)**: Antarmuka yang dioptimalkan untuk perangkat mobile. Fokus pada pembaruan status bayar di lapangan dan manajemen rotasi wajib pajak.
*   **🛡️ PENGGUNA (Viewer)**: Akses terbatas hanya untuk melihat data dan laporan tanpa izin modifikasi (Read-Only).

---

## 🛠️ Dokumentasi & Panduan

Kami telah menyusun panduan lengkap agar Anda dapat mengoperasikan sistem ini dengan mudah:

1.  **[Wiki Teknis & Keamanan](./docs/WIKI.md)**: Ringkasan arsitektur, hardening keamanan, dan indeks teknis.
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
*   **Backend**: Next.js Server Actions, Prisma ORM
*   **Database**: SQLite (Local) / PostgreSQL (Optional)
*   **Storage**: Local Streaming File System

---

*Dikembangkan untuk kemajuan digitalisasi desa di Indonesia.*
*Terakhir Diperbarui: Maret 2026*
