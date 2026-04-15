<img width="2536" height="923" alt="PBB Manager Dashboard" src="https://github.com/user-attachments/assets/d540a662-121b-41d0-8882-5cb8455aa37b" />

# PBB Manager — Fitur Unggulan PBB Mobile `v9.0`

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-61DAFB?logo=react)](https://reactnative.dev)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma)](https://prisma.io)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![Version](https://img.shields.io/badge/Version-9.0.0-blue)](https://github.com/balongbesuk/pbb-app/tags)

**PBB Manager v9.0 (PBB Mobile Excellence)** membawa integrasi revolusioner antara dashboard web administratif dengan operasional petugas di lapangan melalui aplikasi mobile yang telah dimodernisasi. Menghadirkan performa tinggi untuk penanganan data besar, sistem notifikasi cerdas, dan pengalaman pengguna (*Experience Polish*) yang setara dengan aplikasi perbankan modern. Dirancang untuk efisiensi total dalam pemungutan PBB desa, mulai dari penagihan *real-time*, manajemen wajib pajak masif, hingga pemetaan spasial (GIS) yang instan.

---

## Fitur Unggulan v9.0 (Mobile & Core)

| Fitur | Deskripsi |
|---|---|
| **PBB Mobile v9.0** | **BARU (v9.0):** Aplikasi petugas dengan UI Premium Mode, mendukung statistik nominal *real-time* dan progres bar realisasi per petugas. |
| **Taxpayer Lazy Load** | **BARU (v9.0):** Sistem paging cerdas pada aplikasi mobile untuk memuat ribuan data Wajib Pajak secara ringan dan cepat. |
| **Billing Activity Timeline** | **BARU (v9.0):** Log aktivitas penagihan lengkap dalam format timeline, memudahkan petugas melakukan audit harian langsung dari HP. |
| **Smart Notifications** | **BARU (v9.0):** Sistem pemberitahuan *real-time* untuk petugas (permintaan transfer, info sistem) dengan indikator badge cerdas. |
| **GIS Command Center v2.0** | Dashboard peta interaktif berbasis GeoJSON/GPX untuk manajemen wilayah RT/RW/Dusun secara visual dengan layer citra satelit. |
| **Bapenda Sync Resilience** | Penanganan error sinkronisasi Bapenda yang tangguh dan penyisipan parameter NOP otomatis ke portal pajak daerah. |
| **Portal Mutasi (Self-Service)** | Memungkinkan warga mengajukan perubahan data (Hibah, Waris, Jual Beli) dan mencetak draf dokumen (.docx). |
| **Smart Scan Archive** | Algoritma ekstraksi otomatis yang memecah ribuan lembar E-SPPT menjadi file personal berdasarkan NOP secara instan. |

---

## Hirarki Akses

Sistem keamanan berlapis untuk menjaga integritas data desa:

*   **ADMIN (Kepala Desa / Admin IT)**: Memegang kendali penuh atas konfigurasi instansi, GIS, sinkronisasi data pusat, pengelolaan arsip digital, dan manajemen akun pengguna.
*   **PETUGAS (Kepala Dusun / Penarik)**: Menggunakan **PBB Manager Mobile** untuk pembaruan status bayar di lapangan, manajemen wajib pajak, dan memonitor riwayat penagihan harian.
*   **PENGGUNA (Warga)**: Akses terbatas untuk cek tagihan mandiri dan pengajuan mutasi SPPT.

---

## Dokumentasi & Panduan

Kami telah menyusun panduan lengkap agar Anda dapat mengoperasikan sistem ini dengan mudah:

1.  **[Wiki Teknis & Keamanan](./docs/WIKI.md)**: Ringkasan arsitektur, hardening keamanan, dan indeks teknis GIS.
2.  **[Panduan Instalasi Pemula](./docs/PANDUAN_INSTALASI.md)**: Langkah demi langkah instalasi dari nol untuk pengguna baru.
3.  **[Panduan Mobile App Build](./pbb-mobile/README.md)**: Petunjuk cara build file APK menggunakan EAS Build.
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
   # Mode Pengembangan (Backend)
   npm run dev

   # Jalankan Mobile (Expo)
   cd pbb-mobile
   npx expo start
   ```

---

*Dikembangkan untuk kemajuan digitalisasi desa di Indonesia.*
*Terakhir Diperbarui: April 2026*
