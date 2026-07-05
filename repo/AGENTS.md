# AGENTS.md — Panduan untuk AI Engineer (Gemini Antigravity)

Dokumen ini adalah instruksi konteks untuk AI yang mengerjakan kode di repo ini.
Baca seluruh file ini sebelum menulis atau mengubah kode apa pun.

---

## Tentang Proyek

**SIPI POS** adalah Progressive Web App (PWA) untuk manajemen kasir dan inventaris UMKM F&B.
- **PRD (source of truth):** `../01-dokumentasi/prd-sipi-pos-inventory-v4.7.md`
- **Sprint aktif:** `../00-koordinasi/sprint-board.md`
- Semua keputusan desain & arsitektur ada di PRD §14. Jangan ubah perilaku sistem tanpa merujuk ke sana.

---

## Arsitektur

3 container Docker terpisah via `docker-compose.yml`:

| Service | Tech | Port | Folder |
|---------|------|------|--------|
| frontend | Next.js 15 (App Router) | 3000 | `frontend/` |
| backend | Express + Prisma | 4000 | `backend/` |
| database | PostgreSQL 16 | 5432 | — (volume: `sipi_postgres_data`) |

**Aturan penting:**
- Frontend TIDAK boleh akses database langsung — semua lewat backend API
- Frontend fetch ke backend via `NEXT_PUBLIC_API_URL` (environment variable)
- Backend akses database via nama service Docker `database`, bukan `localhost`
- Backend wajib CORS untuk origin frontend

---

## Stack & Versi

- **Next.js 15 App Router** — gunakan `app/` directory, bukan `pages/`. Cek `node_modules/next/dist/docs/` sebelum menulis kode Next.js karena ada breaking changes dari versi sebelumnya.
- **Express** di backend — routing di `backend/src/routes/`, logic di `backend/src/controllers/`
- **Prisma** ORM — schema ada di `backend/prisma/schema.prisma`. **Jangan ubah schema tanpa konfirmasi Favian.**
- **TypeScript** — kedua service pakai TS
- **PostgreSQL 16**

---

## Struktur Folder

```
repo/
├── frontend/
│   ├── src/
│   │   ├── app/           ← halaman Next.js (App Router)
│   │   ├── components/    ← komponen reusable
│   │   └── lib/           ← helper (apiFetch, dll.)
│   ├── public/            ← aset statis, manifest.json, sw.js
│   ├── Dockerfile
│   └── .env.example
├── backend/
│   ├── src/
│   │   ├── routes/        ← Express routes
│   │   ├── controllers/   ← business logic
│   │   └── lib/           ← helpers (db, inventory, transaction)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── Dockerfile
│   └── .env.example
└── docker-compose.yml
```

---

## Database Schema (ringkas)

Model utama: `User`, `Menu`, `Ingredient`, `RecipeItem`, `IngredientPriceHistory`, `StockMovement`, `Transaction`, `TransactionItem`.
Detail lengkap ada di `backend/prisma/schema.prisma`.

---

## API Endpoints

Base URL: `http://backend:4000/api/v1` (internal Docker) / `http://localhost:4000/api/v1` (lokal)

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| POST | `/auth/login` | Login |
| GET | `/menus` | Semua menu + is_available |
| POST/PUT/DELETE | `/menus`, `/menus/:id` | CRUD menu |
| GET/PUT | `/menus/:id/recipe` | Resep menu |
| GET/POST | `/ingredients` | CRUD bahan baku |
| POST | `/ingredients/:id/restock` | Tambah stok |
| GET/POST | `/ingredients/:id/price-history` | Riwayat harga |
| POST | `/transactions` | Buat transaksi |
| POST | `/transactions/:id/complete` | Selesaikan + potong stok |
| POST | `/transactions/:id/cancel` | Batalkan |
| GET | `/dashboard/summary` | Ringkasan harian |
| GET | `/dashboard/critical-margins` | Menu margin kritis |
| GET | `/dashboard/price-alerts` | Alert kenaikan harga |
| GET | `/dashboard/restock-recommendations` | Rekomendasi restock |

---

## Aturan Kerja

- **Jangan commit `.env`** — hanya `.env.example`
- **Jangan ubah `backend/prisma/schema.prisma`** tanpa konfirmasi Favian
- **Jangan sentuh folder `../00-koordinasi/` dan `../01-dokumentasi/`** — itu wilayah Claude Cowork
- Kalau ada keputusan arsitektur baru, catat di `CHANGELOG.md`
- Output/hasil yang perlu direview taruh di `../03-output-review/`

---

## Kredensial Default (development)

| Key | Value |
|-----|-------|
| DB User | `sipi_user` |
| DB Password | `sipi_password` |
| DB Name | `sipi_db` |
| JWT Secret | `dev_jwt_secret_ganti_di_production` |
| Login Username | `admin` |
| Login Password | `sipi123` |

---

## Cara Jalankan

```bash
# Copy env files
cp repo/backend/.env.example repo/backend/.env
cp repo/frontend/.env.example repo/frontend/.env

# Jalankan semua container
docker compose -f repo/docker-compose.yml up --build

# Seed data (pertama kali saja)
docker compose -f repo/docker-compose.yml exec backend npx prisma db seed

# Akses
# Frontend: http://localhost:3000
# Backend:  http://localhost:4000
```

---

## ⚠️ SEDANG ADA REDESIGN UI/UX (branch `redesign/uiux-stitch-janu`)

**Jika tugas yang diminta berkaitan dengan tampilan/styling/CSS/komponen visual apa pun**
(bukan logic backend, bukan skema database), **WAJIB baca dulu 2 file ini sebelum
menulis atau mengubah kode apa pun**:

1. **`repo/DESIGN.md`** — source of truth desain: design tokens (warna, tipografi, radius,
   shadow), struktur navigasi (Bottom Nav mobile vs Sidebar 280px desktop), dan komponen
   yang masih perlu didesain.
2. **`repo/AGENTS-UIUX.md`** — instruksi eksekusi & guardrail khusus redesign: urutan
   tahap pengerjaan (Tahap 0–4), batasan apa yang boleh/tidak boleh disentuh, dan
   penjelasan bahwa proyek ini **TIDAK memakai Tailwind** (pakai CSS custom properties
   di `globals.css` + `styled-jsx`).

**Referensi visual (mockup Stitch):** folder `02-design/stitch-janu/` berisi hasil
eksplorasi Google Stitch (kode HTML + screenshot) untuk tiap halaman, mobile & desktop.
Ini referensi ARAH GAYA VISUAL (layout, hierarki, komponen) — bukan kode yang harus
di-copy-paste mentah, dan bukan piksel-demi-piksel yang wajib ditiru persis.

**Jangan pernah pakai file `design_meta.md`** kalau muncul di dalam folder Stitch —
itu referensi desain pihak ketiga (meta.com) yang tidak relevan dengan SIPI.

Progress redesign dilacak lewat commit message berformat `style(ui): [modul] ...` —
cek `git log --oneline` untuk tahu tahap mana yang sudah selesai sebelum melanjutkan.
