# Design System

Dokumen ini merangkum fondasi UI yang sudah dipakai di aplikasi `pbb-mobile` agar pengembangan berikutnya tetap konsisten.

## Tujuan

- Menjaga aplikasi terasa satu produk dari onboarding sampai panel petugas
- Mengurangi duplikasi styling antar screen
- Mempermudah tim saat menambah layar atau merapikan layar lama

## Theme

Sumber utama theme ada di:

- [src/theme/app-theme.ts](F:\Projek Vibe Koding\pbb-app\pbb-mobile\src\theme\app-theme.ts:1)

Yang sudah tersedia:

- `colors`
- `radius`
- `spacing`
- `sizing`
- `shadow`
- `appLayout`
- `statusTone`

## Prinsip Visual

- Gunakan `primary` dan `primaryDark` sebagai identitas utama aplikasi
- Gunakan `info`, `accent`, `success`, dan `danger` hanya sebagai tone pendukung atau status
- Gunakan `surface`, `surfaceMuted`, dan `surfaceStrong` untuk layer kartu dan background internal
- Hindari menambah warna baru langsung di screen jika masih bisa memakai token theme
- Hindari magic number untuk ukuran layout utama bila sudah ada padanannya di `appTheme` atau `appLayout`

## Shared Components

Komponen reusable yang sudah tersedia:

- [AppScreenHeader](F:\Projek Vibe Koding\pbb-app\pbb-mobile\src\components\AppScreenHeader.tsx:1)
  Pakai untuk header gelap utama dengan tombol back, subtitle, dan optional action kanan.

- [AppActionCard](F:\Projek Vibe Koding\pbb-app\pbb-mobile\src\components\AppActionCard.tsx:1)
  Pakai untuk kartu aksi/list entry dengan ikon di kiri dan chevron di kanan.

- [AppModalCard](F:\Projek Vibe Koding\pbb-app\pbb-mobile\src\components\AppModalCard.tsx:1)
  Pakai untuk modal konfirmasi, sukses, gagal, dan status sinkronisasi.

- [AppSectionTitle](F:\Projek Vibe Koding\pbb-app\pbb-mobile\src\components\AppSectionTitle.tsx:1)
  Pakai untuk judul section kecil di dalam screen.

- [AppEmptyState](F:\Projek Vibe Koding\pbb-app\pbb-mobile\src\components\AppEmptyState.tsx:1)
  Pakai untuk kondisi kosong pada list, notifikasi, log, dan pencarian.

- [AppStatCard](F:\Projek Vibe Koding\pbb-app\pbb-mobile\src\components\AppStatCard.tsx:1)
  Pakai untuk statistik ringkas, terutama di area hero/header.

- [ScalableButton](F:\Projek Vibe Koding\pbb-app\pbb-mobile\src\components\ScalableButton.tsx:1)
  Pakai sebagai wrapper tombol interaktif agar efek press tetap konsisten.

## Kapan Memakai Komponen Shared

- Jika screen butuh header gelap dengan struktur yang sama, gunakan `AppScreenHeader`
- Jika ada kartu menu atau list action dengan pola ikon-title-subtitle, gunakan `AppActionCard`
- Jika ada modal dengan ikon besar, judul, deskripsi, dan tombol aksi, gunakan `AppModalCard`
- Jika ada title kecil antar section, gunakan `AppSectionTitle`
- Jika list tidak punya data, gunakan `AppEmptyState`
- Jika butuh blok statistik singkat di area hero, gunakan `AppStatCard`

## Kapan Boleh Styling Manual

Styling manual masih wajar jika:

- layout benar-benar unik dan belum punya pola reusable
- screen butuh komposisi visual khusus seperti hero besar atau webview frame
- komponen shared yang ada justru membuat struktur jadi dipaksa

Kalau pola itu mulai muncul di 2-3 tempat, sebaiknya ekstrak jadi komponen shared baru.

## Checklist Saat Menambah Screen Baru

1. Mulai dari `appTheme` dan `appLayout`, jangan dari warna/ukuran hardcoded
2. Cek apakah header bisa memakai `AppScreenHeader`
3. Cek apakah empty state bisa memakai `AppEmptyState`
4. Cek apakah kartu aksi bisa memakai `AppActionCard`
5. Cek apakah modal bisa memakai `AppModalCard`
6. Pakai `ScalableButton` untuk aksi tap utama
7. Jalankan `npm exec tsc --noEmit` setelah perubahan

## Arah Lanjutan

Kalau sistem ini ingin dimatangkan lagi, tahap berikut yang paling masuk akal:

- ekstrak input field reusable
- ekstrak status badge reusable
- ekstrak list item reusable untuk data operasional
- rapikan naming token typography jika nanti mau dibuat lebih formal
