# Changelog

## v10.1 & PBB Mobile v2.1 - 2026-05-26: Sinkronisasi Identitas Kwitansi & Perombakan Profil

Pembaruan ganda untuk platform web (v10.1) dan aplikasi seluler (v2.1) yang berfokus pada kelengkapan administrasi bukti pembayaran dan pemolesan pengalaman pengguna.

### Kelengkapan Administrasi Kwitansi
- **Format Kwitansi BUMDes Global**: Menambahkan opsi pengaturan global "Gunakan Format Kwitansi BUMDes" pada panel pengaturan umum, memungkinkan sistem secara otomatis menyesuaikan tampilan header kwitansi menggunakan profil BUMDes secara permanen tanpa perlu diatur berulang kali pada saat pencetakan.
- **Integrasi Tanda Tangan Kasir**: Kwitansi digital dan cetak kini secara otomatis menyematkan nama lengkap petugas (kasir) yang memproses pembayaran beserta dengan gambar tanda tangannya secara langsung di bagian bawah kwitansi.
- **Dukungan Unduhan next/og Resolusi Tinggi**: Mengatasi limitasi pembacaan _URL edge runtime_ pada generator gambar `next/og`, sehingga logo wilayah dan tanda tangan petugas kini ter-render dengan mulus dan tajam saat wajib pajak maupun petugas mengunduh gambar bukti pelunasan.
- **Koreksi Tata Letak Layout Unduhan**: Menyelesaikan _bug_ pemotongan piksel bawah pada _preview_ cetak dan hasil konversi HTML ke PNG (`html-to-image`) menggunakan teknik _absolute positioning_ yang menjaga keutuhan struktur batas kwitansi.

#### Penyempurnaan Pengalaman Pengguna (Web)
- **Perombakan Layout Dashboard Profil (`/settings/profile`)**: Merombak struktur halaman profil dari tumpukan panel vertikal menjadi desain **Grid Glassmorphism 2 Kolom** yang seimbang dan elegan layaknya dashboard premium modern. Kolom kiri difokuskan penuh untuk identitas visual (Foto & Tanda Tangan), sementara kolom kanan didedikasikan untuk pengaturan informasi personal dan keamanan kata sandi.
- **Panduan Cerdas Upload Gambar**: Menambahkan kotak informasi panduan *(Tips and Tricks)* yang ramah pengguna, menyarankan penggunaan format PNG transparan, crop rapat, dan rasio proporsional, guna menghasilkan cetakan tanda tangan pada kuitansi yang sempurna.
- **Pengelompokan Konfigurasi Pajak (Tabbed Dashboard)**: Mengelompokkan seluruh kolom konfigurasi sistem PBB yang kompleks ke dalam dashboard navigasi **4-Tab Premium** (*Umum & Biaya*, *Integrasi Bapenda*, *Portal & GIS Publik*, dan *Akses Mobile*) untuk estetika visual yang teratur dan rapi.
- **Skala Tipografi Responsif & Aksesibilitas WCAG AA (Dashboard)**: Mengoptimalkan ukuran teks di seluruh widget dan kartu statistik utama. Mengubah ukuran currency nominal dari kaku `text-2xl` menjadi skala responsif fluid (`text-xl sm:text-2xl lg:text-xl xl:text-2xl`) guna mencegah teks terpotong atau turun baris (*wrapping*) pada monitor laptop. Menyesuaikan teks label super kecil dari 9px/10px menjadi **10px/11px** yang semi-tebal agar memenuhi standar kenyamanan mata perangkat desa senior.
- **Visual Efek Hover Mewah**: Menambahkan transisi angkat kartu interaktif (`hover:-translate-y-1`), pelebaran bayangan tebal (`hover:shadow-lg dark:hover:shadow-black/40`), serta pendaran cahaya ambient dynamic glow border (`hover:border-primary/30`) pada seluruh kartu indikator utama dasbor.

### Perbaikan Bug & Stabilitas Sistem (v10.1 & v2.1)
- **Akses Pengguna & Arsip Digital**: Memperbaiki pemblokiran akses yang tidak disengaja pada role `PENGGUNA` menuju halaman Dashboard dan Data Pajak. Selain itu, membuka akses bagi role `PENGGUNA` dan `PENARIK` agar dapat melihat, mencetak, dan mengunduh Arsip Digital PBB (PDF) langsung dari popup detail objek pajak yang sebelumnya terbatas pada Admin.
- **Perbaikan Tautan Kedaluwarsa & Lockout PIN E-SPPT (v10.1)**: Menyelesaikan *bug* pratinjau PDF di dalam `<iframe>` yang langsung kedaluwarsa di lingkungan VPS (akibat isolasi memori *Next.js bundles* dan **PM2 Cluster Mode multi-process**) dengan memigrasikan penyimpanan token ke **database SQLite khusus (`archive-tokens.db`)** berbasis `better-sqlite3`. Menyetel masa berlaku token menjadi **5 menit** bersifat *reusable* dan **terikat erat dengan IP Address** peramban pembuat token (mencegah pembukaan tautan dari luar perangkat), serta mengembalikan fungsionalitas cetak/unduh agar menggunakan satu token statis yang digenerate saat submit PIN. Langkah ini terbukti andal melewati *double request* peramban dan menghilangkan celah *lockout rate-limiter* PIN sepenuhnya.
- **Stabilitas Dialog SPOP & Mutasi**: Menyelesaikan _bug_ _infinite re-render_ (loop reset terus menerus) pada form E-SPOP yang memicu kehilangan isian secara tiba-tiba, serta memperbaiki _bug_ tampilan data usang pada dialog Mutasi E-SPPT dengan memaksa pembaruan data (_reset_) ketika jendela dibuka.
- **Tampilan Push Notification Sempurna**: Memperbaiki logo PBB (_Push Icon_) yang terpotong pada _Push Notification_ (baik di web maupun PBB Mobile) dengan menyiapkan gambar berukuran presisi serta _padding_ yang sesuai pedoman antarmuka.
- **Deduplikasi Notifikasi Ganda**: Memperbaiki masalah sistem pengiriman _push notification_ yang mengirimkan dua pesan identik apabila petugas _login_ menggunakan dua akun berbeda (misalnya Super Admin dan Penarik) di perangkat HP yang sama. Sistem kini menyaring token duplikat melalui logika _Set deduplication_.
- **Visibilitas Super Admin di PBB Mobile**: Mengatasi _bug_ di mana Super Admin tidak bisa menerima notifikasi Permintaan Pengalihan (Transfer) WP karena disembunyikan dari daftar pilihan tujuan transfer. Akun berstatus `ADMIN` kini dapat dipilih secara normal di aplikasi penagih.
- **Riwayat Notifikasi & Aktivitas Akurat**: Menambahkan `force-dynamic` pada _API Route_ Next.js untuk mencegah mekanisme _caching_ statis yang membuat daftar notifikasi PBB Mobile menjadi kosong/kadaluarsa, serta memperbaiki sistem filter _Audit Log_ agar pelunasan dari HP petugas tercatat rapi di Riwayat Aktivitas Super Admin.
- **Kesiapan Open-Source (Pembersihan Hardcode)**: Menghapus seluruh _hardcode_ bawaan yang masih menyematkan nama wilayah spesifik ("Balongbesuk", "Diwek", "Jombang", "pbb.galaxynet.my.id") pada Form Publik, Fallback Kwitansi, Peta GIS, serta Aplikasi Mobile. Semua data statis telah diganti menjadi _placeholder_ dinamis (`"NAMA DESA"`, dll) agar aplikasi ini sepenuhnya siap dirilis secara *open-source* untuk seluruh desa di Indonesia.
- **Jalur Push Notification Mandiri & Toleran Gateway**: Merekayasa ulang pengiriman push notification dengan membuat validasi `EXPO_ACCESS_TOKEN` menjadi **opsional**. Hal ini memungkinkan ribuan desa yang ingin meng-host server PBB mereka sendiri (*self-hosted*) untuk tetap menggunakan gerbang notifikasi bersama (*shared gateway*) via APK bawaan tanpa terhambat validasi kredensial.
- **Pembersihan Token Kedaluwarsa Otomatis**: Menyempurnakan alur pengiriman push di server dengan mendeteksi kesalahan pengiriman (`DeviceNotRegistered`) dari server Expo secara *real-time* dan menghapus token-token usang tersebut dari SQLite secara masal guna meningkatkan performa.
- **Pengesampingan Doze Mode Android**: Menambahkan parameter `"priority": "high"` secara terprogram pada pengiriman payload notifikasi untuk memastikan system tray perangkat Android petugas kolektor segera berbunyi seketika meskipun HP sedang dalam mode hemat baterai Doze.
- **Stabilitas Kompilasi & Perbaikan Border Tabs**: Mengatasi bug visual di mana active tab trigger meluap keluar dari kontainer latar belakang abu-abu pada pengaturan. Memperbaiki `tabsListVariants` dengan mengubah batasan tinggi kaku `h-8` menjadi elastis `h-fit` agar dapat membungkus seluruh trigger tab secara rapi dan proporsional.
- **Ketahanan Startup Simulator & Deep-Linking PBB Mobile (v2.1)**:
  - **Ketahanan Crash Simulator**: Membungkus logika inisialisasi token perangkat PBB Mobile di dalam blok penanganan kesalahan berlapis (*nested try-catch*). Menghentikan total kegagalan startup (*app crash*) ketika aplikasi dijalankan pada emulator Android atau perangkat tanpa Google Play Services terpasang.
  - **Navigasi Langsung Notifikasi (Deep-Linking)**: Mengimplementasikan sistem navigasi global bebas ketergantungan melingkar (*circular dependency*) berbasis `navigationRef` untuk aplikasi seluler React Native. Mengetuk *push notification* kini secara otomatis mengarahkan petugas langsung menuju halaman detail Wajib Pajak bersangkutan secara instan.

---

## PBB Mobile v2.0 - 2026-05-24: Kemitraan Digital & Sinkronisasi Bapenda Lanjutan

Pembaruan besar-besaran untuk mengukuhkan **PBB Mobile** (sebelumnya berada di versi setara portal publik) menjadi entitas tersendiri di versi 2.0. Pembaruan ini menitikberatkan pada kemudahan bagi petugas penagih dan penyelarasan fitur keamanan dengan portal publik v10.0.

### Integrasi Sinkronisasi & Keamanan
- **Sinkronisasi Tagihan Bapenda Otomatis**: Fitur "Bayar Online / Cek Bapenda" dari versi web kini tersedia langsung di layar cek tagihan aplikasi seluler. Status pembayaran diselaraskan secara *real-time*.
- **Peta GIS Seluler yang Terproteksi**: Modul `WebView` Peta GIS telah ditingkatkan untuk mengenali profil autentikasi aplikasi. Warga umum wajib menggunakan **PIN 4-Digit NOP** sebelum mengakses detail Bapenda, sedangkan petugas memiliki akses instan.
- **Saringan Data Penagihan Presisi**: Modul "Data Wajib Pajak" di Panel Petugas kini dibekali *toggle switch* pintar yang bisa langsung memfilter *"Hanya tampilkan yang Belum Lunas"*. Sangat mempermudah pengejaran target lapangan.
- **Penyempurnaan Stabilitas Lintas Platform**: *Bug* rendering layar putih (Blank Screen) pada fitur filter `Switch` serta anomali komponen `WebView` yang *stuck loading* (*infinite spinner*) telah diperbaiki tuntas untuk pengalaman navigasi yang mulus.
- **Pemisahan Versi Mandiri**: Proyek seluler `pbb-mobile` kini memiliki alur versi pelacakannya sendiri (v2.0.0) di `package.json` dan `app.json`, menegaskan independensinya dari versi inti dasbor web.

---

## v10.0 - 2026-05-23: Deep Security Hardening, NOP PIN Protection, GIS Map Security & Cloudflare Turnstile Lifecycle Refactoring

Pembaruan keamanan skala besar menyeluruh untuk mengamankan seluruh platform PBB App. Mengimplementasikan pembatasan akses data wajib pajak menggunakan Kunci 4-Digit NOP, proteksi brute-force PIN dengan penguncian sesi, perlindungan peta GIS publik, penyelarasan Cloudflare Turnstile, penambalan celah kritis autentikasi API Mobile dan Zip Slip cadangan, serta penyelarasan detail verifikasi pada pengajuan LSPOP/Mutasi, peta publik, dan alur pembayaran online Bapenda.

### Sistem Notifikasi & Real-time UI
- **Pemberitahuan Instan Lintas Halaman**: Memodifikasi komponen `NotificationBell` untuk memicu pembaruan instan (*immediate fetch*) saat perpindahan halaman terdeteksi via hook `usePathname`. Mengatasi kelambatan notifikasi yang sebelumnya tertunda akibat siklus polling 60 detik.
- **Sinkronisasi Notifikasi Otomatis**: Memastikan notifikasi penarikan/pembatalan antara Admin dan Penarik muncul secara seketika saat aksi dilakukan pada browser yang sama maupun berbeda.
- **Web Push Notifications Asli (Desktop/Browser)**: Mengimplementasikan teknologi Service Worker dan VAPID (Web-Push) murni. Kini setiap petugas yang masuk melalui browser PC/Laptop (Chrome/Edge) akan menerima *pop-up* notifikasi OS Windows/Mac layaknya aplikasi native, meskipun tab PBB sedang berada di *background*.
- **Double-Strike Push Notification**: Mengintegrasikan pengiriman notifikasi ganda pada fungsi *backend* (`notifyUser`). Setiap pendelegasian atau pemindahan Wajib Pajak kini secara serentak memicu Push Notification ke aplikasi seluler Android (Firebase/Expo) **dan** Web Push Notification ke layar komputer desktop.
- **Penyelarasan Channel & Payload Android**: Menambahkan parameter `"channelId": "default"` secara eksplisit pada payload push notification backend untuk menjamin sistem operasi Android (8.0+) berhasil merender notifikasi di system tray secara andal.
- **Sinkronisasi Otomatis Token pada Dashboard Mobile**: Mengintegrasikan `usePushNotifications` di `AdminDashboardScreen.tsx` untuk menyinkronkan token perangkat petugas ke database backend secara otomatis pada saat membuka dasbor, memecahkan masalah token hilang/tidak terdaftar akibat bypass halaman Login (saved session).
- **Log Diagnostik Pengiriman Expo**: Menambahkan pencatatan detail tiket pengiriman Expo (`status: error` dengan kode kesalahan seperti `InvalidCredentials` atau `DeviceNotRegistered`) langsung pada konsol backend Next.js untuk mempermudah diagnosa.
- **Perbaikan Celah Notifikasi Transfer WP**: Menambal *blind-spot* pada alur pemindahan Wajib Pajak oleh Admin. Kini, baik petugas penerima tugas baru (Penarik B) maupun petugas lama yang datanya dicabut (Penarik A) akan sama-sama menerima notifikasi penugasan dan pembatalan secara instan untuk mencegah miskomunikasi di lapangan.

### Pengamanan Session & Anti-Loop (Self-Healing Session)
- **Mekanisme Self-Healing Session**: Mengintegrasikan sistem pemulihan otomatis pada callback NextAuth JWT (`src/lib/auth.ts`). Jika database di-seed/reset ulang, sistem akan secara otomatis melacak kecocokan user via `username` yang unik dan mengupdate `userId` yang basi pada JWT token secara senyap tanpa mengganggu kenyamanan pengguna.
- **Proteksi Detoksifikasi Session & Anti-Loop**: Menyempurnakan layout dasbor utama (`src/app/(dashboard)/layout.tsx`) dengan memverifikasi keberadaan user di database aktif. Jika session basi dan tidak dapat dipulihkan (misal karena tidak ada username di cookie lama), session akan dinonaktifkan secara total (`session.user = null` di NextAuth) untuk memutus rantai *infinite redirect loop* (`/login` ↔ `/dashboard`) dan mengarahkan pengguna secara aman ke halaman login bersih.
- **Koreksi Exception NEXT_REDIRECT**: Memindahkan fungsi `redirect()` keluar dari blok penanganan error (`try-catch`) pada `DashboardLayout`. Mengatasi masalah error internal Next.js yang menangkap error pengalihan sebagai kegagalan kueri database.

### Pengamanan Akses Data Wajib Pajak & Kunci 4-Digit NOP (SEC-04 & SEC-05)
- **NOP Masking di Seluruh Portal Publik**: Sensor otomatis Nomor Objek Pajak (NOP) menjadi format disensor (`35.17.XXX.XXX-XXXX.X`) di hasil pencarian publik warga dan popup Peta GIS wilayah, melindungi akun wajib pajak dari pemindaian massal (*mass data scraping*). Nama dan alamat tetap dibiarkan utuh demi kemudahan pencarian warga desa.
- **Verifikasi PIN 4-Digit Warga**: Akses salin NOP asli, pembayaran online, unduh/pratinjau E-SPPT PDF secara server-side, serta pencetakan kuitansi modern kini diwajibkan melewati dialog **Verifikasi PIN NOP** yang meminta 4 digit nomor urut atau 4 digit absolut terakhir NOP dari lembar SPPT fisik warga.
- **Proteksi Anti Brute-Force PIN**: Server Actions `getSecureArsipUrl` and `getUnmaskedTaxData` dilengkapi pembatasan IP persisten menggunakan `checkRateLimit`. Warga hanya diberikan **maksimal 5 kali kesempatan salah PIN** (dikurangi dari batas sebelumnya demi pengamanan tinggi), setelah itu sesi akses akan langsung **dikunci secara total selama 15 menit** untuk mencegah serangan tebakan kamus (*dictionary attack*).
- **Integrasi Verifikasi PIN pada Pengajuan LSPOP & Mutasi PBB**: Menambahkan alur verifikasi PIN NOP 4-digit wajib sebelum tombol pengajuan baru LSPOP maupun Mutasi/Pemecahan PBB dapat diakses di portal publik. Setelah verifikasi berhasil, sensor pada NOP untuk baris tersebut akan dibuka secara otomatis dan aman sehingga data pengajuan tidak tersensor lagi.
- **Verifikasi PIN Penyimpanan NOP (Mobile)**: Melengkapi fitur *Bookmark* (Simpan SPPT) di aplikasi seluler dengan kewajiban verifikasi PIN 4-digit bagi pengguna umum (warga) sebelum data NOP yang disensor dapat disimpan dan dibuka sensornya (*unmasked*) di dalam perangkat secara aman.
- **Integrasi Peta GIS Publik**:
  - **Sensor NOP Publik**: Detail WP Belum Bayar pada peta GIS publik disensor sepenuhnya menggunakan sistem mask NOP agar data warga terlindung dari publikasi tidak sah.
  - **Verifikasi PIN di Peta GIS**: Menambahkan verifikasi PIN NOP 4-digit saat warga mengakses opsi bayar online atau cek Bapenda dari detail WP Belum Bayar di Peta GIS publik.
- **Pemisahan Hak Akses Admin (Peta GIS)**: Menambahkan deteksi halaman dinamis (`isPublicPortal`) pada komponen peta wilayah. Di area publik warga, NOP dan aksi disensor ketat dengan prompt verifikasi PIN, sedangkan di sisi dashboard admin (/peta internal admin), NOP ditampilkan utuh sepenuhnya tanpa sensor, NOP asli dapat disalin langsung, dan bisa diakses bebas tanpa prompt PIN.

### Sinkronisasi & Perbaikan Alur Pembayaran Bapenda
- **Perbaikan Sinkronisasi Status Lunas Warga**: Menyelesaikan masalah di mana NOP yang disimpan oleh pengguna umum (warga) tidak secara otomatis memperbarui status menjadi "LUNAS" di daftar simpanan mereka setelah pengecekan ke Bapenda berhasil, serta mencegah pembuatan entri ganda akibat perbedaan format NOP bersensor (masked) dan asli.
- **Perbaikan Push Notification Warga**: Memperbaiki kegagalan pengiriman Push Notification ke perangkat seluler warga saat tagihan dilunaskan dari Bapenda pusat. Backend kini otomatis mencocokkan berbagai format penulisan NOP (dengan atau tanpa tanda baca) pada database langganan notifikasi.
- **Perbaikan Link & NOP Terpotong pada Cek Bapenda**: Memperbaiki masalah nilai NOP yang terkirim terpotong atau kosong ke portal Bapenda Jombang saat melakukan "Bayar Online" tepat setelah verifikasi PIN berhasil. Kode disinkronkan untuk menggunakan nilai NOP yang baru dikembalikan dari server secara langsung alih-alih menunggu *asynchronous state update* React yang terlambat.
- **Pemicu Popup Tagihan Belum Lunas**: Memperbaiki pemicu otomatis munculnya popup informasi tagihan belum lunas untuk diarahkan ke Bapenda. Ketika validasi status bayar ke Bapenda mengembalikan status "Belum Terbayar/Belum Lunas", popup instruksi bayar ke Bapenda akan muncul secara instan dengan link rujukan NOP lengkap yang aman dan akurat.
- **Validasi NOP pada Tombol Cek Bapenda**: Menerapkan validasi PIN NOP secara ketat saat tombol "Cek Bapenda" ditekan pada status belum bayar, memastikan NOP asli yang lengkap dikirim ke website Bapenda hanya setelah pengguna terverifikasi secara sah memiliki akses ke properti tersebut.

### Tambal Celah Keamanan Kritis (SEC-01 & SEC-02 & SEC-03)
- **Broken Authentication Patch pada Mobile API (SEC-01)**: Penegakan ketat validasi JWT token petugas via `requireMobileAuth` pada seluruh method `GET` dan `POST` di endpoint [tax/route.ts](src/app/api/mobile/tax/route.ts), menghentikan total celah fraud pengubahan status `LUNAS` ilegal tanpa bayar dan kebocoran data mobile.
- **Zip Slip Path Traversal Patch (SEC-02)**: Menggantikan fungsi rawan `path.join` dengan fungsi pengaman tangguh `resolveSafeChildPath` pada proses ekstraksi arsip cadangan ZIP di modul database restore [restore.ts](src/lib/restore.ts), mengamankan server dari ancaman overwriting file biner sistem/ webshell (Remote Code Execution).
- **Rekomendasi Rotasi Kredensial (SEC-03)**: Penyusunan saran rotasi kunci rahasia NextAuth (`NEXTAUTH_SECRET`), password admin default, dan pengalihan ke mode `production` di berkas `.env.example` dan Laporan Audit Keamanan resmi.

### Refaktorisasi Turnstile & Lifecycle SPA
- **Arsitektur Cloudflare Turnstile Global & Persistent**: Memindahkan widget Turnstile dari komponen pencarian lokal (`PublicSearch`) ke level layout wrapper global (`PublicTurnstileProvider`). Hal ini menjamin widget tetap persisten dan tidak pernah di-*unmount* saat perpindahan tab (Cek Status ↔ Peta GIS), menghilangkan jeda waktu muat ulang, dan secara dramatis mempercepat interaksi pencarian warga.
- **Auto-Reset Token Asinkron**: Menambahkan pemanggilan `resetTurnstile()` otomatis di latar belakang secara asinkron segera setelah pencarian awal, pencarian riwayat, atau pagination (*load more*) dieksekusi, memecahkan masalah token sekali-pakai (*single-use*) yang kedaluwarsa secara otomatis secara transparan.
- **Integrasi Visual Status Keamanan pada Ikon GitHub**: Merekayasa ulang tombol repositori GitHub di footer portal publik untuk bertindak sebagai indikator visual status keamanan Turnstile secara real-time di seluruh halaman publik (`/`, `/spop`, `/pengajuan`):
  - **Memverifikasi (Pulsing Blue Ring 🔵)**: Indikator ring biru berdenyut lembut saat inisialisasi handshake keamanan di latar belakang.
  - **Lolos Verifikasi (Glowing Emerald Circle 🟢)**: Menampilkan pendaran hijau zamrud premium dengan badge vektor lingkaran hijau solid dan centang putih tebal di pojok kanan atas, dirancang presisi berbasis referensi visual modern.
  - **Terdeteksi Bot (Rose Red Alert Circle 🔴)**: Memberikan pendaran merah neon, badge lingkaran merah tanda silang putih, serta efek getaran (*shake animation*) dan tameng yang memantul jika terdeteksi bot otomatisasi.
  - **Sesi Kedaluwarsa (Amber Reload Circle 🟡)**: Memunculkan pendaran kuning/oranye dengan badge lingkaran berisi panah melingkar searah jarum jam (`RotateCw`) yang berputar perlahan untuk menyarankan warga melakukan refresh.
- **Penempatan Container Invisible Efisien**: Mengatur Turnstile ke mode invisible (`appearance: "interaction-only"`) di latar belakang, dan memosisikan kontainer keluar dari alur dokumen utama (absolute bottom-right), meniadakan total ruang kosong atau pergeseran margin visual.
- **Penyelarasan Request siteverify**: Refaktor penulisan body fetch Turnstile `siteverify` di server action menggunakan standar `URLSearchParams`. Mengatasi tuntas respons error `invalid-input-secret` dari Cloudflare.
- **Koreksi Kunci Pengujian Lokal**: Menyelaraskan kunci rahasia Turnstile di berkas `.env` dan `.env.example` ke kunci dummy resmi Cloudflare ending `AA` (`1x0000000000000000000000000000000AA`), mempermudah testing lokal yang selalu sukses secara out-of-the-box.

### UI/UX Polish & Stabilitas Build
- **Peningkatan Kapasitas Upload Arsip Masal**: Menaikkan batas ukuran file untuk unggah arsip PDF masal manual dari 50MB menjadi 200MB, dilengkapi dengan deskripsi panduan yang lebih jelas pada halaman pengaturan arsip.
- **Integrasi Indikator Turnstile Interaktif**: Memindahkan indikator status Cloudflare Turnstile langsung ke *border* lencana "Portal Pajak Bumi dan Bangunan" (ikon diposisikan di sebelah kanan teks) untuk visibilitas keamanan *real-time* tanpa perlu mengecek ikon footer.
- **Optimalisasi Tombol Aksi Mobile**: Menyembunyikan teks "Lunas" pada barisan tombol aksi di hasil pencarian publik khusus untuk layar *mobile*, menyisakan ikon centang hijau agar antarmuka lebih ringkas dan responsif.
- **Koreksi Overflow Dialog Button**: Menghapus penggunaan `<DialogFooter>` di dalam tag `<form>` modal PIN dan menggantinya dengan pembungkus flex `div` vertikal yang rapi. Mengatasi masalah tombol submit "Verifikasi & Buka Berkas" yang terlempar keluar modal dan melayang di sisi kiri layar.
- **TypeScript 100% Compile Pass**: Menambahkan deklarasi properti `hasArsip: boolean` ke antarmuka tipe data `PublicSearchResultItem` pada halaman pencarian, menyelesaikan error typecheck pada `next build` dan `npm run typecheck` sehingga build produksi lulus sukses dengan nol kesalahan.

## v9.2 - 2026-05-06: Security, Resilience, Dashboard Analytics & Modern Receipts

Pembaruan pada keamanan backend, penguatan upload/restore, optimasi performa, perbaikan akurasi perhitungan statistik pada dashboard, serta implementasi kwitansi landscape modern dengan konfigurasi biaya admin, visibilitas publik, dan perbaikan sinkronisasi schema database.

### Kwitansi Landscape Modern, Biaya Admin Dinamis & Kontrol Visibilitas Publik (2026-05-21)
- **PBB Receipt Number Block Formatting (2026-05-22)**: Pembaruan format nomor kwitansi pembayaran PBB agar menyertakan nomor blok NOP secara dinamis, bertransisi dari format lama `NO: PBB-00020-2026` menjadi format baru yang lebih informatif yaitu **`NO: PBB-001-0020-2026`** (menyisipkan nomor blok 3 digit di depan nomor urut objek 4 digit).
- **Synchronized Village Logo & Aspect Ratio (2026-05-22)**: Sinkronisasi visual logo desa dinamis antara hasil cetakan fisik dengan pratinjau (*onscreen preview*) modal kwitansi (sehingga file gambar PNG yang diunduh langsung via tombol "Unduh" memiliki tampilan identik). Ukuran logo desa diperbesar dari yang semula `26px x 32px` menjadi **`36px x 44px`** di kedua media (print CSS dan JSX preview) agar terlihat lebih proporsional, serta mengintegrasikan atribut `crossOrigin="anonymous"` pada elemen gambar untuk memastikan proses ekspor via `html-to-image` berjalan lancar tanpa hambatan CORS.
- **Premium A6 Landscape Receipt Migration**: Transisi total format visual kwitansi dari A5 landscape (`210mm x 148mm`) ke **A6 Landscape Modern (`148mm x 105mm`)** untuk efisiensi kertas yang lebih baik dan tampilan ultra-premium. Layout dirancang responsif menggunakan Google Fonts "Outfit", garis aksen hijau emerald, stempel "LUNAS" semi-transparan, tabel kalkulasi, tanda tangan kasir, serta QR Code verifikasi, yang diskalakan secara presisi agar tidak terjadi overflow teks pada ruang cetak yang lebih kompak.
- **Synchronized & Enlarged Print Preview Styles**: Menyinkronkan seluruh elemen visual cetak kwitansi (HTML) dengan pratinjau di layar (*onscreen preview*), termasuk membesarkan watermark **"LUNAS"** menjadi **`48px`** dengan border double **`8px`** dan letter spacing **`6px`** menggunakan Google Fonts "Outfit" (beban weight `900`), memperbaiki rendering kotak hijau ejaan (*spelled box*) "Uang Sejumlah" lewat selektor CSS presisi, mempercantik lengkungan kotak perhitungan (`12px` border-radius), mengubah garis pemisah putus-putus (*dashed border*) menjadi garis solid tipis yang elegan, serta mengosongkan nama kasir/penerima agar siap ditandatangani dan ditulis manual (tanda tangan basah).
- **Dynamic Configurable Admin Fee**: Menambahkan kolom `adminFee` pada database (`VillageConfig`) dan antarmuka pengaturan dashboard admin untuk menyesuaikan besaran default biaya admin tambahan (misal: Rp 2.000, Rp 0, atau kustom). Nilai ini disinkronkan ke seluruh sistem cetak web, portal publik, serta API mobile.
- **Public Receipt Visibility Toggle**: Menyediakan kontrol penuh bagi administrator melalui pengaturan "Tampilkan Cetak Kwitansi di Portal Publik" (`showReceiptPublic` di database). Pilihan ini menyembunyikan atau memunculkan tombol cetak bukti lunas secara dinamis pada portal pencarian warga.
- **Original PBB Tax Amount (`ketetapan`) Display**: Memperbaiki logika tampilan kwitansi agar selalu menampilkan nominal ketetapan PBB awal secara utuh dan menjumlahkannya secara akurat dengan biaya admin, meskipun nominal tagihan di portal publik bernilai 0 setelah pembayaran berhasil.
- **Reactive Public Tax Nominal Visibility**: Sinkronisasi dinamis preferensi "Tampilkan Nominal Pajak di Publik" (`showNominalPajak`) secara real-time pada saat pencarian warga. Modifikasi server action `searchPublicTaxData` dan komponen `PublicSearch` agar menyelaraskan status visibilitas nominal dari server secara instan dan reaktif tanpa menunggu revalidasi cache halaman utama.
- **Prisma Schema Sync & Hot-Reload Fix**: Menyelesaikan error crash `Unknown argument adminFee` saat menyimpan pengaturan dengan melakukan regenerasi penuh Prisma Client (`npx prisma generate`) dan memicu proses pemuatan ulang (*hot-reload*) server pengembangan Next.js untuk membaca skema database terbaru secara stabil.
- **Expo Mobile PDF & Print Integration**: Sinkronisasi penuh visual kwitansi landscape A6 ke dalam aplikasi PBB Mobile. Memperbarui `TaxpayerDetailScreen.tsx` untuk memuat default biaya admin dari API, mengonversi struktur menjadi PDF berorientasi landscape A6 (`148mm x 105mm`) dengan font Google Fonts "Outfit", serta mengintegrasikan fitur print bluetooth dan berbagi PDF langsung ke WhatsApp warga secara presisi tanpa pemotongan margin.
- **PBB Mobile Receipt Feature Cleanup**: Menghapus seluruh fungsionalitas pencetakan struk dan pembagian kwitansi di sisi HP. Kode pada `TaxpayerDetailScreen.tsx` dibersihkan dari pustaka `expo-print` & `expo-sharing`, fungsi helper ejaan `terbilang`, variabel state modal, tombol shortcut "Cetak & Bagi Kwitansi" pada Action Sheet, serta form dialog modal "Buat Struk Kwitansi" untuk memusatkan cetak resmi lewat portal website.
- **Penyempurnaan Pesan Cek Tagihan Kosong (404)**: Memperbaiki logika penanganan respons HTTP non-ok pada pencarian tagihan di `PaymentCheckScreen.tsx`. Aplikasi kini melakukan parsing body JSON ketika data tidak ditemukan (status 404), sehingga dapat menampilkan pesan ramah dari server (*"Data Wajib Pajak atau NOP tidak ditemukan"*) daripada pesan teknis mentah (*"Gagal mengambil data (Status: 404)"*).

### Database, Rate Limiter & Import Optimizations (2026-05-21)
- **Anti-Scraping & Total Anti-Indexing Protection (2026-05-22)**: Menambahkan konfigurasi anti-scraping dan larangan indeks mesin pencari secara mutlak untuk mencegah seluruh crawler, bot, dan mesin pencari (Google, Bing, Yandex, Baidu, GPTBot, dll.) merayapi, mengindeks, menyimpan cache, atau menampilkan data sensitif wajib pajak dari aplikasi ini. Proteksi diimplementasikan lapis tiga (Triple Shield): melalui berkas `public/robots.txt` (`Disallow: /`), injeksi tag meta `robots` (`noindex, nofollow, nocache`) secara global via Next.js Metadata Engine (`layout.tsx`), serta penegakan HTTP response header `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` secara server-side pada seluruh aset, halaman, dan API routes di `next.config.ts`.
- **SQLite WAL Mode Integration**: Mengaktifkan mode Write-Ahead Logging (WAL), `PRAGMA synchronous = NORMAL`, dan `PRAGMA busy_timeout = 5000` secara dinamis pada saat inisialisasi Prisma Client untuk mempercepat operasi baca-tulis paralel dan menghilangkan error *database locked*.
- **Scalable Rate Limiter with Redis Fallback**: Refaktor mesin pembatas akses (`checkRateLimit`) menjadi asinkron dengan integrasi Redis (`ioredis`) untuk mendukung beban multi-instance, lengkap dengan mekanisme *graceful fallback* bertingkat (Redis -> SQLite -> Memori).
- **High-Speed Excel Import Tuning**: Peningkatan `BATCH_SIZE` (untuk `createMany`) dan `UPDATE_BATCH_SIZE` (untuk transaksi pembaruan) menjadi **200** baris, meningkatkan performa impor massal hingga 3-5x lebih cepat.
- **SQLite Query Parameter Limit Safeguard**: Implementasi metode *chunking* berukuran maksimal **500 item** untuk seluruh pencarian `IN` massal (pada preview impor data pajak, penugasan kolektor, dan mapping data), mencegah crash "parameter limit exceeded" saat mengunggah ribuan baris data CSV/Excel.

### Dashboard & Analytics Fixes
- **Transaction Counting Accuracy**: Perbaikan bug kritis pada grafik analisis tren di mana sistem menghitung jumlah stempel waktu (timestamp) unik alih-alih jumlah total record. Hal ini memastikan impor massal dari Excel (yang memiliki waktu sama) menampilkan volume transaksi yang akurat.
- **Enhanced Summary Cards**: Memperbarui kartu "Sudah Realisasi" dan "Total Ketetapan" untuk menampilkan jumlah Wajib Pajak (WP) asli dalam keterangan sebagai konteks tambahan.
- **Participation Rate Analytics**: Mengganti kartu "Populasi WP" yang redundan dengan "Partisipasi Warga" yang menampilkan persentase jumlah WP yang telah melunasi kewajibannya.
- **Optimized Dashboard Queries**: Memperbarui backend untuk menyertakan hitungan record dalam data transaksi terkelompok guna mendukung penjumlahan yang akurat di sisi tampilan.
- **TaxDataTable Type Fix**: Memperbaiki error TypeScript pada komponen `TaxDataTable` di mana properti `blok` tidak terdefinisi pada nilai default filters, mencegah kegagalan proses build/type-check.

### Security Hardening
- **Mobile Bearer Authentication**: Seluruh endpoint operasional mobile petugas kini mewajibkan `Authorization: Bearer` dan tidak lagi mempercayai `userId` dari body/query.
- **Dashboard Role Guard**: Halaman internal `/dashboard` dan `/data-pajak` kini menolak role `PENGGUNA` di server-side dan mengarahkan warga kembali ke portal publik.
- **Mobile Login Rate Limit**: Endpoint login PBB Mobile sekarang memakai rate-limit persisten berbasis IP + username untuk menahan brute-force dan beban bcrypt berlebih.
- **Strict Mobile Token Secret**: Fallback `NEXTAUTH_SECRET` hardcoded pada token mobile dihapus; server kini gagal aman jika secret produksi belum dikonfigurasi.
- **Mobile Role Restriction**: Login PBB Mobile dibatasi hanya untuk `ADMIN` dan `PENARIK`, sehingga akun warga tidak dapat memperoleh token operasional mobile.
- **Role Ownership Enforcement**: Akses petugas `PENARIK` diperketat agar hanya bisa melihat dan memodifikasi data yang memang menjadi alokasinya.
- **Archive & Report Sanitization**: Penambahan helper sanitasi untuk mencegah HTML injection pada laporan cetak dan formula injection pada ekspor/impor Excel.
- **Safer Production Defaults**: `.env.example` diperbarui agar tidak lagi mencontohkan secret dan password lemah, serta menambahkan flag `TRUST_PROXY`.
- **Dependency Security Patch**: Perbaikan kerentanan keamanan tinggi pada paket `basic-ftp` melalui sistem `overrides` di `package.json`.
- **CodeQL Integration**: Penghapusan workflow manual CodeQL untuk menghindari konflik dengan sistem *Default Setup* otomatis dari GitHub.

### Backup, Restore & Operational Safety
- **Database Path Consistency Fix**: Mekanisme backup kini membaca path SQLite dari `DATABASE_URL` secara konsisten, bukan hardcoded ke lokasi lama.
- **Manual Maintenance Restore Tool**: Penambahan script `scripts/restore-database-from-backup.mjs` untuk proses restore database dalam mode maintenance/manual.
- **Web Database Restore Re-enabled**: Fitur restore database penuh dari antarmuka web dikembalikan dengan sistem keamanan baru (Safety Backup otomatis sebelum restore).
- **Background Archive Restore**: Restore arsip digital dipindah ke sistem job background dengan polling status.
- **Background Map Restore**: Restore data peta juga dipindah ke model background job untuk menghindari request panjang yang rapuh.

### Performance & Scalability
- **Dashboard Aggregate Query Consolidation**: Statistik utama dashboard digabung ke satu raw SQL conditional aggregation untuk mengurangi banyak query `count`/`aggregate` terpisah saat runtime.
- **Mobile Login Config Query Optimization**: Endpoint login mobile kini membaca `VillageConfig` satu kali dan memakai ulang hasilnya untuk seluruh payload konfigurasi Bapenda/mobile.
- **Shared Tax Filter Builder**: Logika filter data pajak dipusatkan di `src/lib/tax-query.ts` dan dipakai ulang oleh halaman data pajak, API `/api/tax`, bulk assign, bulk region update, dan sync Bapenda-by-filter.
- **Background Smart Scan**: Pemecahan PDF bundle arsip kini berjalan sebagai background job, sehingga UI tidak lagi tergantung koneksi streaming panjang.
- **Region Stats Aggregate Optimization**: Endpoint statistik wilayah tidak lagi menarik seluruh data ke memory Node, tetapi menghitung agregat langsung di database.
- **Cached Public Archive Index**: Pencarian publik tidak lagi melakukan scan folder arsip mentah di setiap request; indeks arsip sekarang dicache per tahun/folder.
- **Fuzzy Matching Optimization**: Refaktor logika `detectDusun` dengan reuse instance `Fuse.js` untuk menghindari CPU spike dan timeout pada pemrosesan data massal (1700+ baris).
- **Transaction-based Batch Updates**: Implementasi `prisma.$transaction` untuk proses update data pajak secara massal, mempercepat penulisan ke database SQLite secara signifikan.
- **Persistent Rate Limit Backend**: Rate limiter kini memakai backend SQLite persisten dengan fallback memory, jauh lebih stabil dibanding limiter in-memory murni.
- **Trusted Proxy IP Handling**: Pengambilan IP klien disatukan melalui helper khusus dan hanya mempercayai `x-forwarded-for`/`x-real-ip` saat `TRUST_PROXY=true`.

### Upload & File Validation
- **Global Request Limit Tightening**: `serverActions.bodySizeLimit` diturunkan dari `500mb` menjadi `25mb`.
- **Route-Specific Upload Guards**: Validasi ketat ditambahkan untuk PDF/ZIP/GPX berdasarkan ukuran, jumlah file, MIME type, ekstensi, dan jumlah entry ZIP.
- **Archive Restore ZIP Validation**: Restore arsip sekarang menolak ZIP yang kosong, terlalu besar, terlalu banyak file, atau berisi file non-PDF.
- **Map Restore ZIP Validation**: Restore peta kini membatasi ukuran ZIP, jumlah entry, dan jenis file yang boleh diekstrak.
- **SQLite Parameter Limit Adjustment**: Penurunan `BATCH_SIZE` impor menjadi 40 baris untuk menjamin kompatibilitas dengan batasan parameter SQLite (`SQLITE_MAX_VARIABLE_NUMBER`) di Windows.
- **Expo Dependency Alignment**: Perbaikan ketidaksesuaian versi paket `expo` dan `expo-file-system` melalui `expo install --fix` untuk stabilitas SDK 54.
- **Indonesian Date Parsing Support**: Mesin impor Excel kini mendukung format tanggal khusus Indonesia (contoh: `04-MEI-26`) dengan pengenalan nama bulan teks dan tahun 2 digit.
- **Import Payment Date Fallback**: Penambahan logika pengamanan yang otomatis menetapkan tanggal hari ini jika data berstatus `LUNAS` namun tidak memiliki tanggal bayar yang valid di file Excel, memastikan data realisasi tetap muncul di dashboard bulanan.


### GIS & Map Analytics Enhancement
- **Blok PBB Layer Integration**: Implementasi layer peta baru khusus untuk visualisasi "Blok PBB" yang memungkinkan pemantauan progres penagihan berdasarkan blok pajak di NOP.
- **Dynamic Block Statistics Extraction**: Penambahan logika backend untuk mengekstraksi data blok otomatis dari NOP (segmen sebelum tanda hubung) untuk agregasi statistik real-time pada peta.
- **Mutually Exclusive Map Controls**: Navigasi peta diperbarui dengan pemisahan antara kontrol wilayah administratif (Desa/Dusun/RW/RT) dan layer Blok PBB untuk menjaga kejernihan visual.
- **Mobile Map Premium Layer Control**: Menambahkan kontrol toggle layer (BK, DS, DN, RW, RT) interaktif dengan desain *floating pill* modern yang estetis pada antarmuka peta publik mobile, memberikan pengalaman interaksi visual yang seragam dengan dashboard admin desktop.
- **Custom Floating Zoom Integration**: Menggantikan tombol navigasi zoom (`+` / `-`) bawaan Leaflet yang kaku dengan desain kontrol kustom berbentuk tombol bulat yang diintegrasikan langsung secara harmonis dengan wadah *layer control*, menciptakan tampilan UI seluler yang super mulus, rapi, dan konsisten.
- **Enhanced GPX Processor Support**: Backend pemroses GPX kini mendukung format file `blokxxx.gpx` dengan deteksi tipe wilayah otomatis dan mekanisme "tanam data" ke dalam file GeoJSON utama.
- **Block-specific Unpaid WP Details**: Fitur detail Wajib Pajak kini mendukung filter per blok, memungkinkan admin melihat daftar tunggakan yang spesifik hanya untuk blok yang dipilih di peta.
- **Interactive GPX Naming Tutorial**: Penambahan section panduan tutorial penamaan file GPX pada halaman pengaturan peta untuk meminimalisir kesalahan pemetaan data wilayah.
- **Dashboard Leaderboard Optimization**: Leaderboard "Top Kolektor" kini diurutkan berdasarkan persentase capaian (%) alih-alih nilai nominal, memberikan penilaian performa yang lebih adil bagi petugas.

### Build & Production Readiness
- **Production Script Optimization**: `prisma generate` dipindahkan ke script `build`, sementara `start` kini langsung menjalankan `next start` agar startup produksi lebih cepat dan stabil.
- **Verification Scripts**: Penambahan script `typecheck` dan `verify` untuk menjalankan lint, TypeScript check, dan production build dalam satu alur verifikasi.
- **Lint Cleanup**: Seluruh warning lint yang tersisa dibersihkan, termasuk unused imports, `any` ringan, dependency `tahun` pada chart dashboard, dan preview gambar berbasis data URL.
- **Production Build Fix**: Error `useSearchParams()` nullable pada formulir publik diperbaiki sehingga `next build` kembali sukses.
- **Production Checklist**: Penambahan `docs/CHECKLIST_PRODUCTION.md` untuk panduan environment, proxy, upload, backup, dan verifikasi sebelum go-live.
- **README Ops Update**: README diperbarui agar checklist produksi ikut terdokumentasi resmi.
- **GIS Popup Layering Fix**: Perbaikan bug visual di mana popup detail wilayah pada peta tertutupi oleh kontrol navigasi dan legenda. Solusi melibatkan sinkronisasi *stacking context* dan optimasi `z-index`.
- **Blok Filter Feature**: Implementasi filter "Blok" yang diekstrak otomatis dari NOP. Pencarian menggunakan pola presisi (segment 5) untuk menghindari pencampuran data dengan nomor objek. Blok juga kini ditampilkan pada kolom Wilayah di tabel desktop dan mobile card.
- **Mobile Detail UI Polish**: Optimalisasi tampilan daftar Wajib Pajak pada perangkat mobile dengan penambahan *safe-area padding* dan *spacer* ekstra di akhir daftar agar data terakhir tidak terpotong.
- **Enhanced Mobile Filter Targets**: Peningkatan ukuran tombol filter, chip status, dan dropdown pada perangkat mobile untuk memenuhi standar aksesibilitas *touch target* yang lebih ergonomis.
- **WP Card Layout Fix**: Perbaikan bug visual pada kartu WP di mana data wilayah (Dusun/RT/RW) terpotong. Penyesuaian melibatkan sistem *wrapping* cerdas dan penghapusan teks redundan.
- **Pagination UI Streamlining**: Penyelarasan kontrol paginasi agar selalu tampil dalam satu baris horisontal di layar HP, meningkatkan efisiensi ruang dan kemudahan navigasi.
- **Hook Syntax Fix**: Perbaikan bug *syntax error* pada `useTaxFilters` hook yang menyebabkan aplikasi crash setelah pembaruan parameter filter.
- **Infrastructure Modernization (2026-05-14)**:
    - **Next.js 16 Upgrade**: Migrasi core dashboard ke Next.js 16 untuk optimasi performa Turbopack.
    - **React 19 & Compiler**: Update ke React 19.2.6 dengan dukungan awal React Compiler untuk otomatisasi memoization.
    - **TypeScript 6.0**: Peningkatan codebase ke TypeScript 6.0.3 untuk keamanan tipe data yang lebih baik.
    - **Prisma 7.8**: Update Prisma ke 7.8.0 untuk performa query SQLite yang lebih stabil.
    - **ESLint & Lucide Fix**: Penyesuaian versi ESLint dan Lucide-React untuk menjamin kompatibilitas plugin Next.js dan ketersediaan icon brand (Github).
    - **Expo SDK 55 (Mobile)**: Migrasi penuh PBB Mobile ke Expo SDK 55 dan React Native 0.85.3 untuk stabilitas aplikasi mobile jangka panjang.

### Bapenda Sync & Connectivity Resilience (2026-05-15)
- **Enhanced Request Headers**: Implementasi header browser lengkap (User-Agent, Accept-Language, etc) pada sinkronisasi Bapenda untuk meminimalisir deteksi bot dan pemblokiran akses.
- **SSL/TLS Compatibility**: Penambahan opsi bypass verifikasi sertifikat (`rejectUnauthorized: false`) untuk menjamin konektivitas ke server pemerintah yang mungkin memiliki konfigurasi SSL lama atau bermasalah.
- **Extended Connection Timeout**: Peningkatan timeout menjadi 20 detik guna mengakomodasi respon server pusat yang sering mengalami latensi tinggi di jam kerja.
- **Detailed Connectivity Diagnostics**: Pembaruan sistem pelaporan error yang kini mampu membedakan antara *Timeout*, *DNS Error*, *HTTP Status Error*, dan *Suspected IP Blocking* untuk mempermudah diagnosa teknis oleh admin.
- **Sync Request Logging**: Penambahan log server-side untuk setiap percobaan sinkronisasi guna meningkatkan transparansi aktivitas integrasi data luar.
- **Node.js Type Consistency**: Perbaikan `TSError` pada script `prisma/seed.ts` dengan penambahan referensi tipe Node.js global (`/// <reference types="node" />`) dan migrasi ke ESM imports untuk menjamin keberhasilan proses `postinstall` pada environment Linux/Armbian.
- **Global Type Definitions**: Pembaruan `tsconfig.json` dengan penyertaan tipe `"node"` secara eksplisit untuk menjamin pengenalan variabel global Node.js (`process`, `require`) di seluruh codebase.
- **Mobile Filter Resilience**: Perbaikan bug visual pada perangkat mobile di mana panel filter (Status Bayar, Kelengkapan) terpotong. Peningkatan `max-height` panel dari 600px ke 1000px dan penambahan sistem *truncation* serta *padding* ekstra memastikan seluruh kontrol filter tetap dapat diakses dan terlihat dengan jelas.

---

## v9.1 - 2026-04-27: Portal Publik & SPOP Standalone

Pembaruan besar pada portal publik dengan fokus pada kemandirian warga dalam pengajuan data melalui sistem formulir mandiri dan standarisasi desain antarmuka.

### Portal Publik & Layanan Mandiri
- **SPOP Sketch Insertion**: Implementasi fitur unggah gambar denah lokasi/peta pada formulir SPOP (Maks. 2MB). Gambar secara otomatis disisipkan ke dalam bingkai "SKET / DENAH" pada pratinjau dan dokumen cetak.
- **Popup Layout Fix**: Optimalisasi grid pada SPOP Dialog untuk memperbaiki tampilan baris RT/RW dan penempatan kotak denah agar lebih proporsional pada layar dialog.
- **Contextual Defaults**: Penyesuaian cerdas jenis transaksi; Default **Pemutakhiran** untuk versi Popup (basis NOP ada) dan **Perekaman** untuk versi Standalone (pendaftaran baru).
- **Branding Refinement**: Perubahan label layanan menjadi **SPOP / LSPOP** pada kartu beranda untuk kejelasan terminologi teknis bagi warga.
- **Search Results UI Consistency**: Penyelarasan warna tombol pada hasil pencarian (SPOP: Amber, Mutasi: Sky Blue) agar selaras dengan identitas visual di seluruh portal.
- **Form Cleanup**: Penghapusan *placeholder* yang tidak perlu pada isian No. Surat Keterangan untuk tampilan formulir yang lebih bersih.
- **Navbar Streamlining**: Penghapusan tautan "Pengajuan Baru" dari navigasi atas untuk menyederhanakan antarmuka dan memfokuskan navigasi melalui beranda.
- **Standalone SPOP/LSPOP Page**: Implementasi halaman mandiri `/spop` dengan sistem tanya jawab interaktif untuk pengajuan Mutasi, Koreksi, dan Perekaman data baru.
- **Standalone Pengajuan Baru**: Halaman mandiri `/pengajuan` untuk pendaftaran SPPT PBB Baru dengan formulir yang lebih lega dan fokus.
- **Dynamic NOP Validation**: Sistem validasi NOP cerdas yang bersifat opsional untuk Perekaman baru, namun wajib (minimal 13 digit) untuk Pemutakhiran dan Penghapusan.
- **Strict Form Sanitization**: Pengetatan batas karakter isian formulir (Nama: 21, Alamat: 21, Desa: 11, Kab: 8) sesuai standar fisik dokumen SPOP/LSPOP untuk akurasi cetak.
- **Unified Squircle UI**: Standarisasi seluruh elemen tombol publik menggunakan desain *Squircle* (`rounded-2xl`) untuk identitas visual yang lebih konsisten dan modern.
- **Mobile Navigation Polish**: Optimasi navbar mobile dengan ikon login minimalis dan logo desa yang terintegrasi dengan tautan beranda.
- **Hybrid Search Results**: Pengembalian fitur popup pada hasil pencarian NOP sementara tetap menyediakan akses ke halaman mandiri, memberikan fleksibilitas akses bagi warga.
- **Auto-fill Applicant Identity**: Sinkronisasi otomatis antara Nama Pemohon (Tahap 1) dan Nama Wajib Pajak (Tahap 2) pada form pengajuan SPPT baru untuk mempercepat input data.
- **Smart Vacant Land Flow**: Jalur navigasi cerdas pada form SPOP yang secara otomatis menyembunyikan tahap isian bangunan jika jenis tanah adalah "Tanah Kosong", lengkap dengan penyesuaian label tombol pratinjau.
- **Enhanced Form Guidance**: Penambahan *placeholder* informatif pada kolom Alamat/Jalan untuk memandu warga memberikan data lokasi yang lebih presisi.
- **Default Perekaman Transaction**: Penentuan "Perekaman Data Baru" sebagai opsi standar pada formulir SPOP untuk mempercepat proses pengisian bagi mayoritas warga.
- **Unified Brand Footer**: Integrasi ikon GitHub dan tautan repositori pada seluruh halaman layanan mandiri (`/spop` & `/pengajuan`) untuk konsistensi identitas digital proyek.

### PBB Mobile (Fitur Operasional)
- **Dynamic Action Footer**: Implementasi barisan tombol aksi di Detail WP (Sengketa, Tdk Terbit, Tandai Lunas, Batal Lunas) yang menyederhanakan pembaruan status data langsung dari lapangan.
- **EPAY Jombang Integration**: Fitur "Bayar Online" yang secara otomatis mengecek status ke Bapenda pusat dan mengarahkan petugas/WP ke portal EPAY Jombang dengan NOP terisi otomatis.
- **Interactive Notifications**: Penarikan notifikasi pemindahan alokasi kini dilengkapi tombol aksi (Terima/Tolak) yang memicu pembaruan status alokasi secara instan.
- **Premium Feedback Modals**: Penggantian alert sistem dengan *Custom Status Modal* (High-Fidelity) untuk memberikan umpan balik sukses/gagal yang lebih seragam dan modern.
- **Logout Protection**: Penambahan dialog konfirmasi keluar sesi untuk menghindari penghentian sesi petugas secara tidak sengaja.
- **Village Dynamic Branding**: Penampilan nama desa secara dinamis pada footer halaman login (Contoh: PBB Mobile Desa Balongbesuk).

### Core Backend & Logics
- **Taxpayer Status API**: Endpoint baru `/api/mobile/officer/taxpayers/status` dengan penambahan logika *Audit Log* otomatis untuk setiap pembaruan status data.
- **Transfer Response API**: Pembaruan sistem penanganan transfer data dengan sinkronisasi status alokasi real-time.
- **Advanced Activity Tracking**: Perbaikan algoritma penarikan log pada Dashboard API yang kini mencakup seluruh spektrum aktivitas petugas (Update Status, Transfer, Sinkronisasi).
- **Server Session Fix**: Pembaruan parameter `userId` pada pemanggilan *logging* server-side untuk mencegah *hang* saat pengiriman data dari platform mobile.

### UI/UX Polish
- **Rebranding Update**: Pembaruan teks label login dan identitas utama menjadi **PBB Mobile** untuk kejelasan fungsi sebagai alat operasional lapangan.
- **Layout Overlap Fix**: Optimalisasi *bottom padding* dan *safe area* pada layar detail untuk memastikan semua elemen interaktif dapat diakses dengan nyaman.

### Security Hardening & Maintenance
- **XSS Protection (DOMPurify)**: Implementasi pembersihan HTML (*HTML Sanitization*) menyeluruh menggunakan library `dompurify` pada seluruh fitur cetak dokumen publik (SPPT Baru, SPOP/LSPOP, dan Mutasi).
- **GitHub Security Alignment**: Penyinkronan kode dengan rekomendasi keamanan *GitHub Advanced Security (CodeQL)* untuk mencegah celah injeksi kode melalui input formulir warga.
- **Build Optimization**: Perbaikan kesalahan deklarasi variabel ganda dan inkonsistensi tipe data (*TypeScript Type Mismatch*) pada formulir publik untuk menjamin kelancaran proses *production build*.
- **Robust Dependency Management**: Penambahan library keamanan industri (`dompurify`) ke dalam dependensi inti proyek.

---


## v9.0 - 2026-04-16: PBB Mobile Excellence

Pembaruan besar pada ekosistem mobile yang mentransformasi PBB Manager menjadi alat operasional lapangan yang tangguh, cepat, dan modern.

### PBB Manager Mobile (Petugas)
- **Modern UI Redesign**: Redesain total antarmuka petugas dan halaman login menggunakan tema *Premium Light Mode* yang bersih, profesional, dan seragam dengan dashboard utama.
- **Taxpayer Lazy Load (Paging)**: Implementasi sistem pemuatan bertahap (pagination) pada daftar Wajib Pajak untuk memastikan aplikasi tetap responsif saat menangani ribuan data.
- **Billing History Timeline**: Fitur baru untuk melihat seluruh riwayat aktivitas penagihan petugas dalam format garis waktu (*timeline*) yang informatif.
- **Smart Notification System**: Penambahan ikon lonceng dengan *badge* notifikasi real-time untuk memantau pengumuman sistem dan permintaan transfer data.
- **Enhanced Search Experience**: Integrasi mekanisme *debounce* pada pencarian daftar WP untuk pencarian yang lebih instan tanpa membebani server.
- **Performance Card Update**: Visualisasi progres realisasi penagihan per petugas dengan progress bar dan statistik nominal (Rupiah) yang presisi.

### Backend & API Integration
- **Officer Analytics API**: Endpoint baru `/api/mobile/officer/dashboard` yang menyediakan statistik performa individu petugas (Target vs Terkumpul).
- **Paginated Taxpayers API**: Endpoint baru `/api/mobile/officer/taxpayers` dengan dukungan parameter `page` dan `limit` untuk optimasi bandwidth.
- **Activity Logs API**: Endpoint `/api/mobile/officer/logs` untuk penarikan riwayat transaksi digital yang tersaring khusus per petugas.
- **Notification Engine**: Infrastruktur backend untuk pengelolaan status baca (*mark as read*) dan distribusi notifikasi sistem.

### Infrastruktur & Branding
- **Project Rebranding**: Sinkronisasi identitas proyek menjadi **PBB Manager** dengan fokus keunggulan pada platform **PBB Mobile**.
- **EAS Build Ready**: Penambahan konfigurasi `eas.json` dan `app.json` (Android Package) untuk mendukung pembuatan file APK secara instan melalui Expo Application Services.
- **Documentation Audit**: Pembaruan menyeluruh pada `README.md` untuk merefleksikan fitur-fitur baru v9.0 dan panduan build aplikasi.

---

## v8.2 - 2026-04-06: Experience & Archive Polish

### Pencarian & Akurasi Data
- **Smart NOP Search Engine**: Optimasi mesin pencari NOP yang kini otomatis mengenali variasi format (angka polos, titik, maupun strip) di seluruh platform Admin dan Portal Publik.
- **Sanitized Search Input**: Pembatasan input pencarian maksimal 30 karakter dan pembersihan otomatis karakter spesial untuk menjaga integritas query database.
- **Riwayat Pencarian (Recent Searches)**: Implementasi penyimpanan 3 riwayat pencarian terakhir di perangkat warga untuk akses cepat data SPPT (Local Storage).
- **Debounce Optimization**: Peningkatan responsivitas pencarian pada popup peta dengan sistem *debounce* yang lebih halus.

### Manajemen Arsip Digital v2.1
- **Advanced PDF Viewer**: Penambahan fitur **Cetak (Print)** dan **Download** langsung dari jendela pratinjau arsip digital, baik di Detail Pajak maupun Kelola Arsip.
- **Real-time Restoration Progress**: Pembaruan fitur *Restore Backup* yang kini menampilkan jumlah file yang sedang diekstrak dan disusun secara riil (streaming), bukan sekadar persentase simulasi.
- **Upload Feedback**: Penambahan indikator jumlah file yang sedang diproses saat melakukan *Manual Upload* massal.
- *   **Z-Index Correction**: Perbaikan bug visual di mana viewer PDF tampil di belakang dialog detail pada dashboard admin.

... (sisanya tetap sama)
