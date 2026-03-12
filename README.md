# 🏦 PBB Manager — Sistem Manajemen Pajak Desa `v2.0`

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma)](https://prisma.io)
[![Version](https://img.shields.io/badge/Version-2.0-blue)](https://github.com/balongbesuk/pbb-app/tags)
[![License](https://img.shields.io/badge/License-MIT-blue)](./LICENSE)

**PBB Manager v2.0** hadir dengan update besar **"Smart Sync & Global Management"** untuk tata kelola pendataan, penagihan, dan pelaporan Pajak Bumi dan Bangunan (PBB) yang lebih efisien, akurat, dan profesional.

---

## ✨ Fitur Unggulan v2.0

| Fitur | Deskripsi |
|---|---|
| **Smart Sync (Excel)** | **BARU:** Update data via Excel tanpa menghapus data lama. Sinkronisasi cerdas NOP, status, dan nominal secara otomatis. |
| **Global Allocation** | **BARU:** Alokasi masal ribuan data hasil filter ke penarik dalam satu klik, tanpa terbatas paginasi. |
| **Auto Normalization** | **BARU:** Standarisasi otomatis format RT/RW menjadi 2 digit (01, 02) untuk keakuratan laporan wilayah. |
| **Dashboard Real-Time** | Pantau tren realisasi harian, statistik wilayah, dan performa petugas secara langsung |
| **Portal Warga Modern** | Pencarian tagihan publik dengan efek *glassmorphism*, pencarian cepat, dan desain premium |
| **Branding Dinamis** | Ubah logo desa, nama desa, kecamatan, dan kabupaten langsung dari menu Pengaturan |
| **Audit Trail** | Rekam seluruh aktivitas: login, perubahan status, rotasi hak akses — tidak bisa dimanipulasi |
| **Backup & Restore** | Unduh backup database sewaktu-waktu; pulihkan jika terjadi kesalahan |

---

## 👥 Sistem Peran (*Role System*)

Tiga level akses untuk menjaga integritas data pajak:

### 👑 ADMIN — Kepala Desa / Petugas IT / Admin PBB
- Kontrol penuh terhadap seluruh sistem & pengaturan profil instansi
- Mengaktifkan **Smart Sync** untuk pembaruan data DHKP tahunan/berkala
- Penugasan massal petugas (**Smart Selection**) berdasarkan wilayah/filter
- Mengelola akun pengguna (buat, edit, reset password, hapus)
- Memantau Log Aktivitas seluruh pengguna & Backup/Restore data

### 📱 PENARIK — Kepala Dusun / Petugas Lapangan
- Antarmuka mobile-friendly, ringan di HP
- Mengubah status WP: **Belum Lunas** → **Lunas**
- Rotasi Wajib Pajak antar petugas dengan sistem persetujuan (Request/Transfer)

### 🛡️ PENGGUNA — Staf / Akun Baru
- Peran default saat akun pertama kali dibuat (View-Only)
- Hak akses baca laporan dan data tanpa izin modifikasi

---

## 🛠️ Panduan Instalasi (Development)

### Persyaratan
- **Node.js** versi 20 LTS atau lebih baru  
- **Git**

### Step-by-Step

```bash
# 1. Clone & Install
git clone https://github.com/balongbesuk/pbb-app.git
cd pbb-app
npm install

# 2. Setup Database & Seed
npx prisma generate
npx prisma db push
npx prisma db seed
```

**Akun Default:** `admin` / `admin123`

---

## 🔄 Update Aplikasi ke v2.0

Jika Anda sudah memiliki versi lama, silakan lakukan pembersihan dan update:

```bash
git pull origin main
npm install
npx prisma db push
npm run build
npm run start
```

---

*Dibuat oleh Tim Digitalisasi PBB Desa — Terakhir Diperbarui: 13 Maret 2026*
