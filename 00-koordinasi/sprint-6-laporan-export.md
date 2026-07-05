# Sprint 6 — Laporan Rentang Tanggal & Export PDF

**Sprint Goal:** Owner dapat memilih rentang tanggal custom di Dashboard untuk melihat laporan agregat (pendapatan, transaksi, laba, top menu, kenaikan harga, margin kritis) periode tersebut, dan mengekspornya sebagai PDF.

**Status Sprint:** 🟢 Done
**Tanggal Dibuat:** 4 Juli 2026
**Tanggal Selesai:** 5 Juli 2026
**Referensi PRD:** v4.7 — FR-19, FR-20, FR-21, FR-22; revisi OQ-3
**Catatan urutan:** Sprint ini semula bernomor Sprint 7 (task ID lama: S7-xx). Ditukar jadi Sprint 6 pada 5 Juli 2026 karena sudah selesai duluan, sementara Mobile Testing & PWA Polish (semula Sprint 6) dipindah jadi Sprint 7 agar berada di akhir alur sprint — lebih logis karena testing mobile & polish PWA sebaiknya menguji seluruh fitur yang sudah stabil, termasuk fitur dari sprint ini dan Sprint 5 (chatbot AI).

---

## Kenapa Perlu Tabel Baru (`menu_hpp_history`)

Margin kritis butuh nilai HPP *pada saat itu*, bukan HPP sekarang. Tabel `menus` cuma simpan nilai HPP & harga jual terkini — begitu berubah, nilai lama hilang. Tanpa snapshot historis, laporan rentang tanggal yang lalu akan salah menampilkan margin kritis (pakai angka hari ini, bukan angka waktu itu). Karena itu FR-21 wajib dikerjakan **sebelum** FR-20 (critical-margins-range bergantung padanya).

Kenaikan harga bahan baku tidak butuh tabel baru — `ingredient_price_history` sudah punya `recordedAt` sejak awal, jadi bisa dihitung akurat untuk rentang manapun.

---

## Pembagian Tugas

| # | Task | PIC | Status | Catatan |
|---|------|-----|--------|---------|
| S6-01 | Migrasi Prisma: tabel baru `menu_hpp_history` (`menu_id`, `hpp`, `selling_price`, `recorded_at`) | Janu | 🟢 Done | Lihat skema di PRD §8. (Eks-S7-01) |
| S6-02 | Hook snapshot: insert ke `menu_hpp_history` setiap kali `recalculateAllHppsForIngredient()` jalan (FR-09) **dan** setiap kali `PUT /menus/:id` mengubah `sellingPrice` (OQ-4) | Janu | 🟢 Done | Dua titik pemicu — jangan cuma satu, atau margin ratio historis bisa salah kalau cuma harga jual yang berubah. (Eks-S7-02) |
| S6-03 | `GET /dashboard/summary-range?startDate=&endDate=` | Janu | 🟢 Done | Agregat pendapatan/transaksi/laba, mirip logic `/summary` tapi rentang bukan 1 hari. (Eks-S7-03) |
| S6-04 | `GET /dashboard/top-menus-range?startDate=&endDate=&limit=5` | Janu | 🟢 Done | Mirip `/top-menus` existing, tapi where clause pakai rentang. (Eks-S7-04) |
| S6-05 | `GET /dashboard/price-alerts-range?startDate=&endDate=` | Janu | 🟢 Done | Baseline = harga di awal rentang, current = harga di akhir rentang (dari `ingredient_price_history`). (Eks-S7-05) |
| S6-06 | `GET /dashboard/critical-margins-range?startDate=&endDate=` | Janu | 🟢 Done | Query `menu_hpp_history` dalam rentang, filter `hpp / selling_price > 0.8` (atau threshold custom yg sudah ada, S3 T-36). (Eks-S7-06) |
| S6-07 | Testing manual endpoint S6-03–S6-06 | Janu | 🟢 Done | Rentang lintas bulan & rentang 1 hari sudah dites jalan. (Eks-S7-07) |
| S6-08 | Komponen date range picker (custom start–end) di bagian baru "Laporan" pada halaman Dashboard | Raihan | 🟢 Done | Terpisah dari summary cards utama (yang tetap data hari ini, OQ-3). (Eks-S7-08) |
| S6-09 | Render ringkasan agregat rentang: pendapatan, transaksi, laba, top 5 menu | Raihan | 🟢 Done | Panggil S6-03 & S6-04. (Eks-S7-09) |
| S6-10 | Render kenaikan harga bahan baku & margin kritis untuk rentang terpilih | Raihan | 🟢 Done | Panggil S6-05 & S6-06. (Eks-S7-10) |
| S6-11 | Tombol "Export PDF" — generate PDF dari data laporan yang sudah tampil | Raihan | 🟢 Done | Library client-side (jsPDF). (Eks-S7-11) |
| S6-12 | Uji manual Sprint 6 terhadap Acceptance Criteria | Rinda, Ibnu | 🟢 Done | Semua Acceptance Criteria FR-19–FR-22 lulus. (Eks-S7-12) |

---

## Acceptance Criteria

| FR | Skenario | Kriteria Lulus |
|----|----------|----------------|
| FR-19 | Owner buka bagian Laporan, pilih tanggal mulai 1 Juni – akhir 30 Juni 2026 | Laporan tampil untuk periode itu; summary cards utama Dashboard (hari ini) tidak berubah |
| FR-20 | Rentang dipilih mencakup kenaikan harga & periode margin kritis lama | Kenaikan harga & margin kritis periode tersebut tampil akurat sesuai data historis, bukan kondisi terkini |
| FR-21 | HPP menu berubah otomatis (FR-09) atau harga jual diubah manual (OQ-4) | Entri baru muncul di `menu_hpp_history` dengan `hpp` dan `selling_price` sesuai kondisi saat itu |
| FR-22 | Owner tekan "Export PDF" | File PDF terunduh berisi seluruh isi laporan rentang yang sedang tampil |

---

## Catatan Implementasi

- **Jangan ubah perilaku Dashboard utama** (FR-11, FR-14, OQ-17) — bagian Laporan ini aditif, bukan pengganti.
- **Urutan pengerjaan penting:** S6-01 dan S6-02 (snapshot HPP) harus jalan dan mulai mengumpulkan data *sebelum* S6-06 dites — kalau belum ada snapshot sama sekali, critical-margins-range akan kosong meski secara logic sudah benar.
- PDF di-generate di **client**, bukan endpoint backend baru — hindari menambah dependency PDF generation di server tanpa kebutuhan jelas.
- Non-Goals PRD (laporan akuntansi lengkap — neraca/arus kas) **tidak berubah** — fitur ini ringkasan operasional, bukan laporan akuntansi formal (lihat PRD §5/§11).

---

## Log Progres

| Tanggal | Update | Oleh |
|---------|--------|------|
| 4 Jul 2026 | Sprint dibuat sebagai "Sprint 7" (PRD v4.6) | Claude Cowork |
| 5 Jul 2026 | Seluruh task (S7-01–S7-12 lama) dikonfirmasi selesai, termasuk testing manual | Favian |
| 5 Jul 2026 | Ditukar penomoran jadi Sprint 6 (task ID S7-xx → S6-xx) karena sudah selesai lebih dulu; Mobile Testing dipindah jadi Sprint 7 agar di akhir alur. File lama `sprint-7-laporan-export.md` dihapus, digantikan file ini | Claude Cowork |
