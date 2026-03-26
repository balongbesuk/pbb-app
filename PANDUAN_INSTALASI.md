# 🚀 Panduan Instalasi Lengkap (Untuk Pemula)

Panduan ini dibuat khusus untuk Anda yang baru pertama kali menjalankan aplikasi berbasis web (Next.js & Prisma). Silakan ikuti langkah demi langkah dengan teliti.

---

## 🛠️ Langkah 1: Persiapan Alat (*Tools*)

Sebelum mengunduh aplikasi, Anda perlu menginstal dua alat utama di komputer Anda:

### 1. Node.js (Mesin Utama)
Aplikasi ini berjalan di atas Node.js.
- **Download:** Buka [nodejs.org](https://nodejs.org/)
- **Pilih Versi:** Klik tombol **"20.x.x LTS"** (Versi LTS adalah yang paling stabil).
- **Instal:** Jalankan file yang diunduh, klik *Next* sampai selesai.
- **Verifikasi:** Buka Command Prompt (cari "cmd" di Windows Start), ketik:
  ```bash
  node -v
  ```
  Jika muncul angka seperti `v20.10.0`, berarti sudah berhasil.

### 2. Git (Untuk Download Aplikasi)
- **Download:** Buka [git-scm.com](https://git-scm.com/)
- **Instal:** Klik *Next* terus sampai selesai (gunakan pilihan default).
- **Verifikasi:** Ketik di Command Prompt:
  ```bash
  git --version
  ```

### 3. Visual Studio Code (Opsional - Editor Kode)
Sangat direkomendasikan untuk membuka dan mengedit file proyek.
- **Download:** [code.visualstudio.com](https://code.visualstudio.com/)
- **Kegunaan:** Mempermudah Anda melihat file `.env` dan menjalankan terminal di dalam satu aplikasi.

---

## 📥 Langkah 2: Mengunduh Aplikasi

1. Buka folder di komputer Anda di mana Anda ingin menyimpan proyek ini (misal: di `D:\Projek`).
2. Klik kanan di dalam folder tersebut, pilih **"Open Git Bash here"** atau buka Command Prompt di folder tersebut.
3. Ketik perintah ini:
   ```bash
   git clone https://github.com/balongbesuk/pbb-app.git
   ```
4. Masuk ke dalam folder aplikasi:
   ```bash
   cd pbb-app
   ```

---

## ⚙️ Langkah 3: Instalasi & Setup Otomatis

Sekarang bagian terbaiknya! Anda tidak perlu lagi melakukan konfigurasi manual yang rumit. Cukup jalankan satu perintah:

1. Di Command Prompt/Terminal, jalankan:
   ```bash
   npm install
   ```
2. **Tunggu sampai selesai.** Selama proses ini, aplikasi akan otomatis:
   - Mendownload bahan-bahan yang dibutuhkan (*dependencies*).
   - Membuat file konfigurasi `.env` secara otomatis (jika belum ada).
   - Menyiapkan database dan membuat akun **Admin** default.

3. **PENTING: Konfigurasi Password (Wajib)**
   Buka file `.env` menggunakan VS Code atau Notepad, lalu cari dan sesuaikan baris berikut:
   ```env
   # Password untuk akun 'admin' saat pertama kali instal (seed)
   ADMIN_PASSWORD="isi_password_kuat_anda"

   # Password default untuk user baru (PENARIK) dan saat Reset Password
   DEFAULT_USER_PASSWORD="password_petugas_anda"
   ```
   **Catatan:** Jika Anda lupa mengisi ini, aplikasi akan memberikan pesan error saat dijalankan karena faktor keamanan.

---

## 🏃 Langkah 4: Menjalankan Aplikasi

Sekarang semuanya sudah siap! Jalankan aplikasi dengan perintah:
```bash
npm run dev
```

Jika berhasil, akan muncul tulisan:
`Ready in ...ms` dan `Started server on 0.0.0.0:3000, url: http://localhost:3000`

**Cara Membuka:**
1. Buka Browser (Chrome / Edge).
2. Ketik di alamat atas: `http://localhost:3000`
3. Tekan Enter.

---

## 🚀 Langkah 5: Running Production (Mode Stabil)

Jika Anda ingin menjalankan aplikasi secara resmi (untuk penggunaan harian yang lebih cepat dan stabil), gunakan perintah ini:

1. **Matikan aplikasi** yang sedang jalan (Tekan `Ctrl + C` di Command Prompt).
2. **Build Aplikasi:**
   ```bash
   npm run build
   ```
3. **Jalankan Mode Produksi:**
   ```bash
   npm run start
   ```

Sekarang aplikasi berjalan dalam mode **Production** yang jauh lebih ringan dan responsif.

---

## 🔑 Data Login Default
Gunakan akun ini untuk masuk pertama kali:
- **Username:** `admin`
- **Password:** (Sesuai yang Anda isi di `ADMIN_PASSWORD` pada file `.env`)

---

## 🛡️ Langkah 6: Verifikasi Keamanan (Smoke Test)

Untuk memastikan aplikasi terinstal dengan benar dan semua celah keamanan tertutup rapat, Anda bisa menjalankan perintah audit otomatis:

```bash
npx tsx scripts/smoke-test.ts
```

Jika semuanya muncul **"PASSED" (Hijau)**, berarti aplikasi Anda sudah aman dan siap digunakan secara resmi.

---

## 💡 Troubleshooting (Masalah Umum)

*   **Error "Port 3000 is already in use":** Berarti ada aplikasi lain yang pakai angka 3000. Tutup aplikasi tersebut atau restart komputer.
*   **Perintah tidak dikenal:** Pastikan Anda sudah instal Node.js dan restart Command Prompt.
*   **Gagal saat `npm install`:** Pastikan koneksi internet stabil.

---

## 🐧 Panduan Khusus: Instalasi di Armbian / VPS (RAM ≤ 2GB)

Jika Anda ingin menjalankan aplikasi ini di perangkat ARM (seperti HG68p, Orange Pi, dll) atau VPS dengan RAM terbatas (≤ 2GB), ikuti langkah tambahan berikut:

### 1. Siapkan Sistem
```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y build-essential python3 make g++ git curl
```

### 2. Install Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v  # Pastikan v20.x
```

### 3. Tambahkan Swap Memory (WAJIB untuk RAM ≤ 2GB)
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Buat permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verifikasi
free -h  # Pastikan muncul Swap: 2.0G
```

### 4. Clone & Setup Otomatis
```bash
git clone https://github.com/balongbesuk/pbb-app.git
cd pbb-app

# Instalasi otomatis (mengatur .env & database)
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

### 5. Build & Jalankan
```bash
# Build dengan memory limit
NODE_OPTIONS="--max-old-space-size=1536" npm run build

# Jalankan mode produksi
npm run start
```

### 💡 Alternatif: Build di PC, Deploy ke Armbian
Jika build tetap gagal karena keterbatasan RAM, Anda bisa build di PC Windows lalu transfer hasilnya:

1.  Di PC: Jalankan `npm run build`
2.  Transfer folder berikut ke Armbian: `.next/`, `node_modules/`, `prisma/`, `public/`, `package.json`, `next.config.ts`, `.env`
3.  Di Armbian: Cukup jalankan `npm run start`

---
*Dibuat untuk mempermudah digitalisasi desa. Selamat mencoba!*
