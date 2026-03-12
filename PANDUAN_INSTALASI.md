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

## ⚙️ Langkah 3: Konfigurasi Keamanan (.env)

Aplikasi membutuhkan file "rahasia" untuk menyimpan settingan.
1. Cari file bernama `.env.example` di dalam folder `pbb-app`.
2. **Copy** file tersebut dan **Paste** di folder yang sama.
3. Ubah nama file hasil copy tadi menjadi `.env` (tanpa .example).
4. Klik kanan file `.env`, pilih **Open with Notepad**.
5. Cari bagian `NEXTAUTH_SECRET`. Anda bisa mengisinya dengan kata acak apa saja, contoh:
   ```env
   NEXTAUTH_SECRET="pbb-desa-mantap-sekali-123"
   ```
6. Simpan (*Save*) dan tutup Notepad.

---

## 📦 Langkah 4: Instalasi Mandiri

Kembali ke Command Prompt/Terminal yang masih terbuka di folder `pbb-app`, jalankan perintah ini satu per satu:

1. **Instal Paket Pendukung:**
   ```bash
   npm install
   ```
   *Tunggu sampai selesai. Proses ini mendownload bahan-bahan yang dibutuhkan aplikasi.*

2. **Siapkan Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```
   *Ini akan membuat file database otomatis di dalam folder.*

3. **Isi Data Awal (Akun Admin):**
   ```bash
   npx prisma db seed
   ```
   *Ini akan membuat akun admin otomatis agar Anda bisa login.*

---

## 🏃 Langkah 5: Menjalankan Aplikasi

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

## 🚀 Langkah 6: Running Production (Mode Stabil)

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
- **Password:** `admin123`

---

## 💡 Troubleshooting (Masalah Umum)

*   **Error "Port 3000 is already in use":** Berarti ada aplikasi lain yang pakai angka 3000. Tutup aplikasi tersebut atau restart komputer.
*   **Perintah tidak dikenal:** Pastikan Anda sudah instal Node.js dan restart Command Prompt.
*   **Gagal saat `npm install`:** Pastikan koneksi internet stabil.

---
*Dibuat untuk mempermudah digitalisasi desa. Selamat mencoba!*
