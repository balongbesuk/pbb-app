# PBB Mobile v2.1.0 — Panduan Build APK & Development
<img width="100%" alt="PBB Mobile Banner" src="https://github.com/user-attachments/assets/1cc7b3c6-030e-49c1-a388-33af515376bc" />


Dokumen ini berisi panduan teknis untuk melakukan build aplikasi **PBB Mobile** menjadi file APK (Android) menggunakan layanan **EAS Build (Expo Application Services)**.

---

## 🌟 Sorotan Fitur Baru v2.1
- **Dukungan Deep-Linking Notifikasi**: Mengetuk *push notification* otomatis mengarahkan petugas langsung menuju halaman rincian detail Wajib Pajak bersangkutan secara instan.
- **Ketahanan Startup Simulator (Anti-Crash)**: Logika pendaftaran token perangkat dibalut *nested try-catch* yang menjamin kestabilan aplikasi agar tidak mengalami *crash* saat dijalankan di emulator Android / perangkat tanpa Google Play Services terpasang.
- **Pengesampingan Doze Mode & Shared Gateway**: Penyelarasan notifikasi prioritas tinggi (`priority: 'high'`) agar tetap berbunyi saat HP tertidur dalam mode Doze, serta toleransi pendelegasian push via gerbang bersama (*shared gateway*) untuk arsitektur server desa mandiri (*self-hosted*).
- **Sinkronisasi Tagihan Bapenda Otomatis**: Mengecek tagihan ke Bapenda pusat langsung dari aplikasi.
- **Keamanan Peta GIS NOP PIN**: Sistem proteksi warga yang memblokir NOP dengan PIN 4-digit untuk menghindari pencurian privasi.
- **Data Wajib Pajak Presisi**: Dilengkapi saringan (filter) pintar untuk mendeteksi status "Belum Lunas" dengan satu tombol.

---

## 🛠️ Prasyarat

Sebelum memulai proses build, pastikan lingkungan pengembangan Anda telah siap:

1. **EAS CLI**: Instal tool baris perintah Expo secara global.
   ```bash
   npm install -g eas-cli
   ```
2. **Akun Expo**: Pastikan Anda memiliki akun di [expo.dev](https://expo.dev/) dan telah ditambahkan ke proyek `pbb-mobile`.
3. **Project ID**: Pastikan `app.json` sudah memiliki `projectId` yang valid (sudah terkonfigurasi dalam repository ini).

---

## 🚀 Langkah-langkah Build

### 1. Login ke Expo
Masuk ke akun Expo Anda melalui terminal:
```bash
eas login
```

### 2. Inisialisasi (Hanya Jika Diperlukan)
Jika ini adalah pertama kalinya Anda melakukan build pada mesin baru atau setelah perubahan besar pada konfigurasi:
```bash
eas build:configure
```

### 3. Build APK Production (Rekomendasi)
Gunakan profil `production` untuk menghasilkan file APK yang sudah dioptimasi untuk penggunaan akhir. File ini dapat diinstal langsung di HP.
```bash
eas build -p android --profile production
```

### 4. Build AAB (Untuk Play Store)
Gunakan profil `store` jika Anda ingin mengunggah aplikasi ke Google Play Store (menghasilkan file .aab).
```bash
eas build -p android --profile store
```

---

## 🏗️ Menangani Hasil Build

Setelah menjalankan perintah di atas, ikuti instruksi di terminal:

1. **Upload**: EAS akan menanyakan apakah ingin mengunggah project ke server Expo. Tekan **Enter/Yes**.
2. **Monitoring**: Terminal akan memberikan link URL dari **expo.dev**. Klik link tersebut untuk memantau progres build secara real-time.
3. **Download**: Setelah status build menjadi `Finished`, Anda dapat mengunduh file APK/AAB langsung dari halaman monitoring tersebut atau membagikan QR Code-nya.

---

## 🔧 Troubleshooting & Tips

### Build Secara Lokal
Jika Anda ingin melakukan build menggunakan resource komputer sendiri (membutuhkan Android SDK & Java terinstal), gunakan flag `--local`:
```bash
eas build -p android --profile preview --local
```

### Masalah Credentials
Jika terjadi masalah terkait sertifikat digital (keystore) Android, gunakan perintah berikut untuk manajemen kredensial:
```bash
eas credentials
```

### Jalankan di Emulator (Development)
Untuk menjalankan aplikasi dalam mode pengembangan:
```bash
npx expo start
```
Kemudian tekan `a` untuk membuka di emulator Android atau scan QR code dengan aplikasi **Expo Go**.

---

*Terakhir diperbarui: Mei 2026*
*Dibuat untuk ekosistem PBB App v10.1.0 (PBB Mobile v2.1.0)*
