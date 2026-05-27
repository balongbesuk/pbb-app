<img width="2536" height="923" alt="PBB Manager Dashboard" src="https://github.com/user-attachments/assets/d540a662-121b-41d0-8882-5cb8455aa37b" />

<div align="center">

# PBB Manager

**Sistem Manajemen Pajak Bumi & Bangunan Tingkat Desa**
*All-in-one platform untuk digitalisasi penagihan PBB, pemetaan GIS wilayah, arsip SPPT digital, dan aplikasi petugas lapangan.*

[![Next.js](https://img.shields.io/badge/Next.js_16-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Expo SDK 55](https://img.shields.io/badge/Expo_SDK_55-000020?logo=expo&logoColor=white)](https://expo.dev)
[![Prisma](https://img.shields.io/badge/Prisma_7.8-2D3748?logo=prisma&logoColor=white)](https://prisma.io)
[![SQLite](https://img.shields.io/badge/SQLite_WAL-003B57?logo=sqlite&logoColor=white)](https://sqlite.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase_FCM-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Version](https://img.shields.io/badge/v10.1.0-blue)](./CHANGELOG.md)

[📖 Panduan Instalasi](./docs/PANDUAN_INSTALASI.md) · [📲 Panduan Notifikasi](./docs/PANDUAN_NOTIFIKASI.md) · [📘 Wiki Teknis](./docs/WIKI.md) · [📋 Changelog](./CHANGELOG.md) · [🔒 Security](./SECURITY.md)

</div>

---

## ✨ Kenapa PBB Manager?

PBB Manager dibangun khusus untuk menyelesaikan masalah nyata pengelolaan pajak di tingkat desa — mulai dari pencatatan manual yang rawan hilang, kesulitan pemantauan pembayaran real-time, hingga distribusi SPPT yang tidak efisien. Sistem ini menggabungkan **dashboard web admin**, **peta GIS interaktif**, **portal layanan warga**, dan **aplikasi mobile petugas lapangan** dalam satu platform terintegrasi.

### Perbandingan dengan Cara Konvensional

| Aspek | ❌ Cara Lama | ✅ PBB Manager |
|---|---|---|
| **Pencatatan** | Buku DHKP fisik rawan rusak/hilang | Database digital terenkripsi + backup otomatis |
| **Monitoring** | Rekap manual akhir bulan | Dashboard real-time per wilayah + heatmap GIS |
| **Distribusi SPPT** | Cetak massal, bagi manual | Smart Scan + arsip digital per NOP |
| **Penagihan** | Petugas bawa buku tebal | Aplikasi mobile ringan + update status instan |
| **Layanan Warga** | Datang ke kantor desa | Portal mandiri 24/7 + cetak kwitansi online |
| **Keamanan Data** | File Excel tanpa proteksi | PIN NOP + rate limiting + XSS/CSRF protection |

---

## 🏗️ Arsitektur & Teknologi

```
┌──────────────────────────────────────────────────────────────────┐
│                        PBB Manager v10.1.0                       │
├──────────────────┬──────────────────┬────────────────────────────┤
│   Web Dashboard  │  Portal Publik   │    PBB Mobile v2.1.0       │
│   (Admin/Petugas)│  (Warga)         │    (Petugas Lapangan)     │
│                  │                  │                            │
│  Next.js 16      │  Turnstile CAPTCHA│  Expo SDK 55             │
│  React 19        │  PIN NOP 4-Digit │  React Native 0.85        │
│  Tailwind CSS 4  │  NOP Masking     │  NativeWind               │
├──────────────────┴──────────────────┴────────────────────────────┤
│                     API Layer (Next.js App Router)               │
│            Server Actions · REST API · JWT Auth                  │
├──────────────────────────────────────────────────────────────────┤
│                    Prisma 7.8 ORM + SQLite (WAL Mode)            │
│          PRAGMA synchronous=NORMAL · busy_timeout=5000           │
└──────────────────────────────────────────────────────────────────┘
```

| Layer | Teknologi | Keterangan |
|---|---|---|
| **Frontend Web** | Next.js 16, React 19, Tailwind CSS 4 | SSR/SSG, React Compiler, App Router |
| **Mobile** | Expo SDK 55, React Native 0.85 | APK/AAB via EAS Build |
| **Database** | Prisma 7.8 + SQLite (WAL) | Portabel, zero-config, concurrent reads |
| **Auth** | NextAuth v4 + JWT (Mobile) | Session-based (web), Bearer token (mobile) |
| **GIS** | Leaflet + React-Leaflet | GPX ingestion, heatmap, polygon overlay |
| **Security** | Cloudflare Turnstile, bcrypt, DOMPurify | CAPTCHA, hashing, sanitization |

---

## 🔐 Keamanan (v10.0 — Deep Hardening)

PBB Manager v10.0 menerapkan pengamanan berlapis untuk melindungi privasi data wajib pajak:

- **🔑 PIN NOP 4-Digit** — Akses data sensitif (salin NOP, cetak kwitansi, unduh E-SPPT, pengajuan mutasi) wajib verifikasi 4 digit terakhir NOP dari SPPT fisik
- **🛡️ NOP Masking** — Semua NOP di portal publik dan peta GIS otomatis disensor (`35.17.XXX.XXX-XXXX.X`)
- **⏱️ Rate Limiting** — Maks. 5 percobaan PIN salah → blokir IP selama 15 menit
- **🤖 Cloudflare Turnstile** — Bot protection dengan rendering eksplisit, SPA-safe lifecycle
- **🔒 Mobile API Guard** — JWT validation ketat di seluruh endpoint petugas
- **📦 Zip Slip Protection** — Path traversal guard pada restore database
- **🧹 XSS Protection** — Sanitasi metadata GIS dan input pengguna via DOMPurify
- **🕵️ Anti-Indexing** — Triple-shield: `X-Robots-Tag` + meta robots + `robots.txt`

> Detail lengkap: [SECURITY.md](./SECURITY.md) · [Wiki Keamanan](./docs/WIKI.md#hardening--keamanan-skala-tinggi-update-v100)

---

## 📦 Fitur Unggulan

<details>
<summary><strong>🗺️ GIS Command Center</strong></summary>

- Peta interaktif dengan layer Dusun/RT/RW dan citra satelit
- Heatmap gradasi warna berdasarkan persentase pelunasan wilayah
- Upload massal file GPX dengan auto-detect metadata dari nama file
- Detail WP belum bayar langsung dari popup peta
- NOP tersensor di peta publik, transparan di peta admin
</details>

<details>
<summary><strong>📱 PBB Mobile v2.1.0 (Petugas Lapangan)</strong></summary>

- Login dengan JWT Bearer Token & koneksi server dinamis berbasis domain VPS desa
- Pencarian WP cepat dengan lazy loading untuk ribuan data
- Update status pembayaran real-time dari lapangan
- Timeline penagihan harian sebagai bukti audit
- **Push Notification Instan (Double-Strike FCM/Expo)** dengan prioritas Doze Mode Android
- **Deep Linking Navigasi Cerdas**: Ketuk notifikasi untuk langsung menuju detail WP
- Build APK/AAB otomatis via EAS Build
</details>

<details>
<summary><strong>📄 Smart Scan Arsip Digital</strong></summary>

- Unggah file E-SPPT massal dari Bapenda (ribuan halaman)
- Algoritma pemecahan otomatis per NOP
- Pratinjau dan unduh SPPT personal melalui portal
- Kompresi arsip otomatis untuk efisiensi penyimpanan
</details>

<details>
<summary><strong>🏛️ Portal Layanan Warga</strong></summary>

- Cek tagihan mandiri 24/7 tanpa login
- Cetak kwitansi A6 resmi & unduh E-SPPT PDF
- Pengajuan mutasi (Waris, Jual Beli, Hibah) dengan generate dokumen .docx
- Cek status pembayaran Bapenda real-time
- Redirect pembayaran online EPAY Jombang
</details>

<details>
<summary><strong>📊 Dashboard & Laporan</strong></summary>

- Statistik realisasi real-time per Dusun/RT/RW
- Grafik performa pembayaran dan trend tahunan
- Export laporan Excel/PDF untuk kebutuhan pelaporan
- Sinkronisasi data dengan DHKP Bapenda (Smart Sync)
- **Web Push Notifications Asli** untuk info delegasi tugas real-time di layar Desktop/Browser
</details>

---

## 🔒 Hirarki Akses

| Role | Platform | Kemampuan |
|---|---|---|
| **ADMIN** | Web Dashboard | Konfigurasi penuh: GIS, arsip, sinkronisasi data, manajemen pengguna, backup/restore |
| **PETUGAS** | PBB Mobile | Penagihan lapangan: update status bayar, pencarian WP, riwayat transaksi harian |
| **WARGA** | Portal Publik | Layanan mandiri: cek tagihan, cetak kwitansi, unduh E-SPPT, ajukan mutasi (setelah verifikasi PIN) |

---

## 🚀 Instalasi Cepat

**Prasyarat**: [Node.js v20+](https://nodejs.org) · [Git](https://git-scm.com)

```bash
# 1. Clone repository
git clone https://github.com/balongbesuk/pbb-app.git
cd pbb-app

# 2. Install & setup otomatis (database + seed + env)
npm install

# 3. Jalankan development server
npm run dev
```

Buka `http://localhost:3000` — Login default: `admin` / `admin123`

### Mobile App (Opsional)

```bash
cd pbb-mobile
npm install
npx expo start
```

> 📘 Panduan lengkap: [Panduan Instalasi](./docs/PANDUAN_INSTALASI.md) · [Checklist Produksi](./docs/CHECKLIST_PRODUCTION.md)

---

## 📚 Dokumentasi

| Dokumen | Deskripsi |
|---|---|
| [📖 Panduan Instalasi](./docs/PANDUAN_INSTALASI.md) | Setup server, konfigurasi database, inisialisasi awal |
| [📲 Panduan Push Notifikasi](./docs/PANDUAN_NOTIFIKASI.md) | Setup notifikasi ganda FCM + Web VAPID untuk desa |
| [📘 Wiki Teknis & Keamanan](./docs/WIKI.md) | Arsitektur, hardening, indeks teknis GIS |
| [📱 Panduan Mobile Build](./pbb-mobile/README.md) | Build APK/AAB dengan EAS Build |
| [📋 Dokumentasi Penggunaan](./docs/DOKUMENTASI_PENGGUNAAN.md) | Panduan operasional harian admin & petugas |
| [✅ Checklist Produksi](./docs/CHECKLIST_PRODUCTION.md) | Environment, backup, proxy, hardening sebelum go-live |
| [📋 Changelog](./CHANGELOG.md) | Riwayat perubahan semua versi |
| [🔒 Security Policy](./SECURITY.md) | Kebijakan keamanan & cara melaporkan kerentanan |

---

## 🤝 Kontribusi

Kontribusi dalam bentuk apapun sangat diapresiasi! Silakan buka **Issue** untuk melaporkan bug atau **Pull Request** untuk perbaikan dan fitur baru.

1. Fork repository ini
2. Buat branch fitur: `git checkout -b fitur/fitur-baru`
3. Commit perubahan: `git commit -m "feat: tambah fitur baru"`
4. Push ke branch: `git push origin fitur/fitur-baru`
5. Buka Pull Request

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](./LICENSE) — bebas digunakan, dimodifikasi, dan didistribusikan.

---

<div align="center">

**Dikembangkan untuk kemajuan digitalisasi desa di Indonesia** 🇮🇩

*Dibuat dengan ❤️ oleh [Balongbesuk](https://github.com/balongbesuk) · Terakhir diperbarui: Mei 2026*

</div>
