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
cd SIPI-POS-Project
```

**2. Buat file `.env`:**
```bash
cp repo/backend/.env.example repo/backend/.env
cp repo/frontend/.env.example repo/frontend/.env
```
Isi nilai aktual variabel environment sesuai yang dibagikan oleh Lead tim.

**3. Jalankan semua container:**
```bash
docker compose -f repo/docker-compose.yml up --build
```

**4. Seed data awal (pertama kali saja):**
```bash
docker compose -f repo/docker-compose.yml exec backend npx prisma db seed
```

**5. Akses Aplikasi:**

| Layanan | URL |
|---------|-----|
| Frontend (POS) | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Database | localhost:5432 |

**6. Kredensial Login Default:**
- **Username:** `admin`
- **Password:** `sipi123`

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
PRD lengkap ada di `01-dokumentasi/prd-sipi-pos-inventory-v4.2.md`.
