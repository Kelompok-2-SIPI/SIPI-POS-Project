# Sprint 1 — Modul POS / Kasir

**Sprint Goal:** Kasir dapat memproses transaksi dari memilih menu hingga struk muncul, dengan stok terpotong otomatis dan tombol greyed-out untuk menu yang kehabisan bahan baku.

**Status Sprint:** 🟢 Done (diselesaikan via MVP migrasi)  
**Tanggal Mulai:** 16 Juni 2026 (MVP initial release)  
**Tanggal Selesai:** 20 Juni 2026  
**Tim Sprint 1:** Favian (Lead), Janu (Backend), Raihan (Frontend + Design), Rinda (QA), Ibnu (QA)

---

## Functional Requirements Sprint Ini

| FR | Kebutuhan | Prioritas |
|----|-----------|-----------|
| FR-01 | Kasir bisa tambah menu ke keranjang, total harga dihitung otomatis | Wajib |
| FR-02 | Transaksi diproses → status `completed` → struk digital muncul sebagai bottom sheet modal | Wajib |
| FR-03 | Stok bahan baku berkurang otomatis sesuai komposisi resep menu yang terjual | Wajib |
| FR-04 | Tombol menu di-greyed-out jika stok bahan baku ≤ 0 | Wajib |
| FR-05 | Batalkan transaksi aktif → keranjang kosong, stok tidak berkurang | Wajib |

---

## Task Breakdown

### Setup & Foundation

| # | Task | PIC | Status | Catatan |
|---|------|-----|--------|---------|
| T-01 | Inisialisasi repo (Next.js + Express + Prisma + PostgreSQL) | Favian | 🟢 Done | Struktur folder frontend/ dan backend/ terpisah |
| T-02 | Buat `docker-compose.yml` dengan 3 container (frontend:3000, backend:4000, database:5432) | Favian | 🟢 Done | Named volume `postgres_data` untuk persistensi |
| T-03 | Buat Prisma schema — tabel: `menus`, `ingredients`, `recipe_items`, `transactions`, `transaction_items`, `stock_movements` | Favian | 🟢 Done | Sesuai §8 PRD v4.2 |
| T-04 | Seed data awal: minimal 3 menu dengan komposisi resep + bahan baku terkait | Favian | 🟢 Done | Untuk bisa langsung test di Sprint 1 |

### Backend — API Endpoints Sprint 1

| # | Task | PIC | Status | Endpoint |
|---|------|-----|--------|----------|
| T-05 | `GET /menus` — ambil semua menu + status ketersediaan (`is_available`) | Janu | 🟢 Done | Cek stok bahan baku vs resep |
| T-06 | `POST /transactions` — buat transaksi baru (status: `pending`) | Janu | 🟢 Done | |
| T-07 | `POST /transactions/:id/complete` — selesaikan transaksi: kurangi stok, update `is_available`, simpan snapshot HPP | Janu | 🟢 Done | FR-02 + FR-03 |
| T-08 | `POST /transactions/:id/cancel` — batalkan tanpa memotong stok | Janu | 🟢 Done | FR-05 |
| T-09 | `GET /transactions/:id` — ambil detail transaksi untuk struk | Janu | 🟢 Done | FR-02 |

### Frontend — Halaman POS

| # | Task | PIC | Status | Catatan |
|---|------|-----|--------|---------|
| T-10 | Halaman POS: grid menu dengan filter kategori + search bar | Raihan | 🟢 Done | FR-01, OQ-9; tombol greyed-out (FR-04) |
| T-11 | Komponen Keranjang: tampilkan item, qty (tombol +/−), subtotal, total | Raihan | 🟢 Done | FR-01, OQ-8 |
| T-12 | Flow "Bayar": pilih metode pembayaran → konfirmasi → hit API complete | Raihan | 🟢 Done | FR-02, OQ-10 |
| T-13 | Bottom Sheet Modal Struk: tampilkan detail transaksi, tombol "Transaksi Baru" | Raihan | 🟢 Done | FR-02, OQ-1 |
| T-14 | Tombol "Batal Transaksi": kosongkan keranjang, hit API cancel | Raihan | 🟢 Done | FR-05 |
| T-15 | Empty state halaman POS (belum ada menu) | Raihan | 🟢 Done | OQ-16 |
| T-16 | Persistensi keranjang ke `localStorage` | Raihan | 🟢 Done | §7 Tech Considerations |

### Design

| # | Task | PIC | Status | Catatan |
|---|------|-----|--------|---------|
| D-01 | Mockup halaman POS: grid menu, filter kategori, search bar | Raihan | 🟢 Done | Mobile-first 360–430px |
| D-02 | Mockup keranjang belanja dan flow pembayaran | Raihan | 🟢 Done | |
| D-03 | Mockup bottom sheet struk digital | Raihan | 🟢 Done | OQ-1 |
| D-04 | Spek tombol greyed-out (warna, ikon, label) untuk menu habis | Raihan | 🟢 Done | FR-04; tap target min 44×44px |

### QA / Testing

| # | Task | PIC | Status | Catatan |
|---|------|-----|--------|---------|
| T-17 | Uji manual Sprint 1 terhadap Acceptance Criteria PRD §10 | Rinda, Ibnu | 🟢 Done | Dilakukan setelah T-07 s/d T-16 selesai |

---

## Acceptance Criteria Sprint 1

| FR | Skenario | Lulus Jika |
|----|----------|------------|
| FR-01 | Kasir tambah 2 menu berbeda | Total = harga A + B, tampil real-time |
| FR-02 | Kasir tekan "Bayar" | Status → `completed`, struk muncul < 3 detik |
| FR-03 | Transaksi "Es Teh Manis" selesai (200ml air, 5g teh, 15g gula) | Stok air −200ml, teh −5g, gula −15g |
| FR-04 | Stok gula = 0 | Semua menu dengan gula tampil abu-abu, tidak bisa ditekan |
| FR-05 | Kasir tekan "Batal" saat keranjang berisi 3 item | Keranjang kosong, stok tidak berubah |

---

## Blocker & Catatan

_(kosong — sprint belum dimulai)_

---

## Log Progres

| Tanggal | Update | Oleh |
|---------|--------|------|
| 20 Jun 2026 | Sprint 1 dibuat, semua task berstatus To Do | Claude Cowork |
| 20 Jun 2026 | PIC diisi sesuai struktur tim (Favian/Janu/Raihan/Rinda/Ibnu); kolom Assignee → PIC; task T-17 QA ditambahkan | Claude Cowork |
| 20 Jun 2026 | Semua task ditandai Done — FR-01 s/d FR-05 sudah selesai via migrasi MVP (MVPSIPIGemini) | Claude Cowork |
