<img width="2536" height="923" alt="PBB Manager Dashboard" src="https://github.com/user-attachments/assets/d540a662-121b-41d0-8882-5cb8455aa37b" />

# PBB Manager — Keamanan Maksimal & PIN NOP `v10.0`

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-61DAFB?logo=react)](https://reactnative.dev)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma)](https://prisma.io)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![Version](https://img.shields.io/badge/Version-10.0.0-blue)](https://github.com/balongbesuk/pbb-app/tags)

**PBB Manager v10.0 (Deep Security Hardening & NOP PIN Protection)** menghadirkan peningkatan keamanan skala penuh untuk melindungi data privasi wajib pajak desa dari scraping massal dan akses tidak sah. Dengan integrasi Cloudflare Turnstile, sistem verifikasi Kunci 4-Digit NOP fisik untuk pencarian warga dan peta GIS publik, perlindungan brute-force PIN dengan penguncian sesi, penambalan celah autentikasi API Mobile, perlindungan Zip Slip, serta sinkronisasi pembayaran Bapenda secara instan dan tangguh.

---

## Fitur Utama v10.0 (Security & Core)

| Fitur | Deskripsi |
|---|---|
| **NOP PIN Protection** | **BARU (v10.0):** Akses salin NOP asli, cetak kwitansi, pratinjau E-SPPT PDF, dan pengajuan LSPOP/Mutasi diwajibkan melewati verifikasi 4-digit terakhir NOP fisik warga dengan proteksi brute-force IP. |
| **GIS Map Public Hardening** | **BARU (v10.0):** Sensor otomatis NOP pada peta GIS publik, verifikasi PIN dinamis saat warga mengakses opsi pembayaran dari peta, serta *bypass* akses penuh tanpa sensor bagi administrator. |
| **Turnstile Lifecycle SPA** | **BARU (v10.0):** Widget Cloudflare Turnstile ter-render secara programmatic dan instan saat berpindah tab tanpa perlu refresh peramban secara manual. |
| **Zip Slip & API Protection** | **BARU (v10.0):** Penambalan celah Broken Authentication pada API Mobile dengan pengamanan token JWT ketat, serta penambalan celah ekstraksi ZIP (Zip Slip) menggunakan `resolveSafeChildPath`. |
| **PBB Mobile v1.2.0** | Aplikasi petugas dengan otentikasi Bearer Token ketat, dukungan aksi interaktif (Update Status, Transfer Respons), dan integrasi EPAY Jombang. |
| **Bapenda Sync Resilience** | Sinkronisasi pembayaran Bapenda real-time yang tangguh, penanganan error latensi/SSL, dan integrasi pemicu popup tagihan belum terbayar. |
| **Portal Mutasi (Self-Service)** | Memungkinkan warga mengajukan perubahan data (Hibah, Waris, Jual Beli) dan mencetak draf dokumen (.docx) setelah lolos verifikasi PIN. |
| **Smart Scan Archive** | Algoritma ekstraksi otomatis yang memecah ribuan lembar E-SPPT menjadi file personal berdasarkan NOP secara instan dan disajikan melalui tautan aman server-side. |

---

## Hirarki Akses

Sistem keamanan berlapis untuk menjaga integritas data desa:

*   **ADMIN (Kepala Desa / Admin IT)**: Memegang kendali penuh atas konfigurasi instansi, GIS, sinkronisasi data pusat, pengelolaan arsip digital, dan manajemen akun pengguna.
*   **PETUGAS (Kepala Dusun / Penarik)**: Menggunakan **PBB Manager Mobile** untuk pembaruan status bayar di lapangan, manajemen wajib pajak, dan memonitor riwayat penagihan harian.
*   **PENGGUNA (Warga)**: Akses terbatas untuk cek tagihan mandiri, cetak PDF, pratinjau berkas, dan pengajuan mutasi SPPT setelah melewati verifikasi PIN.

---

## Dokumentasi & Panduan

Kami telah menyusun panduan lengkap agar Anda dapat mengoperasikan sistem ini dengan mudah:

1.  **[Wiki Teknis & Keamanan](./docs/WIKI.md)**: Ringkasan arsitektur, hardening keamanan, dan indeks teknis GIS.
2.  **[Panduan Instalasi Pemula](./docs/PANDUAN_INSTALASI.md)**: Langkah demi langkah instalasi dari nol untuk pengguna baru.
3.  **[Panduan Mobile App Build](./pbb-mobile/README.md)**: Petunjuk cara build file APK menggunakan EAS Build.
4.  **[Dokumentasi Penggunaan](./docs/DOKUMENTASI_PENGGUNAAN.md)**: Panduan operasional fitur harian bagi admin dan petugas.
5.  **[Checklist Produksi](./docs/CHECKLIST_PRODUCTION.md)**: Pemeriksaan environment, backup, proxy, upload, dan hardening sebelum go-live.

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
*Terakhir Diperbarui: Mei 2026*
