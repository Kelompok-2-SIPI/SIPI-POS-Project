# SIPI POS — Sistem Informasi POS & Inventaris F&B

Progressive Web App untuk manajemen kasir dan inventaris UMKM Food & Beverage.

---

## Anggota Tim

| Nama | Peran |
|------|-------|
| Favian | Lead / Integrator |
| Janu | Backend Developer |
| Raihan | Frontend Developer |
| Ibnu | QA / Tester |
| Rinda | Design & Dokumentasi |

---

## Setup Lokal (wajib dilakukan sekali setelah clone)

### Prasyarat
Pastikan sudah terinstall di komputermu:
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

Tidak perlu install Node.js, PostgreSQL, atau dependencies lain secara manual — semuanya jalan di dalam Docker.

### Langkah Setup

**1. Clone repo**
```bash
git clone https://github.com/Kelompok-2-SIPI/SIPI-POS-Project.git
cd SIPI-POS-Project
```

**2. Buat file `.env` dari template**
```bash
# Di folder root
cp .env.example .env

# Di folder backend
cp repo/backend/.env.example repo/backend/.env

# Di folder frontend
cp repo/frontend/.env.example repo/frontend/.env
```

**3. Isi nilai `.env`**

Minta nilai aktual variabel environment ke **Favian** (dibagikan via grup). Buka masing-masing file `.env` dan isi bagian yang kosong.

**4. Jalankan aplikasi**
```bash
cd repo
docker-compose up --build
```

Tunggu hingga semua container siap (biasanya 1–2 menit pertama kali). Setelah itu:

| Layanan | URL |
|---------|-----|
| Frontend (POS) | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Database | localhost:5432 (akses via DBeaver/TablePlus jika perlu) |

**5. Jalankan seed data (sekali saja)**
```bash
docker-compose exec backend npx prisma db seed
```

Selesai — aplikasi sudah bisa dipakai dengan data contoh.

---

## Alur Kerja Tim

### Branch
```
main          ← branch utama, hanya Favian yang merge ke sini
dev           ← branch integrasi, semua fitur di-merge ke sini dulu
feat/[nama]   ← branch per fitur, misal: feat/pos-keranjang
```

### Langkah kerja harian
```bash
# Sebelum mulai kerja, selalu pull dulu
git pull origin dev

# Buat branch baru untuk fiturmu
git checkout -b feat/nama-fitur

# Setelah selesai, push dan buat Pull Request ke branch dev
git push origin feat/nama-fitur
```

Pull Request akan direview oleh Favian sebelum di-merge.

---

## Struktur Folder

```
SIPI-POS-Project/
├── 00-koordinasi/       ← sprint board, task assignment (dikelola Rinda & Favian)
├── 01-dokumentasi/      ← PRD dan dokumen teknis (jangan diubah tanpa konfirmasi Favian)
├── 02-design/           ← mockup dan aset desain (dikelola Rinda)
├── 03-output-review/    ← hasil kerja yang menunggu review
└── repo/                ← kode aplikasi
    ├── frontend/        ← Next.js (Raihan)
    ├── backend/         ← Express + Prisma (Janu)
    └── docker-compose.yml
```

---

## Referensi

- **PRD (source of truth):** `01-dokumentasi/prd-sipi-pos-inventory-v4.2.md`
- **Sprint aktif:** `00-koordinasi/sprint-1-pos-kasir.md`
- **Sprint board:** `00-koordinasi/sprint-board.md`
- **Panduan prompt ke Claude:** `00-koordinasi/sipi-pos-prompt-template.md`
