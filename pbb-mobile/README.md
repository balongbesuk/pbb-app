# PBB Mobile v1.1.0 — Panduan Build APK & Development
<img width="100%" alt="PBB Mobile Banner" src="https://github.com/user-attachments/assets/1cc7b3c6-030e-49c1-a388-33af515376bc" />


Dokumen ini berisi panduan teknis untuk melakukan build aplikasi **PBB Mobile** menjadi file APK (Android) menggunakan layanan **EAS Build (Expo Application Services)**.

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

### 3. Build APK (Untuk Testing/Preview)
Gunakan profil `preview` untuk menghasilkan file APK yang dapat diinstal langsung di perangkat Android tanpa melalui Play Store.
```bash
eas build -p android --profile preview
```

### 4. Build AAB (Untuk Play Store/Production)
Gunakan profil `production` untuk menghasilkan file Android App Bundle (.aab) yang siap diunggah ke Google Play Console.
```bash
eas build -p android --profile production
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

*Terakhir diperbarui: April 2026*
*Dibuat untuk ekosistem PBB Manager v9.1.0 (PBB Mobile v1.1.0)*
