# Panduan Penggunaan Sistem PBB Manager

Dokumen ini menjelaskan cara mengoperasikan fitur-fitur utama PBB Manager, mulai dari dashboard administratif hingga operasional petugas di lapangan.

---

## 1. Dashboard Admin (Web)

Dashboard admin dirancang untuk pengelolaan data tingkat tinggi oleh Kepala Desa atau Admin IT.

### Statistik Realisasi
Menampilkan total tagihan, jumlah terbayar, dan sisa penagihan secara real-time. Bagian ini juga menyertakan grafik performa per dusun.

### Manajemen Wajib Pajak
Pencarian, filter status bayar, dan pembagian wilayah penagihan per petugas. Admin dapat melakukan sinkronisasi data dengan DHKP Bapenda melalui fitur **Smart Sync**.

---

## 2. Panduan Petugas Lapangan (PBB Manager Mobile) - BARU v9.0

PBB Manager Mobile adalah alat utama bagi petugas (Kepala Dusun/Penarik) untuk bekerja di lapangan secara efisien.

### Akses & Login
1. Buka aplikasi PBB Manager di perangkat Android.
2. Masukkan URL server desa Anda (misal: `pbb.desa-anda.id` atau `10.0.2.2:3000` jika menggunakan emulator).
3. Login menggunakan username dan password petugas yang telah didaftarkan oleh Admin.

### Fitur Utama Petugas
*   **Pencarian WP Cepat**: Gunakan fitur pencarian NOP atau Nama untuk menemukan data warga di lapangan tanpa perlu membawa tumpukan buku DHKP fisik.
*   **Lazy Loading Data**: Aplikasi mendukung pemuatan data masif secara bertahap, sehingga tetap lancar meski desa Anda memiliki puluhan ribu wajib pajak.
*   **Terima Setoran**: Petugas dapat langsung mengubah status pembayaran warga setelah menerima uang setoran pajak.
*   **Timeline Penagihan**: Di bagian bawah dashboard petugas, terdapat riwayat seluruh transaksi yang dilakukan. Ini berfungsi sebagai bukti audit harian yang transparan.
*   **Pusat Notifikasi**: Ikon lonceng akan memberitahukan jika ada permintaan transfer uang dari sistem atau pengumuman penting lainnya.

---

## 3. Portal Layanan Mandiri (Warga)

Warga dapat mengakses portal publik tanpa perlu login untuk melakukan:

### Cek Tagihan
Hanya dengan memasukkan NOP, warga dapat melihat status pembayaran dan mencetak draf SPPT.

### Pengajuan Mutasi
Jika terjadi perubahan kepemilikan (Waris, Jual Beli, Hibah), warga dapat mengisi form pengajuan dan mengunggah dokumen pendukung di portal publik. Sistem akan menghasilkan draf surat permohonan (.docx) yang dapat diunduh langsung.

---

## 4. Manajemen Arsip Digital (Smart Scan)

Sistem ini memiliki kemampuan unik untuk mengolah file E-SPPT massal:
1. Unggah file PDF E-SPPT dari Bapenda (yang berisi ribuan lembar).
2. Sistem akan melakukan **Smart Scan**, memecah file tersebut menjadi ribuan file kecil per NOP secara otomatis.
3. Warga yang mencari datanya akan mendapatkan file pratinjau SPPT mereka masing-masing secara instan.

---

## 5. Pemeliharaan & Troubleshooting Mobile

### Jika Aplikasi Tidak Terhubung ke Server:
1. Pastikan komputer/server backend Anda menyala (`npm run dev`).
2. Jika menggunakan Emulator, gunakan alamat: `http://10.0.2.2:3000`.
3. Jika menggunakan HP fisik, pastikan HP dan Komputer di WiFi yang sama dan gunakan IP Lokal komputer.

### Cara Update Aplikasi:
Setiap ada pembaruan versi (seperti rilis v9.0 ini), Admin harus melakukan build APK baru melalui **EAS Build** dan membagikan filenya kepada petugas lapangan.

---

*Terakhir diperbarui: 16 April 2026*
