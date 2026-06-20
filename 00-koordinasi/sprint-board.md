# Sprint Board — SIPI POS

**Terakhir diperbarui:** 20 Juni 2026  
**Versi PRD:** 4.2

---

## Ringkasan Sprint

| Sprint | Modul | FR yang Dikerjakan | Status |
|--------|-------|--------------------|--------|
| Sprint 1 | POS / Kasir | FR-01, FR-02, FR-03, FR-04, FR-05 | 🔵 Berjalan |
| Sprint 2 | Inventaris & HPP | FR-06, FR-07, FR-08, FR-08a, FR-08b, FR-09, FR-10, FR-10a | ⬜ Belum Mulai |
| Sprint 3 | Dashboard Owner | FR-11, FR-14, FR-15, FR-16 | ⬜ Belum Mulai |
| Sprint 4 | PWA, Docker, Polish | Non-FR: PWA installable, offline mode, Docker Compose, empty states | ⬜ Belum Mulai |

> FR-12 dan FR-13 (AI Assistant) — **tidak masuk MVP** (keputusan OQ-5)

---

## Status per Functional Requirement

| ID | Kebutuhan Singkat | Modul | Sprint | Status |
|----|-------------------|-------|--------|--------|
| FR-01 | Tambah menu ke keranjang, hitung total otomatis | POS | 1 | ⬜ To Do |
| FR-02 | Proses transaksi → struk digital (bottom sheet modal) | POS | 1 | ⬜ To Do |
| FR-03 | Kurangi stok bahan baku otomatis berdasarkan resep | POS | 1 | ⬜ To Do |
| FR-04 | Greyed-out tombol menu jika stok tidak cukup | POS | 1 | ⬜ To Do |
| FR-05 | Batalkan transaksi tanpa memotong stok | POS | 1 | ⬜ To Do |
| FR-06 | Restock bahan baku masuk ke total stok | Inventaris | 2 | ⬜ To Do |
| FR-07 | Label merah jika stok ≤ min_stock_qty | Inventaris | 2 | ⬜ To Do |
| FR-08 | Form pencatatan harga beli harian | Inventaris | 2 | ⬜ To Do |
| FR-08a | Modal linimasa riwayat harga pasar | Inventaris | 2 | ⬜ To Do |
| FR-08b | Sub-tab "Menu & Resep" — editor komposisi resep | Inventaris | 2 | ⬜ To Do |
| FR-09 | Hitung ulang HPP otomatis saat harga bahan baku berubah | HPP | 2 | ⬜ To Do |
| FR-10 | Label "Margin Kritis" jika HPP > 80% harga jual | HPP | 2 | ⬜ To Do |
| FR-10a | Rekomendasi harga jual baru (target HPP 50%, bulatkan Rp1.000) | HPP | 2 | ⬜ To Do |
| FR-11 | Dashboard: pendapatan, transaksi, laba, menu terlaris hari ini | Dashboard | 3 | ⬜ To Do |
| FR-14 | Ringkasan teks otomatis di atas dashboard (template string, bukan LLM) | Dashboard | 3 | ⬜ To Do |
| FR-15 | Rekomendasi restock: stok/avg_7d < 2 hari | Dashboard | 3 | ⬜ To Do |
| FR-16 | Notifikasi kenaikan harga bahan baku > 20% dalam 7 hari | Dashboard | 3 | ⬜ To Do |
| FR-12 | AI Business Q&A (natural language) | AI | — | 🚫 Out of MVP |
| FR-13 | AI jawab pertanyaan performa bisnis | AI | — | 🚫 Out of MVP |

---

## Legenda Status

| Simbol | Arti |
|--------|------|
| ⬜ To Do | Belum dikerjakan |
| 🔵 Berjalan | Sprint sedang aktif |
| 🟡 In Progress | Task sedang dikerjakan |
| 🟢 Done | Selesai & review passed |
| 🔴 Blocked | Ada blocker, perlu perhatian |
| 🚫 Out of MVP | Tidak dikerjakan di fase ini |
