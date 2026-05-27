# Rencana Implementasi: Firebase & Push Notification Ramah Open-Source (Multi-Desa)

Rencana ini dibuat untuk mengoptimalkan sistem **Double-Strike Push Notification** pada proyek **PBB Manager** (Web & Mobile). Fokus utama adalah memastikan sistem push notification dapat berjalan dengan mulus secara instan di desa mana pun di Indonesia, baik menggunakan **APK Siap Pakai (Shared APK)** yang dibagikan di GitHub maupun **APK Mandiri (Self-Built APK)** yang dicompile sendiri oleh desa tersebut.

Rencana ini mencakup penanganan toleransi kegagalan (*graceful degradation*), pembersihan otomatis database dari token perangkat kedaluwarsa (*stale token cleanup*), dukungan navigasi cerdas (*deep linking*), serta panduan instalasi ramah open-source.

---

## User Review Required

Berikut adalah keputusan arsitektur penting yang memerlukan tinjauan Anda:

> [!IMPORTANT]
> **1. Keamanan Push Bersama (Shared Gateway Security)**
> Demi kelancaran APK Siap Pakai yang diunduh langsung dari GitHub oleh desa-desa, kita **tidak boleh** mengaktifkan parameter `EXPO_ACCESS_TOKEN` secara wajib pada Next.js backend. Jika diaktifkan secara wajib, server desa lain tidak akan bisa mengirim pesan ke perangkat petugas mereka yang terdaftar di proyek Expo Anda. Kami menyarankan pengaman ini dibuat **opsional** (hanya dibaca jika disetel).

> [!TIP]
> **2. Sakelar Fitur (Feature Toggle) di Database**
> Sangat disarankan menambahkan kolom baru `enablePushNotifications` di tabel `VillageConfig` (Prisma/SQLite) agar desa yang menaruh VPS mereka di jaringan tertutup (intranet) atau server lokal tanpa akses internet luar dapat mematikan total fitur push notification tanpa memicu error/delay pada aplikasi.

---

## Proposed Changes

Perubahan dikelompokkan berdasarkan komponen sistem (Backend Next.js, Schema Database, Mobile App, dan Dokumentasi).

---

### 1. Backend Next.js (Push Gateway & API)

Menambahkan logika pembersihan otomatis token perangkat yang sudah tidak aktif langsung saat menerima tiket respon dari Expo, serta melonggarkan verifikasi token push agar bersifat opsional demi mendukung rilis APK bersama.

#### [MODIFY] [push-notification.ts](file:///f:/Projek%20Vibe%20Koding/pbb-app/src/lib/push-notification.ts)
*   **Modifikasi Pemrosesan Tiket:** Tambahkan pengecekan kondisi jika `ticket.status === 'error'` dan `ticket.details?.error === 'DeviceNotRegistered'`. Jika terpenuhi, langsung jalankan `prisma.pushSubscription.deleteMany` untuk menghapus token tersebut.
*   **Otentikasi Opsional:** Inisialisasi client `Expo` dengan menyertakan `accessToken` secara dinamis hanya jika variabel lingkungan `EXPO_ACCESS_TOKEN` tersedia di VPS desa tersebut.
*   **Prioritas Doze Mode:** Tambahkan parameter `"priority": "high"` ke dalam payload `messages.push` agar notifikasi tetap terkirim secara instan pada HP Android yang sedang dalam mode hemat daya.

---

### 2. Schema Database & Prisma (Village Config)

Menambahkan preferensi admin desa untuk menghidupkan atau mematikan fitur notifikasi seluler langsung dari dashboard.

#### [MODIFY] [schema.prisma](file:///f:/Projek%20Vibe%20Koding/pbb-app/prisma/schema.prisma)
*   **Modifikasi Model `VillageConfig`:** Tambahkan field `enablePushNotifications Boolean @default(true)`.
*   **Penyesuaian Server Actions:** Tambahkan penanganan field baru ini pada modul CRUD pengaturan desa agar admin dapat mengontrolnya via UI.

---

### 3. Aplikasi Seluler (PBB Mobile)

Meningkatkan ketahanan aplikasi agar tidak mengalami crash jika konfigurasi notifikasi gagal diinisialisasi, serta menerapkan penanganan ketukan notifikasi (*deep linking*).

#### [MODIFY] [usePushNotifications.ts](file:///f:/Projek%20Vibe%20Koding/pbb-app/pbb-mobile/src/utils/usePushNotifications.ts)
*   **Toleransi Kegagalan (Graceful Degradation):** Bungkus pemanggilan `getExpoPushTokenAsync` dengan blok `try-catch` yang kokoh. Jika token gagal didapatkan (karena tidak ada berkas kredensial atau perangkat tidak didukung), aplikasi harus tetap berjalan normal tanpa crash, hanya memunculkan log peringatan.
*   **Deep Linking Navigasi:** Di dalam `addNotificationResponseReceivedListener`, tambahkan ekstraksi data payload (seperti `screen` dan `taxpayerId`) lalu panggil fungsi navigasi global untuk mengarahkan petugas langsung ke halaman detail wajib pajak bersangkutan.

---

### 4. Dokumentasi & Panduan Distribusi Open-Source

Mempermudah desa-desa pemula dalam mengadopsi aplikasi Anda tanpa kebingungan teknis.

#### [NEW] [PANDUAN_NOTIFIKASI.md](file:///f:/Projek%20Vibe%20Koding/pbb-app/docs/PANDUAN_NOTIFIKASI.md)
*   **Shared APK vs Self-Built APK:** Menjelaskan perbedaan dua jalur distribusi ini dengan bahasa yang sangat mudah dimengerti.
*   **Langkah Zero-to-Push:** Panduan langkah demi langkah (hand-holding) untuk membuat proyek Firebase Console gratis, mengunduh file `google-services.json`, dan mendaftarkan akun Expo gratis jika mereka ingin menempuh jalur mandiri (*Full Sovereignty*).
*   **Web Push sebagai Alternatif Bebas Akun:** Cara menghasilkan kunci VAPID lokal menggunakan perintah CLI satu baris untuk mengaktifkan notifikasi pop-up browser desktop tanpa perlu registrasi pihak ketiga mana pun.

---

## Verification Plan

### Pengujian Otomatis & Simulasi
1. **Simulasi Kegagalan Token:**
   * Lakukan uji coba menjalankan aplikasi mobile pada Emulator Android (yang tidak memiliki Google Play Services / FCM terkonfigurasi) untuk memastikan aplikasi tetap dapat terhubung ke server Next.js (handshake di `OnboardingScreen`) dan masuk ke dashboard tanpa kendala crash.
2. **Simulasi Pembersihan Token (Stale Token):**
   * Masukkan token push buatan/palsu ke database SQLite melalui tabel `PushSubscription`.
   * Pemicu pengiriman push notifikasi dari Next.js backend.
   * Pastikan konsol server menampilkan log `🧹 Berhasil membersihkan token kedaluwarsa` dan token palsu tersebut terhapus secara otomatis dari database.

### Pengujian Manual
1. **Uji Coba Handshake Desa:**
   * Jalankan VPS lokal, masukkan alamat IP lokal atau domain pengujian ke `OnboardingScreen` aplikasi mobile, dan verifikasi sinkronisasi logo serta nama desa berjalan mulus.
2. **Uji Tap Notifikasi:**
   * Kirim pesan notifikasi tiruan dengan payload `{ "screen": "TaxpayerDetail", "taxpayerId": "1" }`.
   * Ketuk notifikasi yang muncul pada system tray HP Android, pastikan aplikasi terbuka dan langsung menavigasi petugas ke halaman detail wajib pajak bersangkutan.
