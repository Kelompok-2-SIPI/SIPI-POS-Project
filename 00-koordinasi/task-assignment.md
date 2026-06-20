# Task Assignment — SIPI POS

**Terakhir diperbarui:** 20 Juni 2026 (rev. 3 — rekapitulasi kontribusi Sprint 1–4)

---

## Pembagian Peran Tim

| Nama | Peran | Tanggung Jawab |
|------|-------|----------------|
| Favian | Lead / Integrator | Setup infra, Docker, arsitektur, review, koordinasi teknis |
| Janu | Backend Developer | API endpoints, business logic, Prisma, database |
| Raihan | Frontend Developer + Design | Halaman Next.js, komponen UI, mockup, navigasi |
| Rinda | QA / Tester | Uji manual fitur, verifikasi acceptance criteria, laporan bug |
| Ibnu | QA / Tester | Uji manual fitur, verifikasi acceptance criteria, laporan bug |

---

## Rekapitulasi Kontribusi per Sprint

### Sprint 1 — Modul POS/Kasir (✅ Selesai)

| Task | Deskripsi | PIC | Status |
|------|-----------|-----|--------|
| T-01 | Inisialisasi repo (Next.js + Express + Prisma + PostgreSQL) | Favian | ✅ Done |
| T-02 | Setup Docker Compose 3 container | Favian | ✅ Done |
| T-03 | Prisma schema — semua tabel sesuai PRD §8 | Favian | ✅ Done |
| T-04 | Seed data awal (menu, bahan baku, resep) | Favian | ✅ Done |
| T-05 | `GET /menus` + kalkulasi `is_available` | Janu | ✅ Done |
| T-06 | `POST /transactions` — buat transaksi pending | Janu | ✅ Done |
| T-07 | `POST /transactions/:id/complete` — selesaikan + potong stok | Janu | ✅ Done |
| T-08 | `POST /transactions/:id/cancel` — batalkan tanpa potong stok | Janu | ✅ Done |
| T-09 | `GET /transactions/:id` — detail transaksi untuk struk | Janu | ✅ Done |
| T-10 | Halaman POS: grid menu, filter kategori, search bar | Raihan | ✅ Done |
| T-11 | Komponen keranjang: item, qty +/−, subtotal, total | Raihan | ✅ Done |
| T-12 | Flow bayar: pilih metode pembayaran → konfirmasi | Raihan | ✅ Done |
| T-13 | Bottom sheet modal struk digital + tombol "Transaksi Baru" | Raihan | ✅ Done |
| T-14 | Tombol "Batal Transaksi" | Raihan | ✅ Done |
| T-15 | Empty state halaman POS | Raihan | ✅ Done |
| T-16 | Persistensi keranjang ke localStorage | Raihan | ✅ Done |
| D-01 | Mockup halaman POS | Raihan | ✅ Done |
| D-02 | Mockup keranjang & flow pembayaran | Raihan | ✅ Done |
| D-03 | Mockup bottom sheet struk | Raihan | ✅ Done |
| D-04 | Spek tombol greyed-out menu stok habis | Raihan | ✅ Done |
| T-17 | Uji manual Sprint 1 terhadap Acceptance Criteria PRD §10 | Rinda, Ibnu | ✅ Done |

---

### Sprint 2 — Modul Inventaris & HPP (✅ Selesai)

| Task | Deskripsi | PIC | Status |
|------|-----------|-----|--------|
| T-18 | `GET/POST /ingredients` — CRUD bahan baku | Janu | ✅ Done |
| T-19 | `POST /ingredients/:id/restock` — tambah stok + catat stock_movement | Janu | ✅ Done |
| T-20 | `GET/POST /ingredients/:id/price-history` — riwayat harga | Janu | ✅ Done |
| T-21 | `GET/PUT /menus/:id/recipe` — baca & update komposisi resep | Janu | ✅ Done |
| T-22 | Logic HPP: hitung ulang otomatis saat harga bahan baku berubah | Janu | ✅ Done |
| T-23 | Halaman Inventaris: sub-tab Stok, daftar bahan baku, indikator stok rendah | Raihan | ✅ Done |
| T-24 | Form restock, form update harga, modal timeline riwayat harga (📈) | Raihan | ✅ Done |
| T-25 | Sub-tab Menu & Resep: editor resep interaktif, warning margin kritis | Raihan | ✅ Done |
| T-26 | Label "Margin Kritis" + rekomendasi harga jual baru | Raihan | ✅ Done |
| T-27 | Uji manual Sprint 2 terhadap Acceptance Criteria PRD §10 | Rinda, Ibnu | ✅ Done |

---

### Sprint 3 — Modul Dashboard Owner (✅ Selesai)

| Task | Deskripsi | PIC | Status |
|------|-----------|-----|--------|
| T-28 | `GET /dashboard/summary` — pendapatan, transaksi, estimasi laba | Janu | ✅ Done |
| T-29 | `GET /dashboard/top-menus` — 5 menu terlaris | Janu | ✅ Done |
| T-30 | `GET /dashboard/critical-margins` — menu HPP > threshold | Janu | ✅ Done |
| T-31 | `GET /dashboard/price-alerts` — bahan baku naik > 20% dalam 7 hari | Janu | ✅ Done |
| T-32 | `GET /dashboard/restock-recommendations` — stok < 2 hari | Janu | ✅ Done |
| T-33 | Halaman Dashboard: summary cards, menu terlaris, alert margin kritis | Raihan | ✅ Done |
| T-34 | Ringkasan teks otomatis (template string, FR-14) | Raihan | ✅ Done |
| T-35 | Alert kenaikan harga bahan baku + daftar menu terdampak | Raihan | ✅ Done |
| T-36 | Fitur ⚙️ Configurable Thresholds (margin kritis & target HPP) | Raihan | ✅ Done |
| T-37 | Uji manual Sprint 3 terhadap Acceptance Criteria PRD §10 | Rinda, Ibnu | ✅ Done |

---

### Sprint 4 — Arsitektur & Polish (✅ Selesai)

| Task | Deskripsi | PIC | Status |
|------|-----------|-----|--------|
| S4-01 | Refactor monolith → 3 container (frontend, backend, database) | Favian | ✅ Done |
| S4-02 | Fix Docker build error (npm ci → npm install) | Favian | ✅ Done |
| S4-03 | Verifikasi FR-14 — konfirmasi template string, bukan LLM | Favian | ✅ Done |
| S4-04 | Fix navigasi 4 tab → 3 tab (Restock masuk sub-tab Inventaris) | Favian | ✅ Done |
| S4-05 | Verifikasi docker-compose up berjalan bersih, login berhasil | Favian | ✅ Done |
| S4-06 | Update README.md sesuai arsitektur dan port terbaru | Favian | ✅ Done |
| S4-07 | Update CHANGELOG.md entri v2.0.0 | Favian | ✅ Done |
| S4-08 | Uji manual Sprint 4 (navigasi, container, integrasi) | Rinda, Ibnu | ✅ Done |

---

## Ringkasan Kontribusi Tim

| Nama | Total Task | Jenis Kontribusi |
|------|:----------:|------------------|
| Favian | 11 task | Infra, Docker, arsitektur, refactor, koordinasi |
| Janu | 14 task | Semua API endpoints dan business logic backend |
| Raihan | 16 task | Semua halaman frontend, komponen UI, desain |
| Rinda | 4 task | QA & pengujian manual tiap sprint |
| Ibnu | 4 task | QA & pengujian manual tiap sprint |
