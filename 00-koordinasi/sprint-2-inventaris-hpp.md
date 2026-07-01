# Sprint 2 — Modul Inventaris & HPP

**Sprint Goal:** Admin Gudang dapat mengelola stok bahan baku, mencatat harga pasar harian, dan melihat riwayat harga. Sistem menghitung ulang HPP otomatis dan memperingatkan menu dengan margin kritis.

**Status Sprint:** 🟢 Done (diselesaikan via MVP — MVPSIPIGemini)
**Tanggal Selesai:** 16 Juni 2026
**Dikerjakan oleh:** Favian (via Gemini Antigravity IDE)

---

## Functional Requirements Sprint Ini

| FR | Kebutuhan | Prioritas | Status |
|----|-----------|-----------|--------|
| FR-06 | Restock bahan baku masuk ke total stok | Wajib | 🟢 Done |
| FR-07 | Label merah jika stok ≤ min_stock_qty | Wajib | 🟢 Done |
| FR-08 | Form pencatatan harga beli harian | Wajib | 🟢 Done |
| FR-08a | Modal linimasa riwayat harga pasar (ikon 📈) | Wajib | 🟢 Done |
| FR-08b | Sub-tab "Menu & Resep" — editor komposisi resep | Wajib | 🟢 Done |
| FR-09 | Hitung ulang HPP otomatis saat harga bahan baku berubah | Wajib | 🟢 Done |
| FR-10 | Label "Margin Kritis" jika HPP > 80% harga jual | Wajib | 🟢 Done |
| FR-10a | Rekomendasi harga jual baru (target HPP 50%, bulatkan Rp1.000) | Wajib | 🟢 Done |

---

## Yang Dibangun

### Halaman Inventaris (`/inventory`)

**Sub-tab Bahan Baku:**
- Daftar semua bahan baku dengan stok saat ini
- Indikator stok rendah (label merah) jika `stock_qty ≤ min_stock_qty`
- Form restock: tambah kuantitas masuk ke stok
- Form update harga beli harian
- Tombol 📈 membuka modal timeline riwayat harga historis per bahan baku
- Form edit detail bahan baku (nama, satuan, min stok)

**Sub-tab Menu & Resep:**
- Daftar menu dengan HPP dinamis, margin profit, status ketersediaan
- Editor resep interaktif: tambah/ubah/hapus bahan baku dalam komposisi resep
- Warning box margin kritis di editor resep
- Helper text rekomendasi harga jual baru (dinamis sesuai threshold yang dikonfigurasi)

### Halaman Restock (`/restock`)
- Rekomendasi bahan baku yang perlu direstok berdasarkan rumus `stok / avg_konsumsi_7hari < 2`
- Diurutkan dari yang paling mendesak

### Fitur Bonus (di luar PRD, ditambahkan di v1.2.0)
- **Configurable Thresholds** via ⚙️ di Dashboard:
  - Batas Margin Kritis HPP (%) — default 80%, bisa diubah Owner
  - Target HPP Rekomendasi Harga (%) — default 50%, bisa diubah Owner
  - Nilai disimpan di `localStorage` (persisten tanpa DB migration)

### Backend (API Routes — monolith, sebelum refactor v4.2)
- `GET/POST /ingredients` — CRUD bahan baku
- `POST /ingredients/:id/restock` — tambah stok + catat stock_movement
- `GET/POST /ingredients/:id/price-history` — riwayat harga
- `GET/PUT /menus/:id/recipe` — baca & update komposisi resep
- Logic HPP: dihitung ulang otomatis saat ada perubahan harga bahan baku

---

## Acceptance Criteria — Terpenuhi

| FR | Skenario | Hasil |
|----|----------|-------|
| FR-06 | Admin tambah restock 5kg gula | stock_qty bertambah, stock_movements tercatat ✅ |
| FR-07 | stock_qty tepung < min_stock_qty | Label merah "Stok Menipis" muncul ✅ |
| FR-08 | Admin catat harga tepung Rp18.000 hari ini | Entri baru di ingredient_price_history, latest_price diperbarui ✅ |
| FR-09 | Harga gula naik dari Rp15.000 → Rp20.000 | HPP semua menu dengan gula dihitung ulang otomatis ✅ |
| FR-10 | HPP "Pisang Goreng" = 85% harga jual | Label "Margin Kritis" muncul ✅ |
| FR-10a | Menu margin kritis | Rekomendasi harga jual baru tampil otomatis ✅ |

---

## Catatan

- Navigasi `/restock` di MVP adalah halaman terpisah (tab ke-4). Di Sprint 4 akan dipindah menjadi sub-tab di dalam `/inventory` sesuai OQ-7 PRD v4.1.
- Semua fitur sprint ini dibangun dalam arsitektur monolith (Next.js API Routes). Refactor ke 3 container dikerjakan di Sprint 4.
