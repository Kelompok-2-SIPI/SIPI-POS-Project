# Changelog — SIPI POS & Inventaris Stok

Semua perubahan signifikan pada project ini didokumentasikan di file ini.  
Format mengacu pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.2.0] — 2026-07-05

### Added — Sprint 6 (Mobile Testing & PWA Polish)
- **Dummy Data Seeder (6 Bulan):** Menambahkan script seeder terpisah `repo/backend/prisma/seed-dummy.ts` untuk men-generate data transaksi, pergerakan stok, dan histori harga secara realistis selama 6 bulan terakhir (Jan-Jul 2026).
  - Berguna untuk menguji performa dashboard, laporan, peringatan stok menipis, dan fluktuasi HPP.
  - **Cara menjalankan:** Jalankan perintah berikut dari dalam folder `repo/backend`:
    ```bash
    npx tsx prisma/seed-dummy.ts --reset
    ```
    *(Catatan: pastikan `DATABASE_URL` mengarah ke database Anda. Jika menggunakan localhost, tambahkan `$env:DATABASE_URL="postgresql://sipi_user:sipi_password@localhost:5432/sipi_db"` sebelum `npx`)*.

### Fixed & Improved — Sprint 6 AI Polish & Fixes
- **Dummy Seeder Stock Validation:** Diperbaiki bug di mana dummy seeder menyebabkan stok bahan baku menjadi minus. Sekarang seeder meniru perilaku POS asli dengan mencegah simulasi transaksi jika stok tidak mencukupi (mentok di 0).
- **Kategori Menu Dinamis (Datalist):** Mengubah input kategori di pengaturan menu dari `<select>` statis menjadi input dinamis (menggunakan `<datalist>`), sehingga pengguna dapat bebas membuat kategori baru (seperti "Paket") atau memilih kategori yang sudah ada.
- **Global 401 Unauthorized Handler:** Menambahkan mekanisme pembersihan otomatis (`apiFetch`) di frontend. Jika token AI atau sesi terdeteksi tidak valid (misal: setelah reset database), frontend akan otomatis logout dan memindah pengguna ke halaman Login.
- **Pembaruan Model Gemini AI:** Memperbarui engine AI ke versi stabil yang lebih handal (`gemini-2.5-flash`) untuk menghindari gangguan (Error 503 Service Unavailable) dari Google API.
- **Panduan Prompt Kontekstual:** Menambahkan teks rekomendasi perintah chatbot (template prompt) yang menyesuaikan halaman aktif. Saat berada di Halaman Inventaris AI akan menampilkan panduan perintah Restok; di halaman Dashboard AI memandu tentang pertanyaan analisa performa bisnis.
- **Auto-Refresh Live Sync:** Widget AI Chat kini memancarkan event `sipi_sync_completed` ketika pemilik UMKM menyetujui perintah restok dari AI. Ini memastikan tabel Inventaris dan chart di Dashboard langsung ter-update seketika tanpa perlu *manual refresh* browser.

---

## [2.1.0] — 2026-06-30

### Added — AI Chatbot Backend (Sprint 5)

- **Gemini SDK Integration:** Integrated `@google/generative-ai` to power natural language business queries and automated restock/shopping reports.
- **Chat Endpoint (`POST /api/v1/ai/chat`):** Secured endpoint that generates context-aware system prompts using today's sales summary, real-time ingredient stock, critical stock alerts, and critical menu margins. Detects whether the user's intent is Q&A (`qa`) or transactional (`action`).
- **Confirm Action Endpoint (`POST /api/v1/ai/confirm-action`):** Processes approved shopping report items in a database transaction, creating stock movement records (`restock`), updating ingredient prices, and automatically recalculating HPP for all affected menus.
- **Auth Middleware (`backend/src/middleware/auth.ts`):** Secured endpoints using JSON Web Token (JWT) verification.
- **In-Memory Cache:** Handled multi-step confirmations using a transient in-memory map keyed by User ID with a 5-minute TTL.

---

## [2.0.0] — 2026-06-20

### Changed — Refactor Arsitektur Containerized (PRD v4.2)

- **Pemisahan Frontend & Backend:** Arsitektur monolith (Next.js + API Routes dalam 1 container) direfactor menjadi 3 container terpisah:
  - `sipi_frontend` — Next.js, port **3000** (sebelumnya 3080)
  - `sipi_backend` — Express + Prisma, port **4000** (baru)
  - `sipi_database` — PostgreSQL 16, port **5432** (sebelumnya 5433, upgrade dari PG15)
- **Pemindahan API Routes:** Seluruh `src/app/api/v1/` (Next.js API Routes) dipindah ke service Express mandiri di `backend/src/`
- **Prisma dipindah ke backend:** `prisma/` kini ada di `backend/prisma/` — frontend tidak lagi akses database secara langsung
- **apiFetch() helper:** Ditambahkan `frontend/src/lib/api.ts` — helper fetch dengan JWT Bearer auto-attach untuk semua request dari frontend ke backend
- **docker-compose.yml ditulis ulang:** 3 service dengan named volume `sipi_postgres_data` untuk persistensi data, healthcheck pada database sebelum backend start
- **Dockerfile terpisah:** `frontend/Dockerfile` dan `backend/Dockerfile` masing-masing menggunakan `node:20-alpine`

### Changed — Navigasi (OQ-7 PRD v4.1)

- **Bottom navigation: 4 tab → 3 tab** — Tab "Restock" dihapus dari bottom nav
- **Restock masuk sub-tab Inventaris:** Halaman `/restock` dihapus, kontennya dipindah sebagai sub-tab "Restock" di dalam `/inventory`, sejajar dengan sub-tab "Stok" dan "Menu & Resep"

---

## [1.3.0] — 2026-06-16

### Fixed
- **CSS tidak tampil di Next.js App Router** — Semua style halaman sebelumnya menggunakan `<style jsx>` (styled-jsx) yang tidak kompatibel dengan App Router tanpa plugin khusus. Seluruh CSS dari `dashboard/page.tsx`, `pos/page.tsx`, dan halaman lainnya dipindahkan ke `src/app/globals.css` agar berfungsi dengan benar.
- **Tombol Keluar (Logout) tidak terlihat** — Tombol logout di halaman POS sebelumnya tidak terlihat karena CSS-nya tidak diapply. Sekarang tombol tampil jelas dengan background merah muda, teks **"Keluar"**, dan ikon, serta berubah merah solid saat hover.
- **Tombol ⚙️ Parameter tidak muncul** — Tombol pengaturan margin di header Dashboard tidak terlihat karena CSS `dashboard-header` tidak diapply. Sekarang sudah tampil di kanan atas header.

---

## [1.2.0] — 2026-06-16

### Added
- **Pengaturan Parameter Margin (Configurable Thresholds)** — Pemilik UMKM kini dapat mengatur sendiri dua parameter bisnis langsung dari Dashboard tanpa perlu coding:
  - **Batas Margin Kritis HPP (%)**: Ambang batas persentase HPP terhadap harga jual yang memicu peringatan merah (default: 80%). Contoh: jika diset 70%, maka menu dengan HPP > 70% dari harga jual akan ditandai kritis.
  - **Target HPP Rekomendasi Harga (%)**: Persentase HPP ideal yang digunakan untuk menghitung rekomendasi harga jual baru (default: 50%). Contoh: jika HPP Rp 8.000 dan target HPP = 40%, rekomendasi harga = Rp 8.000 / 40% = Rp 20.000.
  - Nilai disimpan di `localStorage` browser (`sipi_critical_threshold`, `sipi_target_hpp`) sehingga persisten antar sesi tanpa perlu database migration.
- **Propagasi pengaturan ke halaman Gudang > Menu & Resep** — Warning box margin kritis dan helper text rekomendasi harga di modal editor resep kini menggunakan nilai threshold yang dikonfigurasi owner, bukan nilai hardcode.

### Changed
- Tombol pengaturan **⚙️ Parameter** ditambahkan di header halaman Dashboard.
- Formula rekomendasi harga di halaman Inventaris diperbarui: `HPP / (targetHpp / 100)` (sebelumnya selalu `HPP * 2`).
- Teks helper input Harga Jual di modal editor resep kini menampilkan persentase target HPP secara dinamis.

---

## [1.1.0] — 2026-06-16

### Added
- **Rekomendasi Penyesuaian Harga** — Dashboard menampilkan rekomendasi harga jual baru untuk setiap menu yang masuk kategori margin kritis, dihitung berdasarkan formula: `HPP / targetHPP%`, dibulatkan ke kelipatan Rp 1.000 terdekat.
- **Peringatan Margin Kritis di Dashboard** — Daftar menu dengan HPP melebihi ambang batas (default 80%) ditampilkan secara otomatis di Dashboard, lengkap dengan persentase HPP aktual dan rekomendasi harga baru.

---

## [1.0.0] — 2026-06-16 (MVP Initial Release)

### Added

#### Infrastruktur
- **Docker Compose** — Setup `docker-compose.yml` dengan dua container: `sipi_web` (Next.js dev server, port `3080`) dan `sipi_db` (PostgreSQL 15, port `5433`). Healthcheck pada DB sebelum Web start.
- **Dockerfile** — Multi-step: install deps → generate Prisma client → copy source → jalankan `prisma db push && seed && npm run dev`.
- **`.dockerignore`** — Mengecualikan `node_modules`, `.next`, `.git` dll. agar Docker build context ringan (~4 KB vs sebelumnya 595 MB).
- **PWA (Progressive Web App)** — `manifest.json`, service worker (`public/sw.js`), dan komponen `PwaRegister` untuk registrasi SW. Mendukung install-to-homescreen dan offline transaction queue.

#### Database & Backend
- **Prisma Schema** (`prisma/schema.prisma`) — Model: `User`, `Ingredient`, `IngredientPriceHistory`, `Menu`, `RecipeItem`, `Transaction`, `TransactionItem`.
- **Database Seed** (`prisma/seed.ts`) — Data awal: 1 akun owner, 6 bahan baku F&B, 3 menu minuman dengan resep dan HPP, 2 contoh transaksi.
- **API Routes** (`/api/v1/`):
  - Auth: `POST /auth/login`, `POST /auth/logout`
  - Menu: `GET/POST /menus`, `GET/PUT/DELETE /menus/[id]`, `GET/PUT /menus/[id]/recipe`
  - Bahan Baku: `GET/POST /ingredients`, `POST /ingredients/[id]/restock`, `PUT /ingredients/[id]`, `GET/POST /ingredients/[id]/price-history`
  - Transaksi: `POST /transactions`, `POST /transactions/sync` (offline sync), `PATCH /transactions/[id]/complete`
  - Dashboard: `GET /dashboard/summary`, `/top-menus`, `/critical-margins`, `/price-alerts`, `/restock-recommendations`

#### Frontend (Mobile-First PWA)
- **Layout Global** — Warm Bistro theme (Terracotta/Amber/Cream), font Outfit + Plus Jakarta Sans, floating bottom navigation 4 tab.
- **Login** (`/login`) — Form login dengan fallback offline ke kredensial hardcode (`admin` / `sipi123`).
- **POS / Kasir** (`/pos`) — Grid menu dengan avatar inisial, filter kategori, pencarian real-time, cart floating bar, bottom-sheet checkout dengan pilihan Tunai/Non-tunai, struk digital, offline transaction queue.
- **Gudang & Inventaris** (`/inventory`):
  - Tab **Bahan Baku**: daftar stok, indikator stok rendah, form restok, form update harga, form edit detail bahan baku.
  - Tab **Bahan Baku** — Riwayat Harga: tombol 📈 membuka timeline riwayat harga historis per bahan baku.
  - Tab **Menu & Resep**: daftar menu dengan HPP dinamis, margin profit, status ketersediaan, dan editor resep interaktif (tambah/ubah/hapus bahan baku dalam resep).
- **Restock Cerdas** (`/restock`) — Rekomendasi bahan baku yang perlu direstok berdasarkan rumus `stok / rata-rata konsumsi 7 hari < 2`.
- **Dashboard Owner** (`/dashboard`) — Ringkasan pendapatan harian, transaksi selesai, estimasi laba, menu terlaris, peringatan kenaikan harga bahan baku (> 20% dalam 7 hari), dan daftar margin kritis.

---

## Kredensial Default

| Username | Password | Role  |
|----------|----------|-------|
| `admin`  | `sipi123` | Owner |

---

## Cara Menjalankan

```bash
# Clone repo
git clone https://github.com/FiveUII/MVPSIPIGemini.git
cd MVPSIPIGemini

# Jalankan dengan Docker
docker compose up -d

# Akses aplikasi
# Web: http://localhost:3080
# DB (opsional): localhost:5433
```

> **Catatan:** Data seed (bahan baku, menu, transaksi contoh) otomatis dimuat saat container pertama kali dijalankan.
