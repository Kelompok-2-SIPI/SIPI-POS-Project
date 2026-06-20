# Sprint Board — SIPI POS

**Terakhir diperbarui:** 20 Juni 2026  
**Versi PRD:** 4.2

---

## Ringkasan Sprint

| Sprint | Modul | FR yang Dikerjakan | Status |
|--------|-------|--------------------|--------|
| Sprint 1 | POS / Kasir | FR-01, FR-02, FR-03, FR-04, FR-05 | 🟢 Done (dari MVP) |
| Sprint 2 | Inventaris & HPP | FR-06, FR-07, FR-08, FR-08a, FR-08b, FR-09, FR-10, FR-10a | 🟢 Done (dari MVP) |
| Sprint 3 | Dashboard Owner | FR-11, FR-14, FR-15, FR-16 | 🟢 Done (dari MVP) |
| Sprint 4 | Arsitektur & Polish | Refactor 3 container, navigasi OQ-7, gap PRD v4.2 | 🔵 Berjalan |

> FR-12 dan FR-13 (AI Assistant) — **tidak masuk MVP** (keputusan OQ-5)

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
| FR-12 | AI Business Q&A (natural language) | AI | — | 🚫 Out of MVP |
| FR-13 | AI jawab pertanyaan performa bisnis | AI | — | 🚫 Out of MVP |

---

## Sprint 4 — Arsitektur & Polish (Berjalan)

Gap yang perlu diselesaikan berdasarkan audit MVP vs PRD v4.2:

| # | Task | Status | PIC | Catatan |
|---|------|--------|-----|---------|
| S4-01 | Refactor 3 container (frontend:3000, backend:4000, database:5432) | 🟢 Done | Favian | docker-compose.yml sudah ditulis ulang |
| S4-02 | Cek FR-14 — apakah auto text summary sudah pakai template string atau belum | ⬜ To Do | Favian | Bukan LLM — harus template string murni |
| S4-03 | Fix navigasi: dari 4 tab → 3 tab (Restock masuk sub-tab Inventaris) | ⬜ To Do | Raihan | OQ-7 PRD v4.1 |
| S4-04 | Verifikasi docker-compose up berjalan bersih + seed data jalan | ⬜ To Do | Favian | Pastikan port 3000/4000/5432 aktif |
| S4-05 | Update README.md di repo/ sesuai port dan cara run terbaru | ⬜ To Do | Favian | Port berubah: 3080 → 3000 |

---

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
