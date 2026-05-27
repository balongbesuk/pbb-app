# Panduan Konfigurasi & Push Notifikasi PBB Manager

Dokumen ini menjelaskan arsitektur pengiriman push notifikasi ganda (**Double-Strike Push Notification**) pada platform **PBB Manager** dan bagaimana desa Anda dapat mengaktifkannya dengan mudah, baik menggunakan APK siap pakai maupun membangun APK mandiri.

---

## 🚀 Arsitektur Notifikasi Ganda

PBB Manager dilengkapi dengan dua saluran notifikasi yang berjalan secara bersamaan (*real-time*):
1. **Web Push Notification:** Ditujukan untuk browser desktop/laptop admin atau kasir menggunakan protokol standar web push (VAPID). 100% gratis dan tidak membutuhkan registrasi pihak ketiga.
2. **Mobile Push Notification (FCM/Expo):** Ditujukan untuk perangkat Android petugas penarik di lapangan menggunakan Expo Notifications yang dijembatani oleh Google Firebase Cloud Messaging (FCM).

---

## 📲 Jalur 1: Menggunakan APK Bersama (Shared APK - Rekomendasi Instan)

Jalur ini dirancang untuk desa yang ingin **cepat jalan tanpa harus memahami proses kompilasi kode biner APK** menggunakan Android Studio atau Expo CLI. Anda hanya perlu menyiapkan VPS untuk Next.js backend.

### Cara Kerja:
* Anda menggunakan file APK siap pakai yang dirilis di halaman **Releases GitHub PBB Manager**.
* APK ini sudah dikompilasi menggunakan kredensial Firebase dan Project ID Expo bawaan tim pengembang inti.
* Saat petugas lapangan memasukkan URL VPS desa Anda di layar pembuka (*Onboarding*), perangkat akan menyelaraskan profil logo dan mencatat token perangkatnya ke database Anda.
* Ketika server Next.js Anda mengirimkan notifikasi, server akan memanggil API Expo menggunakan token tersebut secara gratis tanpa perlu kredensial otentikasi tambahan.

### Langkah Aktivasi VPS:
1. Pastikan Anda **tidak menyetel** variabel lingkungan `EXPO_ACCESS_TOKEN` di berkas `.env` VPS Anda. Hal ini agar server Anda diperbolehkan mengirim notifikasi secara anonim ke gateway terpusat Expo bawaan APK.
2. Pastikan pengaturan **"Aktifkan Push Notifikasi HP"** dalam posisi **Aktif** di halaman pengaturan dashboard admin desa Anda.

---

## 🔐 Jalur 2: Membangun APK Mandiri (Self-Built APK - Kedaulatan Data Penuh)

Jika desa Anda menginginkan kedaulatan data penuh dan mengisolasi lalu lintas push notifikasi sepenuhnya di bawah proyek Google Firebase milik desa sendiri, Anda dapat melakukan kompilasi APK mandiri.

### Langkah 1: Setup Google Firebase Console
1. Buka [Firebase Console](https://console.firebase.google.com/) menggunakan akun Google desa Anda.
2. Buat proyek baru dengan nama (misal: `PBB-Mobile-DesaAnda`).
3. Tambahkan aplikasi **Android** ke dalam proyek Firebase tersebut.
4. Masukkan nama paket Android Anda (sesuai yang diatur di `app.json` / `app.config.js`, contoh: `com.balongbesuk.pbbmobile`).
5. Unduh file kredensial **`google-services.json`** yang diberikan oleh Firebase.
6. Pindahkan berkas `google-services.json` tersebut ke dalam folder `/pbb-mobile/google-services.json` di repositori lokal Anda.

### Langkah 2: Buat Akun & Project ID Expo
1. Daftar akun gratis di [Expo Dev](https://expo.dev/).
2. Buat organisasi atau proyek baru di dashboard Expo.
3. Jalankan perintah masuk di terminal komputer Anda:
   ```bash
   npx eas login
   ```
4. Hubungkan proyek lokal mobile Anda ke Expo dengan menjalankan perintah:
   ```bash
   npx eas project:init
   ```
   Perintah ini akan memperbarui `projectId` di dalam berkas `app.json` Anda secara otomatis.

### Langkah 3: Kompilasi APK menggunakan EAS Build
1. Jalankan perintah kompilasi APK gratis di server awan Expo:
   ```bash
   npx eas build --platform android --profile preview
   ```
2. Tunggu proses antrean selesai. Setelah selesai, Expo akan memberikan tautan unduhan langsung untuk berkas `.apk` mandiri milik desa Anda.
3. Bagikan file APK tersebut khusus untuk digunakan oleh petugas penagihan desa Anda.

### Langkah 4: Pengamanan Server VPS Mandiri
Demi keamanan, Anda wajib mengaktifkan proteksi pengiriman agar pihak luar tidak bisa menembak notifikasi liar ke HP petugas Anda:
1. Di dashboard Expo Anda, aktifkan **Push Security**.
2. Buat sebuah **Access Token** baru.
3. Salin token tersebut dan taruh di berkas `.env` server Next.js Anda:
   ```env
   EXPO_ACCESS_TOKEN=token_rahasia_expo_anda_disini
   ```
4. Restart server Next.js Anda. Sekarang, hanya server VPS desa Anda yang memiliki kunci untuk mengirimkan notifikasi push ke APK mandiri Anda.

---

## 🎛️ Pengendalian Notifikasi dari Dashboard Admin

Jika VPS desa ditaruh pada server lokal/offline yang tidak memiliki akses internet keluar (intranet desa), Anda dapat mematikan total fitur notifikasi push seluler agar server tidak mengalami delay akibat mencoba menghubungi API luar.

1. Masuk ke halaman **Pengaturan Desa** pada Dashboard Admin.
2. Temukan sakelar **"Aktifkan Push Notifikasi HP"**.
3. Geser ke posisi nonaktif dan klik **Simpan Pengaturan**.
4. Sistem secara instan akan mematikan proses pengiriman notifikasi seluler di latar belakang tanpa mengganggu alur pencatatan pelunasan wajib pajak.

---

## 🌐 Web Push VAPID (Alternatif Paling Ramah Pengembang)

Jika Anda ingin notifikasi desktop admin menyala secara instan tanpa perlu mendaftar Firebase atau Expo, Web Push adalah solusinya:
1. Jalankan perintah berikut di server Next.js Anda untuk menghasilkan kunci gratis:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Salin hasilnya dan masukkan ke berkas `.env` VPS Next.js Anda:
   ```env
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=kunci_publik_hasil_generate
   VAPID_PRIVATE_KEY=kunci_privat_hasil_generate
   VAPID_SUBJECT=mailto:email@kantordesabersangkutan.id
   ```
3. Petugas yang masuk menggunakan browser Google Chrome atau Microsoft Edge di PC/Laptop mereka akan melihat permintaan izin notifikasi browser. Klik **Izinkan (Allow)**, dan notifikasi OS asli akan muncul instan setiap kali ada pembaruan data penagihan.
