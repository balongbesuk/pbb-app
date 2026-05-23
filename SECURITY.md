# Kebijakan Keamanan — PBB Manager

Keamanan data wajib pajak desa adalah prioritas absolut kami. Dokumen ini menjelaskan versi yang didukung, langkah-langkah keamanan yang diterapkan, dan cara melaporkan kerentanan.

---

## Versi yang Didukung

| Versi | Status | Catatan |
|---|---|---|
| **10.0.x** | ✅ Didukung penuh | Deep Security Hardening, NOP PIN, Zip Slip patch |
| **9.0.x** | ⚠️ Patch kritis saja | Mobile API auth fix tersedia di v10.0 |
| **8.x** | ❌ Tidak didukung | Upgrade ke v10.0 sangat dianjurkan |
| **< 8.0** | ❌ Tidak didukung | Mengandung kerentanan yang sudah diketahui |

> **Rekomendasi**: Selalu gunakan versi terbaru. Jalankan `git pull` dan `npm install` secara berkala.

---

## Arsitektur Keamanan

PBB Manager menerapkan model pertahanan berlapis (*defense-in-depth*) untuk melindungi data wajib pajak di seluruh permukaan serangan:

### 🔑 Proteksi Akses Data (PIN NOP)

| Mekanisme | Detail |
|---|---|
| **NOP Masking** | Semua NOP di portal publik dan peta GIS otomatis disensor menjadi `35.17.XXX.XXX-XXXX.X` sebelum dikirim ke klien |
| **PIN 4-Digit** | Akses data sensitif (salin NOP, cetak kwitansi, unduh E-SPPT, ajukan mutasi) memerlukan 4 digit terakhir NOP dari SPPT fisik |
| **Rate Limiting** | Maksimal 5 percobaan PIN salah per 15 menit per IP, implementasi server-side via `checkRateLimit` dengan fallback SQLite/in-memory |
| **Pemisahan Admin/Publik** | Admin melihat NOP lengkap tanpa sensor di dashboard, publik selalu tersensor |

### 🛡️ Autentikasi & Otorisasi

| Mekanisme | Detail |
|---|---|
| **Web Auth** | NextAuth v4 dengan session berbasis cookie HttpOnly, password di-hash menggunakan bcrypt |
| **Mobile Auth** | JWT Bearer Token dengan validasi `requireMobileAuth` di setiap endpoint petugas |
| **Role-Based Access** | Tiga level: ADMIN (penuh), PETUGAS/PENARIK (operasional lapangan), WARGA (portal publik terbatas) |
| **Forced Password Change** | Akun baru wajib ganti password default saat pertama kali login |

### 🤖 Bot Protection & Anti-Scraping

| Mekanisme | Detail |
|---|---|
| **Cloudflare Turnstile** | CAPTCHA invisible dengan rendering eksplisit, SPA-safe lifecycle antar tab |
| **Anti-Indexing** | Triple-shield: header `X-Robots-Tag: noindex, nofollow` + meta tag robots + `robots.txt` restrictive |
| **NOP Masking** | Mencegah mass data scraping melalui enumerasi NOP di portal publik |

### 📦 Keamanan Sistem File & API

| Kerentanan | Mitigasi |
|---|---|
| **Zip Slip (Path Traversal)** | Fungsi `resolveSafeChildPath` pada restore database, mencegah penulisan file di luar direktori target |
| **Broken Authentication (Mobile)** | Validasi JWT ketat di seluruh method GET/POST endpoint `/api/mobile/*` |
| **Stored XSS (GIS)** | Sanitasi metadata wilayah GPX menggunakan DOMPurify sebelum rendering di tooltip peta |
| **CSRF** | Proteksi bawaan NextAuth dengan CSRF token pada semua form |

### 🔐 Keamanan Infrastruktur

| Aspek | Rekomendasi |
|---|---|
| **NEXTAUTH_SECRET** | Wajib diganti dari default. Gunakan: `openssl rand -base64 32` |
| **Password Admin** | Ganti password default `admin123` segera setelah instalasi |
| **Environment** | Set `NODE_ENV=production` di server produksi |
| **HTTPS** | Wajib menggunakan reverse proxy (Nginx/Caddy) dengan SSL di produksi |
| **Backup** | Aktifkan backup terjadwal via fitur bawaan. Database SQLite mudah di-backup sebagai satu file |
| **Turnstile Keys** | Ganti kunci testing Cloudflare dengan kunci produksi saat deploy |

---

## Audit Keamanan v10.0

Berikut ringkasan temuan dan perbaikan audit keamanan yang dilakukan pada v10.0:

| ID | Kerentanan | Severity | Status |
|---|---|---|---|
| SEC-01 | Broken Authentication pada Mobile API | 🔴 Kritis | ✅ Ditambal |
| SEC-02 | Zip Slip Path Traversal pada Restore | 🔴 Kritis | ✅ Ditambal |
| SEC-03 | Kredensial Default Tidak Dirotasi | 🟡 Sedang | ✅ Didokumentasikan |
| SEC-04 | NOP Terekspos di Portal Publik | 🟡 Sedang | ✅ Ditambal (Masking) |
| SEC-05 | Akses Data Sensitif Tanpa Verifikasi | 🟡 Sedang | ✅ Ditambal (PIN NOP) |

---

## Dependency Security

Kami secara aktif memonitor dan menerapkan override untuk dependensi yang memiliki kerentanan:

```bash
# Cek status keamanan dependensi
npm run verify:security

# Atau manual
npm audit --audit-level=moderate
```

Override yang diterapkan di `package.json`:
- `qs` → 6.15.2 (prototype pollution fix)
- `tar` → 7.5.13 (path traversal fix)
- `path-to-regexp` → 8.4.0 (ReDoS fix)
- `minimist` → 1.2.8 (prototype pollution fix)
- Dan lainnya — lihat bagian `overrides` di [package.json](./package.json)

---

## Melaporkan Kerentanan

Jika Anda menemukan kerentanan keamanan pada PBB Manager, **jangan membuka Issue publik**. Sebagai gantinya:

1. **Email**: Kirim laporan detail ke **[Security Advisory](https://github.com/balongbesuk/pbb-app/security/advisories/new)** melalui fitur GitHub Private Security Advisory
2. **Isi laporan dengan**:
   - Deskripsi kerentanan
   - Langkah-langkah reproduksi (jika memungkinkan)
   - Dampak potensial
   - Saran perbaikan (opsional)
3. **Respons**: Kami akan merespons dalam waktu **72 jam kerja** dan memberikan update status secara berkala
4. **Pengakuan**: Pelapor yang valid akan dicantumkan di changelog (kecuali diminta anonim)

### Cakupan Pelaporan

| Dalam Cakupan | Di Luar Cakupan |
|---|---|
| Bypass autentikasi/otorisasi | Serangan DDoS volumetrik |
| Injeksi SQL/XSS/CSRF | Social engineering |
| Path traversal / file inclusion | Kerentanan di dependensi upstream yang sudah diketahui publik |
| Kebocoran data NOP/wajib pajak | Masalah di infrastruktur hosting pengguna |
| Bypass PIN NOP / rate limiting | Kerentanan di browser/OS pengguna |

---

## Praktik Terbaik untuk Deployer

Checklist keamanan sebelum deploy ke produksi:

- [ ] Ganti `NEXTAUTH_SECRET` dengan string acak 32+ karakter
- [ ] Ganti password admin default (`admin123`)
- [ ] Set `NODE_ENV=production`
- [ ] Pasang reverse proxy (Nginx/Caddy) dengan HTTPS/SSL
- [ ] Konfigurasi Cloudflare Turnstile dengan kunci produksi
- [ ] Aktifkan backup database terjadwal
- [ ] Batasi akses port 3000 hanya dari reverse proxy
- [ ] Review log aktivitas secara berkala di menu Log Aktivitas

> 📋 Detail lengkap: [Checklist Produksi](./docs/CHECKLIST_PRODUCTION.md)

---

*Terakhir diperbarui: 23 Mei 2026 (v10.0)*
