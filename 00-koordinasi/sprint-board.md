# Sprint Board — SIPI POS

**Terakhir diperbarui:** 19 Juli 2026
**Versi PRD:** 4.8

---

## Ringkasan Sprint

| Sprint | Modul | FR yang Dikerjakan | Status |
|--------|-------|--------------------|--------|
| Sprint 1 | POS / Kasir | FR-01, FR-02, FR-03, FR-04, FR-05 | 🟢 Done (dari MVP) |
| Sprint 2 | Inventaris & HPP | FR-06, FR-07, FR-08, FR-08a, FR-08b, FR-09, FR-10, FR-10a | 🟢 Done (dari MVP) |
| Sprint 3 | Dashboard Owner | FR-11, FR-14, FR-15, FR-16 | 🟢 Done (dari MVP) |
| Sprint 4 | Arsitektur & Polish | Refactor 3 container, navigasi OQ-7, gap PRD v4.2 | 🟢 Done |
| Sprint 5 | AI Chatbot Bidirectional | FR-12, FR-13, FR-17, FR-18, FR-16a | 🟢 Done |
| Sprint 6 | Laporan Rentang Tanggal & Export PDF | FR-19, FR-20, FR-21, FR-22 | 🟢 Done |
| Sprint 7 | Mobile Testing & PWA Polish | Semua FR (uji mobile) + PWA installable + polish & uji manual Sprint 5 | 🟢 Done |
| Sprint 8 | Advanced Insights & Arsitektur | FR-23, FR-24, FR-25, FR-26, FR-27 | 🟢 Done |

---

## Status per Functional Requirement

| ID | Kebutuhan Singkat | Modul | Sprint | Status |
|----|-------------------|-------|--------|--------|
| FR-01 | Tambah menu ke keranjang, hitung total otomatis | POS | 1 | 🟢 Done |
| FR-02 | Proses transaksi → struk digital (bottom sheet modal) | POS | 1 | 🟢 Done |
| FR-03 | Kurangi stok bahan baku otomatis berdasarkan resep | POS | 1 | 🟢 Done |
| FR-04 | Greyed-out tombol menu jika stok tidak cukup | POS | 1 | 🟢 Done |
| FR-05 | Batalkan transaksi tanpa memotong stok | POS | 1 | 🟢 Done |
| FR-06 | Restock bahan baku masuk ke total stok | Inventaris | 2 | 🟢 Done |
| FR-07 | Label merah jika stok ≤ min_stock_qty | Inventaris | 2 | 🟢 Done |
| FR-08 | Form pencatatan harga beli harian | Inventaris | 2 | 🟢 Done |
| FR-08a | Modal linimasa riwayat harga pasar | Inventaris | 2 | 🟢 Done |
| FR-08b | Sub-tab "Menu & Resep" — editor komposisi resep | Inventaris | 2 | 🟢 Done |
| FR-09 | Hitung ulang HPP otomatis saat harga bahan baku berubah | HPP | 2 | 🟢 Done |
| FR-10 | Label "Margin Kritis" jika HPP > 80% harga jual | HPP | 2 | 🟢 Done |
| FR-10a | Rekomendasi harga jual baru (target HPP 50%, bulatkan Rp1.000) | HPP | 2 | 🟢 Done |
| FR-11 | Dashboard: pendapatan, transaksi, laba, menu terlaris hari ini | Dashboard | 3 | 🟢 Done |
| FR-14 | Ringkasan teks otomatis di atas dashboard (template string, bukan LLM) | Dashboard | 3 | 🟢 Done |
| FR-15 | Rekomendasi restock: stok/avg_7d < 2 hari | Dashboard | 3 | 🟢 Done |
| FR-16 | Notifikasi kenaikan harga bahan baku > 20% dalam 7 hari | Dashboard | 3 | 🟢 Done |
| FR-12 | AI Business Q&A (natural language) | AI | 5 | 🟢 Done |
| FR-13 | AI jawab pertanyaan performa bisnis | AI | 5 | 🟢 Done |
| FR-17 | AI parse laporan belanja → restock + catat harga | AI | 5 | 🟢 Done |
| FR-18 | Konfirmasi parsing sebelum eksekusi aksi | AI | 5 | 🟢 Done |
| FR-16a | Mini-card per bahan baku di kartu alert → grafik garis tren harga 7 hari | Dashboard | 5 (tambahan) | 🟢 Done |
| FR-19 | Bagian Laporan terpisah + custom date range picker | Dashboard | 6 | 🟢 Done |
| FR-20 | Laporan agregat rentang tanggal (pendapatan, laba, top menu, alert harga, margin kritis) | Dashboard | 6 | 🟢 Done |
| FR-21 | Snapshot HPP + harga jual ke `menu_hpp_history` | HPP | 6 | 🟢 Done |
| FR-22 | Export laporan rentang tanggal sebagai PDF | Dashboard | 6 | 🟢 Done |
| FR-23 | Prediksi Menu Terlaris Besok (window 4 minggu) | Dashboard | 8 | 🟢 Done |
| FR-24 | Rekomendasi Ekspansi Menu (Bundling) via co-occurrence | Dashboard | 8 | 🟢 Done |
| FR-25 | Perluas konteks AI: Tren laba, prediksi, rekomendasi | AI | 8 | 🟢 Done |
| FR-26 | Halaman Akun Dinamis & Install PWA | Akun | 8 | 🟢 Done |
| FR-27 | Migrasi upload foto menu ke Cloudinary | Arsitektur | 8 | 🟢 Done |

---

## Sprint 4 — Arsitektur & Polish (✅ Selesai)

| # | Task | Status | PIC |
|---|------|--------|-----|
| S4-01 | Refactor 3 container (frontend:3000, backend:4000, database:5432) | 🟢 Done | Favian |
| S4-02 | Fix Docker build error (`npm ci` → `npm install`) | 🟢 Done | Favian |
| S4-03 | Verifikasi FR-14 — konfirmasi template string, bukan LLM | 🟢 Done | Favian |
| S4-04 | Fix navigasi 4 tab → 3 tab (Restock masuk sub-tab Inventaris) | 🟢 Done | Favian |
| S4-05 | Verifikasi docker-compose up berjalan bersih, login berhasil | 🟢 Done | Favian |
| S4-06 | Update README.md sesuai arsitektur dan port terbaru | 🟢 Done | Claude Cowork |
| S4-07 | Update CHANGELOG.md entri v2.0.0 | 🟢 Done | Claude Cowork |
| S4-08 | Uji manual Sprint 4 (navigasi, container, integrasi) | 🟢 Done | Rinda, Ibnu |

## Sprint 5 — AI Chatbot Bidirectional (✅ Selesai)

Branch: `feat/llm-chatbot`

| # | Task | Status | PIC |
|---|------|--------|-----|
| S5-01 | Setup Gemini SDK + env var di backend | 🟢 Done | Janu |
| S5-02 | Buat `backend/src/lib/gemini.ts` | 🟢 Done | Janu |
| S5-03 | Controller `handleChat()` — deteksi intent, susun system prompt | 🟢 Done | Janu |
| S5-04 | Controller `confirmAction()` — eksekusi restock + catat harga | 🟢 Done | Janu |
| S5-05 | Route `/api/v1/ai/chat` dan `/api/v1/ai/confirm-action` | 🟢 Done | Janu |
| S5-06 | Testing manual endpoint | 🟢 Done | Janu |
| S5-07 | Core: Floating 💬 button di Dashboard + Inventaris | 🟢 Done | Favian |
| S5-08 | Core: Komponen bottom sheet chatbot UI (bubble chat) | 🟢 Done | Favian |
| S5-09 | Core: Konfirmasi parsing + tombol Ya/Batal | 🟢 Done | Favian |
| S5-10 | Core: Ringkasan hasil setelah eksekusi | 🟢 Done | Favian |
| S5-16 | Polish: styling bubble/bottom sheet, animasi, aksesibilitas, cek feature-flag `ENABLE_AI_CHAT` | 🟢 Done (diselesaikan di S7-14) | Raihan |
| S5-11 | Uji manual Sprint 5 | 🟢 Done (diselesaikan di S7-15) | Rinda, Ibnu |

### Tambahan Sprint 5 — FR-16a (PRD v4.5, 4 Juli 2026)

| # | Task | Status | PIC |
|---|------|--------|-----|
| S5-12 | Core: mini-card per bahan baku (expand/collapse) + fetch & cache price-history di kartu alert FR-16 (Dashboard) | 🟢 Done | Favian |
| S5-13 | Core: render grafik garis (SVG polyline sederhana) 7 hari terakhir + edge case data kurang/error | 🟢 Done | Favian |
| S5-14 | Polish: styling, kontras/font sesuai §6, aksesibilitas warna, animasi expand/collapse | 🟢 Done (diselesaikan di S7-16) | Raihan |
| S5-15 | Uji manual FR-16a | 🟢 Done (diselesaikan di S7-17) | Rinda, Ibnu |

## Sprint 6 — Laporan Rentang Tanggal & Export PDF (✅ Selesai)

Detail lengkap: `00-koordinasi/sprint-6-laporan-export.md`. Sprint ini semula bernomor Sprint 7 (task ID lama S7-xx) — ditukar jadi Sprint 6 pada 5 Juli 2026 karena sudah selesai duluan.

| # | Task | Status | PIC |
|---|------|--------|-----|
| S6-01 | Migrasi Prisma: tabel `menu_hpp_history` | 🟢 Done | Janu |
| S6-02 | Hook snapshot HPP+harga jual ke `menu_hpp_history` (FR-09 & OQ-4) | 🟢 Done | Janu |
| S6-03 | `GET /dashboard/summary-range` | 🟢 Done | Janu |
| S6-04 | `GET /dashboard/top-menus-range` | 🟢 Done | Janu |
| S6-05 | `GET /dashboard/price-alerts-range` | 🟢 Done | Janu |
| S6-06 | `GET /dashboard/critical-margins-range` | 🟢 Done | Janu |
| S6-07 | Testing manual endpoint rentang tanggal | 🟢 Done | Janu |
| S6-08 | Date range picker custom di bagian "Laporan" Dashboard | 🟢 Done | Raihan |
| S6-09 | Render ringkasan agregat rentang (pendapatan, transaksi, laba, top menu) | 🟢 Done | Raihan |
| S6-10 | Render kenaikan harga & margin kritis rentang | 🟢 Done | Raihan |
| S6-11 | Tombol Export PDF (client-side) | 🟢 Done | Raihan |
| S6-12 | Uji manual Sprint 6 | 🟢 Done | Rinda, Ibnu |

---

## Sprint 7 — Mobile Testing & PWA Polish (✅ Selesai)

Detail lengkap: `00-koordinasi/sprint-7-mobile-testing.md`. Sprint ini semula bernomor Sprint 6 (task ID lama S6-xx) — ditukar jadi Sprint 7 dan diposisikan di akhir alur, karena mobile testing & polish PWA sebaiknya menguji fitur yang sudah stabil (termasuk Sprint 5 chatbot AI dan Sprint 6 Laporan).

| # | Task | Status | PIC |
|---|------|--------|-----|
| S7-00 | Generate dummy data simulasi 6 bulan (transaksi, stok, riwayat harga) | 🟢 Done | Favian |
| S7-01 | Setup environment testing mobile (IP lokal) | 🟢 Done | Favian |
| S7-02 | Uji modul POS/Kasir di mobile | 🟢 Done | Rinda, Ibnu |
| S7-03 | Uji modul Inventaris di mobile | 🟢 Done | Rinda, Ibnu |
| S7-04 | Uji modul Dashboard di mobile | 🟢 Done | Rinda, Ibnu |
| S7-05 | Uji bagian Laporan di mobile (Sprint 6) | 🟢 Done | Rinda, Ibnu |
| S7-06 | Verifikasi PWA installable | 🟢 Done | Favian |
| S7-07 | Uji offline mode POS | 🟢 Done | Rinda, Ibnu |
| S7-08 | Cek tap target ≥ 44×44px | 🟢 Done | Raihan |
| S7-09 | Cek kontras warna & ukuran font | 🟢 Done | Raihan |
| S7-10 | Cek empty state semua halaman | 🟢 Done | Raihan |
| S7-11 | Bug report di `03-output-review/bug-report-sprint7.md` | 🟢 Done | Rinda, Ibnu |
| S7-12 | Fix bug prioritas tinggi | 🟢 Done | Raihan / Janu |
| S7-13 | Retest setelah fix | 🟢 Done | Rinda, Ibnu |
| S7-14 | Polish chatbot AI: styling bubble/bottom sheet, animasi, aksesibilitas, feature-flag `ENABLE_AI_CHAT` (eks-S5-16) | 🟢 Done | Raihan |
| S7-15 | Uji manual chatbot AI Sprint 5 (eks-S5-11) | 🟢 Done | Rinda, Ibnu |
| S7-16 | Polish FR-16a: styling grafik tren harga, kontras/font §6, animasi expand/collapse (eks-S5-14) | 🟢 Done | Raihan |
| S7-17 | Uji manual FR-16a (eks-S5-15) | 🟢 Done | Rinda, Ibnu |

## Sprint 8 — Advanced Insights & Infrastructure Polish (✅ Selesai)

Detail lengkap: `00-koordinasi/sprint-8-advanced-insights-polish.md`. Pemolesan fitur analitik prediktif, perluasan AI, dan stabilisasi infrastruktur deployment.

| # | Task | Status | PIC |
|---|------|--------|-----|
| S8-01 | Prediksi Menu Terlaris Besok | 🟢 Done | Janu, Favian |
| S8-02 | Rekomendasi Ekspansi Menu (Bundling) | 🟢 Done | Janu, Favian |
| S8-03 | Tombol "Atur Resep" pre-fill form Menu Baru | 🟢 Done | Raihan |
| S8-04 | Perluas konteks AI chatbot | 🟢 Done | Janu |
| S8-05 | Perbaiki prompt AI (nama hari) | 🟢 Done | Janu |
| S8-06 | Halaman Akun Dinamis & Install PWA | 🟢 Done | Favian |
| S8-07 | Fix bug Service Worker (hydration timing) | 🟢 Done | Favian |
| S8-08 | Migrasi upload foto menu ke Cloudinary | 🟢 Done | Janu |

## Legenda Status

| Simbol | Arti |
|--------|------|
| ⬜ To Do | Belum dikerjakan |
| 🔵 Berjalan | Sprint sedang aktif |
| 🟡 In Progress | Task sedang dikerjakan |
| 🟢 Done | Selesai |
| ❓ Perlu cek | Perlu verifikasi |
| 🔴 Blocked | Ada blocker |
| 🚫 Out of MVP | Tidak dikerjakan di fase ini |
