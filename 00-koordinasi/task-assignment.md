# Task Assignment — SIPI POS

**Terakhir diperbarui:** 10 Juli 2026 (rev. 6 — Sprint 7 selesai; Sprint 8 ditambahkan)

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

### Sprint 5 — AI Chatbot Bidirectional (✅ Selesai)

| Task | Deskripsi | PIC | Status |
|------|-----------|-----|--------|
| S5-01 | Setup Gemini SDK di backend + env var `GEMINI_API_KEY`, `ENABLE_AI_CHAT` | Janu | ✅ Done |
| S5-02 | Buat `backend/src/lib/gemini.ts` — helper `generateResponse()` | Janu | ✅ Done |
| S5-03 | Controller `handleChat()` — deteksi intent Q&A/Action, susun system prompt dengan data DB | Janu | ✅ Done |
| S5-04 | Controller `confirmAction()` — eksekusi restock + catat harga, validasi nama bahan baku | Janu | ✅ Done |
| S5-05 | Route `/api/v1/ai/chat` dan `/api/v1/ai/confirm-action`, daftarkan di `index.ts` | Janu | ✅ Done |
| S5-06 | Testing manual endpoint (Q&A + Action flow) | Janu | ✅ Done |
| S5-07 | Core: Floating 💬 button di halaman Dashboard + Inventaris | Favian | ✅ Done |
| S5-08 | Core: Komponen bottom sheet chatbot UI (bubble chat Owner vs AI) | Favian | ✅ Done |
| S5-09 | Core: Tampilkan konfirmasi parsing + tombol "Ya, Lanjutkan" / "Batal" | Favian | ✅ Done |
| S5-10 | Core: Tampilkan ringkasan hasil setelah eksekusi konfirmasi | Favian | ✅ Done |
| S5-16 | Polish: styling bubble/bottom sheet, animasi, aksesibilitas, cek `ENABLE_AI_CHAT` | Raihan | ✅ Done (diselesaikan di S7-14) |
| S5-11 | Uji manual Sprint 5 terhadap Acceptance Criteria FR-12/13/17/18 | Rinda, Ibnu | ✅ Done (diselesaikan di S7-15) |
| S5-12 | FR-16a Core: mini-card + expand/collapse + fetch price-history di kartu alert Dashboard | Favian | ✅ Done |
| S5-13 | FR-16a Core: grafik garis SVG sederhana 7 hari + edge case data kurang/error | Favian | ✅ Done |
| S5-14 | FR-16a Polish: styling, kontras/font §6, aksesibilitas warna, animasi | Raihan | ✅ Done (diselesaikan di S7-16) |
| S5-15 | Uji manual FR-16a | Rinda, Ibnu | ✅ Done (diselesaikan di S7-17) |

---

### Sprint 6 — Laporan Rentang Tanggal & Export PDF (✅ Selesai)

_Sprint ini semula bernomor Sprint 7 (task ID lama S7-xx) — ditukar jadi Sprint 6 pada 5 Juli 2026 karena sudah selesai duluan. Detail: `sprint-6-laporan-export.md`._

| Task | Deskripsi | PIC | Status |
|------|-----------|-----|--------|
| S6-01 | Migrasi Prisma: tabel `menu_hpp_history` | Janu | ✅ Done |
| S6-02 | Hook snapshot HPP+harga jual ke `menu_hpp_history` (FR-09 & OQ-4) | Janu | ✅ Done |
| S6-03 | `GET /dashboard/summary-range` | Janu | ✅ Done |
| S6-04 | `GET /dashboard/top-menus-range` | Janu | ✅ Done |
| S6-05 | `GET /dashboard/price-alerts-range` | Janu | ✅ Done |
| S6-06 | `GET /dashboard/critical-margins-range` | Janu | ✅ Done |
| S6-07 | Testing manual endpoint rentang tanggal | Janu | ✅ Done |
| S6-08 | Date range picker custom di bagian "Laporan" Dashboard | Raihan | ✅ Done |
| S6-09 | Render ringkasan agregat rentang (pendapatan, transaksi, laba, top menu) | Raihan | ✅ Done |
| S6-10 | Render kenaikan harga & margin kritis rentang | Raihan | ✅ Done |
| S6-11 | Tombol Export PDF (client-side) | Raihan | ✅ Done |
| S6-12 | Uji manual Sprint 6 | Rinda, Ibnu | ✅ Done |

---

### Sprint 7 — Mobile Testing & PWA Polish (✅ Selesai)

_Sprint ini semula bernomor Sprint 6 (task ID lama S6-xx) — ditukar jadi Sprint 7 dan dipindah ke akhir alur. Detail: `sprint-7-mobile-testing.md`._

| Task | Deskripsi | PIC | Status |
|------|-----------|-----|--------|
| S7-00 | Generate dummy data simulasi 6 bulan (transaksi, stok, riwayat harga) | Favian | ✅ Done |
| S7-01 | Setup environment testing mobile (akses via IP lokal di HP) | Favian | ✅ Done |
| S7-02 | Uji modul POS/Kasir di mobile — FR-01–FR-05 | Rinda, Ibnu | ✅ Done |
| S7-03 | Uji modul Inventaris di mobile — FR-06–FR-10a | Rinda, Ibnu | ✅ Done |
| S7-04 | Uji modul Dashboard di mobile — FR-11, FR-14–FR-16 | Rinda, Ibnu | ✅ Done |
| S7-05 | Uji bagian Laporan di mobile — FR-19–FR-22 | Rinda, Ibnu | ✅ Done |
| S7-06 | Verifikasi PWA installable (manifest.json + Service Worker) | Favian | ✅ Done |
| S7-07 | Uji offline mode POS — transaksi saat offline, sync saat pulih | Rinda, Ibnu | ✅ Done |
| S7-08 | Cek tap target semua tombol utama ≥ 44×44px | Raihan | ✅ Done |
| S7-09 | Cek kontras warna & ukuran font (min 14px body, 16px angka harga) | Raihan | ✅ Done |
| S7-10 | Cek empty state semua halaman (POS, Inventaris, Dashboard, Laporan) | Raihan | ✅ Done |
| S7-11 | Buat bug report di `03-output-review/bug-report-sprint7.md` | Rinda, Ibnu | ✅ Done |
| S7-12 | Fix bug prioritas tinggi hasil testing | Raihan / Janu | ✅ Done |
| S7-13 | Retest setelah fix — sign-off final | Rinda, Ibnu | ✅ Done |
| S7-14 | Polish chatbot AI: styling, animasi, aksesibilitas, feature-flag (eks-S5-16) | Raihan | ✅ Done |
| S7-15 | Uji manual chatbot AI Sprint 5 (eks-S5-11) | Rinda, Ibnu | ✅ Done |
| S7-16 | Polish FR-16a: styling grafik tren harga, kontras/font §6, animasi (eks-S5-14) | Raihan | ✅ Done |
| S7-17 | Uji manual FR-16a (eks-S5-15) | Rinda, Ibnu | ✅ Done |

---

### Sprint 8 — Advanced Insights & Infrastructure Polish (✅ Selesai)

_Pemolesan fitur analitik prediktif, perluasan AI, dan stabilisasi infrastruktur deployment. Detail: `sprint-8-advanced-insights-polish.md`._

| Task | Deskripsi | PIC | Status |
|------|-----------|-----|--------|
| S8-01 | Prediksi Menu Terlaris Besok (window 4 minggu) di Dashboard (FR-23) | Janu, Favian | ✅ Done |
| S8-02 | Rekomendasi Ekspansi Menu/Bundling via co-occurrence 8 minggu (FR-24) | Janu, Favian | ✅ Done |
| S8-03 | Tombol "Atur Resep" di card Bundling — pre-fill form Menu Baru (FR-24a) | Raihan | ✅ Done |
| S8-04 | Perluas konteks AI: tren laba 6 bulan, prediksi, rekomendasi (FR-25) | Janu | ✅ Done |
| S8-05 | Perbaiki prompt AI (nama hari eksplisit, hapus template lama) | Janu | ✅ Done |
| S8-06 | Halaman Akun: tampilkan nama usaha dinamis + tombol Install PWA (FR-26) | Favian | ✅ Done |
| S8-07 | Fix bug Service Worker tidak ter-register (timing window.load vs hydration) | Favian | ✅ Done |
| S8-08 | Migrasi upload foto menu dari disk lokal ke Cloudinary (FR-27) | Janu | ✅ Done |

---

## Ringkasan Kontribusi Tim

| Nama | Sprint 1–4 | Sprint 5–6 | Sprint 7–8 | Total | Jenis Kontribusi |
|------|:----------:|:----------:|:----------:|:-----:|------------------|
| Favian | 11 task | 6 task | 5 task | 22 task | Infra, Docker, arsitektur, AI frontend, PWA, Cloudinary |
| Janu | 14 task | 7 task | 6 task | 27 task | Backend API, business logic, LLM integration, Insights |
| Raihan | 16 task | 6 task | 8 task | 30 task | Frontend, UI, desain, mobile polish, bundling UX |
| Rinda | 4 task | 7 task | 8 task | 19 task | QA & pengujian manual tiap sprint |
| Ibnu | 4 task | 7 task | 8 task | 19 task | QA & pengujian manual tiap sprint |
