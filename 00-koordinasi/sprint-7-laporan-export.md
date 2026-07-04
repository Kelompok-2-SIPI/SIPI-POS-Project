# Sprint 7 — Laporan Rentang Tanggal & Export PDF

**Sprint Goal:** Owner dapat memilih rentang tanggal custom di Dashboard untuk melihat laporan agregat (pendapatan, transaksi, laba, top menu, kenaikan harga, margin kritis) periode tersebut, dan mengekspornya sebagai PDF.

**Status Sprint:** ⬜ Belum Mulai
**Tanggal Dibuat:** 4 Juli 2026
**Referensi PRD:** v4.6 — FR-19, FR-20, FR-21, FR-22; revisi OQ-3
**Berjalan setelah/paralel dengan:** Sprint 5 (AI Chatbot) & Sprint 6 (Mobile Testing) — dibuat terpisah karena scope-nya (skema baru + 4 endpoint + date picker + PDF export) cukup besar untuk berdiri sendiri.

---

## Kenapa Perlu Tabel Baru (`menu_hpp_history`)

Margin kritis butuh nilai HPP *pada saat itu*, bukan HPP sekarang. Tabel `menus` cuma simpan nilai HPP & harga jual terkini — begitu berubah, nilai lama hilang. Tanpa snapshot historis, laporan rentang tanggal yang lalu akan salah menampilkan margin kritis (pakai angka hari ini, bukan angka waktu itu). Karena itu FR-21 wajib dikerjakan **sebelum** FR-20 (critical-margins-range bergantung padanya).

Kenaikan harga bahan baku tidak butuh tabel baru — `ingredient_price_history` sudah punya `recordedAt` sejak awal, jadi bisa dihitung akurat untuk rentang manapun.

---

## Pembagian Tugas

| # | Task | PIC | Status | Catatan |
|---|------|-----|--------|---------|
| S7-01 | Migrasi Prisma: tabel baru `menu_hpp_history` (`menu_id`, `hpp`, `selling_price`, `recorded_at`) | Janu | ⬜ To Do | Lihat skema di PRD §8 |
| S7-02 | Hook snapshot: insert ke `menu_hpp_history` setiap kali `recalculateAllHppsForIngredient()` jalan (FR-09) **dan** setiap kali `PUT /menus/:id` mengubah `sellingPrice` (OQ-4) | Janu | ⬜ To Do | Dua titik pemicu — jangan cuma satu, atau margin ratio historis bisa salah kalau cuma harga jual yang berubah |
| S7-03 | `GET /dashboard/summary-range?startDate=&endDate=` | Janu | ⬜ To Do | Agregat pendapatan/transaksi/laba, mirip logic `/summary` tapi rentang bukan 1 hari |
| S7-04 | `GET /dashboard/top-menus-range?startDate=&endDate=&limit=5` | Janu | ⬜ To Do | Mirip `/top-menus` existing, tapi where clause pakai rentang |
| S7-05 | `GET /dashboard/price-alerts-range?startDate=&endDate=` | Janu | ⬜ To Do | Baseline = harga di awal rentang, current = harga di akhir rentang (dari `ingredient_price_history`) |
| S7-06 | `GET /dashboard/critical-margins-range?startDate=&endDate=` | Janu | ⬜ To Do | Query `menu_hpp_history` dalam rentang, filter `hpp / selling_price > 0.8` (atau threshold custom yg sudah ada, S3 T-36) |
| S7-07 | Testing manual endpoint S7-03–S7-06 | Janu | ⬜ To Do | Pastikan rentang lintas bulan & rentang 1 hari juga jalan |
| S7-08 | Komponen date range picker (custom start–end) di bagian baru "Laporan" pada halaman Dashboard | Raihan | ⬜ To Do | Terpisah dari summary cards utama (yang tetap data hari ini, OQ-3) |
| S7-09 | Render ringkasan agregat rentang: pendapatan, transaksi, laba, top 5 menu | Raihan | ⬜ To Do | Panggil S7-03 & S7-04 |
| S7-10 | Render kenaikan harga bahan baku & margin kritis untuk rentang terpilih | Raihan | ⬜ To Do | Panggil S7-05 & S7-06 |
| S7-11 | Tombol "Export PDF" — generate PDF dari data laporan yang sudah tampil | Raihan | ⬜ To Do | Perlu pilih library client-side (mis. jsPDF) — belum ada infra PDF di backend |
| S7-12 | Uji manual Sprint 7 terhadap Acceptance Criteria | Rinda, Ibnu | ⬜ To Do | Setelah S7-01–S7-11 selesai |

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
- **Urutan pengerjaan penting:** S7-01 dan S7-02 (snapshot HPP) harus jalan dan mulai mengumpulkan data *sebelum* S7-06 dites — kalau belum ada snapshot sama sekali, critical-margins-range akan kosong meski secara logic sudah benar.
- PDF di-generate di **client**, bukan endpoint backend baru — hindari menambah dependency PDF generation di server tanpa kebutuhan jelas.
- Non-Goals PRD (laporan akuntansi lengkap — neraca/arus kas) **tidak berubah** — fitur ini ringkasan operasional, bukan laporan akuntansi formal (lihat PRD §5/§11 catatan v4.6).

---

## Log Progres

| Tanggal | Update | Oleh |
|---------|--------|------|
| 4 Jul 2026 | Sprint 7 dibuat (PRD v4.6) | Claude Cowork |
