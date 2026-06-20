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
- 🚨 **Notifikasi Margin Kritis & Harga:** Dashboard Owner otomatis memperingatkan jika HPP suatu menu melebihi threshold yang dikonfigurasi (default 80%), lengkap dengan **Rekomendasi Harga Jual Baru**.
- 💡 **Restok Cerdas:** Rekomendasi restok bahan baku deterministik berdasarkan proyeksi rata-rata penjualan 7 hari terakhir.

---

## 🐳 Cara Menjalankan dengan Docker (Rekomendasi)

Proyek ini berjalan sebagai **3 container terpisah** via Docker Compose — tidak perlu install Node.js atau PostgreSQL secara lokal.

### Prasyarat
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) terinstal dan aktif.

### Langkah-Langkah

**1. Clone Repositori:**
```bash
git clone https://github.com/Kelompok-2-SIPI/SIPI-POS-Project.git
cd SIPI-POS-Project/repo
```

**2. Jalankan semua container:**
```bash
docker compose up -d --build
```
*(Proses ini akan mengunduh image dan mem-build Next.js & Express. Mungkin memakan waktu agak lama pada percobaan pertama).*

**3. Seed data awal (WAJIB saat pertama kali):**
```bash
docker compose exec backend npx prisma db seed
```

**4. Akses Aplikasi:**

| Layanan | URL |
|---------|-----|
| Frontend (POS) | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Database | localhost:5432 |

**5. Kredensial Login Default:**
- **Username:** `admin`
- **Password:** `sipi123`

---

## 🛠️ Troubleshooting (Penting untuk Tim Dev)

Jika Anda menemui kendala saat menjalankan proyek ini di mesin lokal Anda (terutama Windows), harap periksa hal berikut:

1. **Auto-Refresh (HMR) Frontend Tidak Jalan:** Kami menggunakan Turbopack Next.js. Jika Anda mengubah kode di `frontend/src` tapi browser tidak otomatis memuat ulang (khususnya pengguna Windows/WSL), jalankan:
   `docker compose restart frontend`
2. **Error Prisma "ClientInitializationError":** Ini kadang terjadi pada *build* pertama karena perbedaan *binary engine* antara Windows dan Alpine Linux di dalam Docker. Solusinya: matikan container (`docker compose down`) lalu nyalakan lagi (`docker compose up -d`).
3. **Peringatan `package-lock.json`:** **JANGAN PERNAH** menghapus file `package-lock.json` di folder backend maupun frontend. File ini mengunci versi dependensi yang kompatibel dengan image Docker kita. Jika Anda meng-install *package* baru (npm install), pastikan untuk mem-*build* ulang container:
   `docker compose up -d --build`

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Backend | Express + Prisma ORM v6 + TypeScript |
| Database | PostgreSQL 16 |
| Styling | Vanilla CSS (Warm Bistro theme) |
| PWA | Custom Service Worker + manifest.json |
| Orchestration | Docker Engine & Docker Compose (3 container) |

---

## 📁 Struktur Folder

```
SIPI-POS-Project/
├── 00-koordinasi/    ← sprint board, task tracking
├── 01-dokumentasi/  ← PRD source of truth
├── 02-design/       ← mockup & aset desain
├── 03-output-review/← hasil kerja menunggu review
└── repo/
    ├── frontend/    ← Next.js (port 3000)
    ├── backend/     ← Express + Prisma (port 4000)
    └── docker-compose.yml
```

---

## 📝 Catatan Developer

Panduan konteks untuk AI engineer ada di `repo/AGENTS.md`.  
PRD lengkap ada di `01-dokumentasi/prd-sipi-pos-inventory-v4.4.md`.
