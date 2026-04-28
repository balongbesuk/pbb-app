# Checklist Produksi PBB Manager

Checklist ini merangkum pengamanan dan hardening dasar sebelum aplikasi dipakai di lingkungan produksi.

## 1. Environment

- Gunakan `NEXTAUTH_SECRET` acak dan panjang.
- Ganti `ADMIN_PASSWORD` dan `DEFAULT_USER_PASSWORD` dengan nilai kuat.
- Atur `NEXTAUTH_URL` ke domain produksi yang benar.
- Simpan `STORAGE_ROOT` di luar root project.
- Set `TRUST_PROXY=true` hanya jika aplikasi benar-benar berada di belakang proxy tepercaya.
- Jangan commit file `.env` produksi ke repository.

## 2. Database dan Backup

- Pastikan `DATABASE_URL` menunjuk file SQLite produksi yang benar.
- Simpan backup database terpisah dari folder aplikasi aktif.
- Uji restore backup di lingkungan maintenance, bukan di server live yang sedang dipakai user.
- Untuk restore manual gunakan:

```bash
node scripts/restore-database-from-backup.mjs path-ke-backup.zip
```

## 3. Reverse Proxy

- Gunakan Nginx / Cloudflare / platform hosting tepercaya di depan aplikasi.
- Hanya aktifkan `TRUST_PROXY=true` jika proxy itu memang milik Anda / tepercaya.
- Jangan percaya `x-forwarded-for` dari client langsung.
- Batasi ukuran upload juga di level proxy, bukan hanya di aplikasi.

## 4. File Upload

- Global `serverActions.bodySizeLimit` sudah diturunkan ke `25mb`.
- Tetap pastikan limit upload di proxy konsisten.
- Simpan folder upload dan storage dengan permission minimum yang diperlukan.

## 5. Akses dan Session

- Gunakan HTTPS di produksi.
- Pastikan cookie auth hanya berjalan di domain yang benar.
- Audit role `ADMIN`, `PENARIK`, dan `PENGGUNA` sebelum go-live.
- Nonaktifkan akun yang tidak dipakai lagi.

## 6. Mobile API

- Pastikan aplikasi mobile selalu mengirim `Authorization: Bearer <token>`.
- Jangan izinkan endpoint mobile membaca identitas user dari body request.
- Uji ulang endpoint officer setelah deploy untuk memastikan role enforcement tetap aktif.

## 7. Rate Limit

- Rate limiter sekarang memakai backend SQLite persisten dengan fallback memory.
- Untuk single-instance production ini sudah lebih aman daripada limiter memory murni.
- Jika nanti aplikasi dijalankan multi-instance, pindahkan rate limit ke Redis/shared backend.

## 8. Logging dan Monitoring

- Pantau error log untuk:
  - restore job
  - smart scan job
  - map restore job
  - Bapenda sync
- Simpan log backup/restore dan audit login secara berkala.

## 9. Verifikasi Sebelum Go-Live

- Jalankan:

```bash
npm run build
```

- Pastikan build sukses.
- Uji login admin dan penarik.
- Uji pencarian publik.
- Uji upload arsip PDF.
- Uji smart scan.
- Uji backup arsip dan backup peta.
- Uji restore arsip dan restore peta.

## 10. Langkah Lanjutan yang Disarankan

- Gunakan Redis untuk rate limit jika app sudah multi-instance.
- Pertimbangkan pindah dari SQLite ke database server jika trafik dan concurrency naik.
- Tambahkan maintenance mode eksplisit jika ingin operasi administratif berat lebih aman.
