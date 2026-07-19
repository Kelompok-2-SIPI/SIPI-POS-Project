# Sprint 3 — Modul Dashboard Owner

**Sprint Goal:** Owner dapat melihat ringkasan performa bisnis harian secara sekilas — pendapatan, laba, menu terlaris, peringatan margin kritis, dan alert kenaikan harga bahan baku.

**Status Sprint:** 🟢 Done (diselesaikan via MVP — MVPSIPIGemini)
**Tanggal Selesai:** 16 Juni 2026
**Dikerjakan oleh:** Favian (via Gemini Antigravity IDE)

---

## Functional Requirements Sprint Ini

| FR | Kebutuhan | Prioritas | Status |
|----|-----------|-----------|--------|
| FR-11 | Dashboard: pendapatan, transaksi, laba, menu terlaris hari ini | Wajib | 🟢 Done |
| FR-14 | Ringkasan teks otomatis (template string, bukan LLM) | Wajib | 🟢 Done |
| FR-15 | Rekomendasi restock: stok/avg_7d < 2 hari | Wajib | 🟢 Done |
| FR-16 | Notifikasi kenaikan harga bahan baku > 20% dalam 7 hari | Wajib | 🟢 Done |

---

## Yang Dibangun

### Halaman Dashboard (`/dashboard`)

- **Summary cards:** total pendapatan harian, jumlah transaksi selesai, estimasi laba kotor
- **Menu terlaris:** daftar ranking 5 menu terlaris hari ini
- **Peringatan Margin Kritis:** daftar menu dengan HPP > threshold (default 80%), lengkap dengan rekomendasi harga jual baru
- **Alert Kenaikan Harga:** daftar bahan baku dengan kenaikan harga > 20% dalam 7 hari terakhir, disertai daftar menu terdampak
- **Tombol ⚙️ Parameter:** Owner bisa atur threshold margin kritis dan target HPP sendiri

### Backend (API Routes)
- `GET /dashboard/summary?date=YYYY-MM-DD` — pendapatan, transaksi, estimasi laba
- `GET /dashboard/top-menus?date=YYYY-MM-DD&limit=5` — menu terlaris
- `GET /dashboard/critical-margins` — menu dengan HPP melebihi threshold
- `GET /dashboard/price-alerts` — bahan baku naik harga > 20% dalam 7 hari + menu terdampak
- `GET /dashboard/restock-recommendations` — bahan baku stok < 2 hari

---

## Acceptance Criteria — Status

| FR | Skenario | Hasil |
|----|----------|-------|
| FR-11 | Owner buka dashboard | Summary cards tampil: pendapatan, transaksi, laba, 5 menu terlaris ✅ |
| FR-14 | Teks ringkasan otomatis di atas dashboard | Dikonfirmasi menggunakan **template string** murni (bukan LLM). Contoh: *"Hari ini {n} transaksi, pendapatan Rp {x}, estimasi laba Rp {y}. Menu terlaris: {menu}."* — dikonfirmasi di Sprint 4 (S4-03) ✅ |
| FR-15 | Stok gula sisa 0,75 hari | Gula muncul urutan teratas di rekomendasi restock ✅ |
| FR-16 | Tepung naik 41% dalam 7 hari | Notifikasi peringatan muncul + daftar menu terdampak ✅ |

---

_(Tidak ada item terbuka — FR-14 dikonfirmasi pakai template string di Sprint 4 (S4-03))_
