# Governance Notes — SIPI POS

**Catatan keputusan, kebijakan, dan eskalasi proyek.**

---

## Keputusan Aktif (dari PRD v4.2)

| ID | Keputusan | Sumber |
|----|-----------|--------|
| OQ-1 | Struk digital tidak auto-dismiss — Kasir tekan "Transaksi Baru" secara manual | PRD §14 |
| OQ-2 | Batas stok minimal (`min_stock_qty`) bisa diatur oleh Admin Gudang dan Owner | PRD §14 |
| OQ-3 | Dashboard MVP hanya tampilkan data **hari ini** — filter minggu/bulan pasca-MVP | PRD §14 |
| OQ-4 | Harga jual menu bisa diubah langsung dari sistem oleh Owner/Admin | PRD §14 |
| OQ-5 | AI Assistant (FR-12, FR-13) **tidak aktif di MVP** | PRD §14 |
| OQ-6 | MVP pakai **1 akun hardcoded** — semua modul bisa diakses dari 1 login | PRD §14 |
| OQ-7 | Navigasi: **3 tab** (POS, Inventaris, Dashboard). Inventaris punya 3 sub-tab: Stok / Restock / Menu & Resep | PRD §14 v4.1 |
| OQ-8 | Keranjang: tombol `+` dan `−` per item. Qty minimum 1, hapus pakai tombol hapus | PRD §14 |
| OQ-9 | POS: grid menu + filter kategori + search bar di atas | PRD §14 |
| OQ-10 | Metode pembayaran: Tunai / Non-tunai dicatat manual oleh Kasir | PRD §14 |
| OQ-11 | Riwayat harga pasar diakses lewat ikon 📈 → modal linimasa | PRD §14 |
| OQ-12 | Editor resep: sub-tab "Menu & Resep" di dalam tab Inventaris | PRD §14 v4.1 |
| OQ-13 | Rekomendasi harga jual baru: target HPP 50%, bulatkan ke Rp1.000 terdekat | PRD §14 |
| OQ-14 | Sistem warna alert: Merah = Stok Kritis, Oranye = Margin Kritis, Biru = Info Harga | PRD §14 v4.1 |
| OQ-15 | Indikator offline: badge "Offline" di header POS + ikon "Menunggu Sinkron" pada struk | PRD §14 v4.1 |
| OQ-16 | Empty state wajib ada di semua halaman dengan daftar data | PRD §14 v4.1 |
| OQ-17 | Dashboard: summary cards (bukan tabel angka) + ranking menu terlaris | PRD §14 v4.1 |
| OQ-18 | Font minimum 14px body / 16px harga. Tema kontras tinggi | PRD §14 v4.1 |

---

## Perubahan Scope yang Perlu Konfirmasi Owner

_(kosong — belum ada usulan perubahan)_

---

## Log Keputusan Baru (dibuat selama proyek berjalan)

| Tanggal | Keputusan | Diusulkan oleh | Status |
|---------|-----------|----------------|--------|
| 20 Jun 2026 | Inisialisasi dokumen governance | Claude Cowork | ✅ Final |
| 4 Jul 2026 | FR-16a (mini-card + grafik tren harga 7 hari): prompt versi core disimpan di luar folder project (chat Cowork), tidak sebagai file di `repo/` atau `00-koordinasi/` | Favian | ✅ Final |
| 5 Jul 2026 | Permintaan dummy data simulasi 6 bulan (Sprint 6) dibuatkan sebagai prompt CTCO di `prompt-queue/`, bukan dieksekusi langsung oleh Claude Cowork (sesuai batasan tidak menyentuh `repo/`) — dijalankan Favian sendiri via Claude Code/Gemini Antigravity, selesai 5 Jul 2026 | Favian | ✅ Final |
| 5 Jul 2026 | Sprint 5 (chatbot AI) ditutup sebagai implementasi inti selesai (FR-12, FR-13, FR-17, FR-18). Task polish styling & uji manual (eks-S5-16, S5-11, S5-14, S5-15) digabung ke sprint mobile testing, karena secara alur kerja lebih efisien dipolish & diuji bersamaan dengan mobile testing | Favian | ✅ Final |
| 5 Jul 2026 | Sprint Laporan Rentang Tanggal & Export PDF (FR-19–FR-22) dikonfirmasi selesai 100% termasuk testing manual (eks-S7-07, S7-12) | Favian | ✅ Final |
| 5 Jul 2026 | Penomoran Sprint 6 ↔ Sprint 7 ditukar: Sprint Laporan (semula Sprint 7) jadi **Sprint 6** karena sudah selesai duluan; Sprint Mobile Testing & PWA Polish (semula Sprint 6) jadi **Sprint 7** dan diposisikan di akhir alur, karena mobile testing & polish PWA sebaiknya menguji fitur yang sudah stabil (termasuk Sprint 5 chatbot AI & Sprint 6 Laporan). Seluruh task ID direnumber total (S6-xx↔S7-xx) di `sprint-board.md`, `task-assignment.md`, dan file detail. File lama `sprint-6-mobile-testing.md` & `sprint-7-laporan-export.md` dihapus, digantikan `sprint-6-laporan-export.md` & `sprint-7-mobile-testing.md` | Favian | ✅ Final |

---

## Eskalasi Aktif

_(kosong)_
