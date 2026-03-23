<img width="2536" height="923" alt="image" src="https://github.com/user-attachments/assets/d540a662-121b-41d0-8882-5cb8455aa37b" />

# 🏦 PBB Manager — Sistem Manajemen Pajak Desa `v6.0`

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma)](https://prisma.io)
[![Version](https://img.shields.io/badge/Version-6.0-blue)](https://github.com/balongbesuk/pbb-app/tags)
[![License](https://img.shields.io/badge/License-MIT-blue)](./LICENSE)

**PBB Manager v6.0** hadir dengan update besar **"Smart Scan & Digital Archive"** untuk menunjang kebutuhan desa modern dalam tata kelola pendataan, penagihan, dan pengarsipan elektronik Pajak Bumi dan Bangunan (PBB) E-SPPT warga yang lebih efisien, akurat, dan profesional.

---

## ✨ Fitur Unggulan v6.0

| Fitur | Deskripsi |
|---|---|
| **Arsip Digital (Smart Scan)** | **BARU:** Arsip E-SPPT/PDF warka secara otomatis dipecah berdasar nomor NOP dalam kecepatan kilat. Warga bisa mendownload E-SPPT-nya langsung dari Portal Pencarian. |
| **Kompresi PDF Massal** | **BARU:** Mengecilkan (compress) ukuran ribuan PDF E-SPPT secara masif di latar belakang dengan Streaming tanpa takut *crash* untuk menghemat penyimpanan disk Server. |
| **Smart Sync (Excel)** | Update data via Excel tanpa menghapus data lama. Sinkronisasi cerdas NOP, status, dan nominal secara otomatis. |
| **Global Allocation** | Alokasi masal ribuan data hasil filter ke penarik dalam satu klik, tanpa terbatas paginasi. |
| **Auto Normalization** | Standarisasi otomatis format RT/RW menjadi 2 digit (01, 02) untuk keakuratan laporan wilayah. |
| **Dashboard Real-Time** | Pantau tren realisasi harian, statistik wilayah, dan performa petugas secara langsung |
| **Portal Warga Modern** | Pencarian tagihan publik dengan efek *glassmorphism*, fitur download E-SPPT, dan desain premium |
| **Branding Dinamis** | Ubah logo desa, nama desa, kecamatan, dan kabupaten langsung dari menu Pengaturan |
| **Audit Trail** | Rekam seluruh aktivitas: login, perubahan status, rotasi hak akses — tidak bisa dimanipulasi |
| **Backup & Restore Arsip** | Unduh ZIP backup ribuan arsip dan pulihkan jika terjadi perpindahan server menggunakan *Streaming Tech*. |

---

## 👥 Sistem Peran (*Role System*)

Tiga level akses untuk menjaga integritas data pajak:

### 👑 ADMIN — Kepala Desa / Petugas IT / Admin PBB
- Kontrol penuh terhadap seluruh sistem & pengaturan profil instansi.
- Mengaktifkan **Smart Sync** untuk pembaruan data DHKP tahunan/berkala.
- Mengontrol modul **Arsip Digital**, melakukan Smart Scan E-SPPT, Kompresi file gajah, dan Restore.
- Penugasan massal petugas (**Smart Selection**) berdasarkan wilayah/filter.
- Mengelola akun pengguna (buat, edit, reset password, hapus).

### 📱 PENARIK — Kepala Dusun / Petugas Lapangan
- Antarmuka mobile-friendly, ringan di HP.
- Mengubah status WP: **Belum Lunas** → **Lunas**.
- Rotasi Wajib Pajak antar petugas dengan sistem persetujuan (Request/Transfer).

### 🛡️ PENGGUNA — Staf / Akun Baru
- Peran default saat akun pertama kali dibuat (View-Only).
- Hak akses baca laporan dan data tanpa izin modifikasi.

---

## 🛠️ Buku Panduan

Kami menyediakan berbagai panduan spesifik yang terpisah untuk mempermudah Anda:

### 🔰 1. Panduan Instalasi Pemula
Jika Anda baru pertama kali mencoba menjalankan aplikasi berbasis web di komputer, silakan baca dokumentasi rinci ini:
👉 **[PANDUAN_INSTALASI.md](./PANDUAN_INSTALASI.md)**

### 📂 2. Panduan Arsip Digital E-SPPT (Khusus Petugas IT)
Tata cara menggunakan fitur pencarian arsip warka cerdas, cara mengekstrak PDF Bapenda yang berisi ribuan lembar secara kilat, dan petunjuk teknis terkait kompresi serta migrasi / *backup*:
👉 **[PANDUAN_ARSIP_DIGITAL.md](./PANDUAN_ARSIP_DIGITAL.md)**

---

## 🚀 Instalasi Singkat (Sangat Mudah)

Kini jauh lebih cepat! Anda tidak perlu lagi melakukan konfigurasi manual yang rumit. Cukup:

1. **Clone Repo:**
   ```bash
   git clone https://github.com/balongbesuk/pbb-app.git
   cd pbb-app
   ```

2. **Instalasi & Setup Otomatis:**
   Jalankan satu perintah ini untuk mendownload kebutuhan sekaligus menyiapkan database otomatis:
   ```bash
   npm install
   ```

3. **Jalankan Aplikasi:**
   ```bash
   # Mode Development
   npm run dev

   # Mode Production (Standar VPS)
   npm run build
   npm run start
   ```

**Akun Default:** `admin` / `admin123`

---

## 🔄 Update Aplikasi ke Versi Terbaru (v6.0)

Jika Anda sudah menggunakan versi lama, cukup jalankan ini untuk memperbaruinya ke v6.0:

```bash
git pull origin main
npm install
npm run build
npm run start
```
*Script otomatis kami akan mengurus pembaruan database dan konfigurasi di latar belakang.*

---

*Dibuat oleh Tim Digitalisasi PBB Desa — Terakhir Diperbarui: Maret 2026*
