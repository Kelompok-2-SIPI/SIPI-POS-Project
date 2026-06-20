# SIPI — Sistem Informasi POS & Inventaris Stok F&B

SIPI adalah Progressive Web App (PWA) yang dirancang khusus untuk UMKM F&B (Food & Beverage) dengan pendekatan **mobile-first** (dioptimalkan untuk lebar layar smartphone 360px - 430px, namun tetap responsif di tablet/desktop).

Aplikasi ini mengintegrasikan kasir penjualan (POS) langsung dengan pengurangan stok bahan baku resep di dapur secara otomatis, pencatatan harga pasar harian bahan baku, serta dashboard bisnis untuk memantau margin laba kotor dan mendapat peringatan serta rekomendasi harga jual baru saat terjadi inflasi harga bahan baku.

---

## 🚀 Fitur Utama

- 🛒 **POS / Kasir Offline-Ready:** Grid menu dengan filter kategori & pencarian. Keranjang dinamis dengan dukungan offline total (transaksi tersimpan lokal di IndexedDB/localStorage dan otomatis disinkronisasi ketika koneksi internet pulih).
- 📝 **Struk Digital Bottom-Sheet:** Transaksi kasir selesai langsung memunculkan struk digital interaktif.
- 📦 **Inventaris & Manajemen Stok:** Pantau stok bahan baku secara real-time, lengkap dengan label visual merah **"Stok Menipis"** jika menyentuh batas minimum.
- 📈 **Market Price Tracker (Riwayat Harga Pasar):** Catat riwayat harga beli bahan baku harian dan pantau grafik/timeline pergerakan harganya.
- 🍳 **Pengatur Resep (Recipe Builder):** Setel racikan bahan baku dan takarannya (gram/ml/pcs) untuk masing-masing menu. HPP dihitung ulang secara otomatis berdasarkan harga pasar terbaru.
- 🚨 **Notifikasi Margin Kritis & Harga:** Dashboard Owner otomatis memperingatkan jika HPP suatu menu melebihi 80% dari harga jualnya, lengkap dengan **Rekomendasi Harga Jual Baru** agar mencapai target profit margin yang sehat (Target HPP 50%).
- 💡 **Restok Cerdas:** Rekomendasi restok bahan baku deterministik berdasarkan proyeksi rata-rata penjualan 7 hari terakhir.

---

## 🐳 Cara Menjalankan dengan Docker (Rekomendasi)

Proyek ini telah dikonfigurasi penuh menggunakan Docker Compose sehingga Anda tidak perlu menginstal database secara lokal.

### Prasyarat
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) terinstal dan aktif di komputer Anda.

### Langkah-Langkah:
1. **Clone Repositori:**
   ```bash
   git clone https://github.com/FiveUII/MVPSIPIGemini.git
   cd MVPSIPIGemini
   ```
2. **Nyalakan Service Containers:**
   Jalankan perintah berikut di root folder proyek:
   ```bash
   docker compose up -d
   ```
   *Perintah ini akan menyalakan container database PostgreSQL dan server Next.js, melakukan sinkronisasi skema database (Prisma db push), serta melakukan seeding data awal.*

3. **Akses Aplikasi:**
   Buka browser Anda dan akses:
   👉 **[http://localhost:3080](http://localhost:3080)**

4. **Kredensial Login Default:**
   - **Username:** `admin`
   - **Password:** `sipi123`

---

## 💻 Cara Menjalankan Lokal (Tanpa Docker - Mode Developer)

Jika Anda ingin memodifikasi kode dengan database Postgres lokal Anda sendiri:

1. **Instal Dependensi:**
   ```bash
   npm install
   ```
2. **Konfigurasi Environment Variable (`.env`):**
   Buat file `.env` di root direktori dengan isi koneksi PostgreSQL Anda:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/sipi_db"
   ```
3. **Sinkronisasi Skema Database:**
   ```bash
   npx prisma db push
   ```
4. **Jalankan Seeding Data Awal:**
   ```bash
   npx tsx prisma/seed.ts
   ```
5. **Jalankan Server Development:**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Tech Stack

- **Frontend & Backend:** Next.js (App Router, Next 16, React 19)
- **Styling:** Vanilla CSS (Modern HSL colors, terracotta & warm amber aesthetic)
- **Database ORM:** Prisma ORM v6
- **Database engine:** PostgreSQL v15
- **PWA offline:** Custom Service Worker (Workbox-like fetch intercepts) & LocalStorage queue sync.
- **Orchestration:** Docker Engine & Docker Compose

---

## 📝 Catatan Tambahan Developer
Dokumentasi pengujian, video pengetesan visual, dan detail teknis implementasi lengkap disimpan di folder artifacts `.gemini` dalam file [walkthrough.md](file:///C:/Users/favia/.gemini/antigravity-ide/brain/a6c653f6-19eb-432f-adf7-aef6dc1d792f/walkthrough.md) untuk tinjauan pair programming.
