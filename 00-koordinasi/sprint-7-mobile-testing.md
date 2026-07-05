# Sprint 7 — Mobile Testing & PWA Polish

**Sprint Goal:** Verifikasi seluruh fitur SIPI berjalan dengan baik di perangkat mobile nyata (360–430px), memenuhi kriteria PWA installable, dan menutup semua gap UX mobile yang ditemukan selama testing. Sprint ini juga menutup sisa polish & uji manual dari Sprint 5 (chatbot AI).

**Status Sprint:** 🔵 Berjalan
**Tanggal Mulai:** 28 Juni 2026
**Target Selesai:** —
**Catatan urutan:** Sprint ini semula bernomor Sprint 6 (task ID lama: S6-xx). Ditukar jadi Sprint 7 pada 5 Juli 2026 dan diposisikan di akhir alur sprint, karena mobile testing & polish PWA sebaiknya menguji fitur yang sudah stabil — termasuk fitur dari Sprint 5 (Chatbot AI) dan Sprint 6 (Laporan Rentang Tanggal & Export PDF, semula Sprint 7).

---

## Pembagian Tugas

| # | Task | PIC | Status | Catatan |
|---|------|-----|--------|---------|
| S7-00 | Generate dummy data simulasi 6 bulan (transaksi, stok, riwayat harga) agar kondisi data mirip UMKM yang sudah lama berjalan | Favian | 🟢 Done | Dieksekusi via Claude Code/Gemini Antigravity di `repo/backend` sesuai prompt `prompt-queue/2026-07-05_dummy-data-6-bulan-sprint6.md`. (Eks-S6-00) |
| S7-01 | Siapkan environment testing mobile (buka http://[IP-lokal]:3000 di HP) | Favian | ⬜ To Do | Pastikan HP dan laptop di jaringan WiFi yang sama. (Eks-S6-01) |
| S7-02 | Uji modul POS/Kasir di mobile — semua FR-01–FR-05 | Rinda, Ibnu | ⬜ To Do | Gunakan checklist di bawah. (Eks-S6-02) |
| S7-03 | Uji modul Inventaris di mobile — semua FR-06–FR-10a | Rinda, Ibnu | ⬜ To Do | Termasuk sub-tab Stok / Restock / Menu & Resep. (Eks-S6-03) |
| S7-04 | Uji modul Dashboard di mobile — semua FR-11, FR-14–FR-16 | Rinda, Ibnu | ⬜ To Do | Cek summary cards, alert, rekomendasi restock. (Eks-S6-04) |
| S7-05 | Uji bagian Laporan di mobile (Sprint 6) — date range picker, export PDF | Rinda, Ibnu | ⬜ To Do | FR-19–FR-22, tambahan baru karena Sprint 6 (Laporan) sudah selesai |
| S7-06 | Verifikasi PWA installable — tombol "Tambahkan ke Layar Utama" muncul | Favian | ⬜ To Do | Cek `manifest.json` + Service Worker terdaftar. (Eks-S6-05) |
| S7-07 | Uji offline mode POS — transaksi saat koneksi mati, sync saat pulih | Rinda, Ibnu | ⬜ To Do | FR offline capability (§6 PRD). (Eks-S6-06) |
| S7-08 | Cek tap target semua tombol utama ≥ 44×44px | Raihan | ⬜ To Do | §6 PRD — terutama tombol menu POS & konfirmasi bayar. (Eks-S6-07) |
| S7-09 | Cek kontras warna & ukuran font minimum 14px body / 16px angka harga | Raihan | ⬜ To Do | §6 PRD — kondisi dapur (cahaya, tangan basah). (Eks-S6-08) |
| S7-10 | Cek empty state semua halaman (POS, Inventaris, Dashboard, Laporan) | Raihan | ⬜ To Do | §6 PRD — saat belum ada data. (Eks-S6-09) |
| S7-11 | Dokumentasikan bug yang ditemukan di `03-output-review/bug-report-sprint7.md` | Rinda, Ibnu | ⬜ To Do | Format: No \| Halaman \| Langkah repro \| Expected \| Actual. (Eks-S6-10) |
| S7-12 | Fix bug prioritas tinggi hasil testing | Raihan / Janu | ⬜ To Do | Tergantung temuan S7-11. (Eks-S6-11) |
| S7-13 | Retest setelah fix | Rinda, Ibnu | ⬜ To Do | Sign-off final. (Eks-S6-12) |
| S7-14 | Polish chatbot AI: styling bubble/bottom sheet, animasi, aksesibilitas warna, cek feature-flag `ENABLE_AI_CHAT` | Raihan | ⬜ To Do | Dipindah dari Sprint 5 (eks-S5-16), implementasi inti sudah selesai. (Eks-S6-13) |
| S7-15 | Uji manual chatbot AI Sprint 5 terhadap Acceptance Criteria (FR-12, FR-13, FR-17, FR-18) | Rinda, Ibnu | ⬜ To Do | Dipindah dari Sprint 5 (eks-S5-11), setelah S7-14 selesai. (Eks-S6-14) |
| S7-16 | Polish FR-16a: styling grafik tren harga, kontras/font §6, aksesibilitas warna, animasi expand/collapse | Raihan | ⬜ To Do | Dipindah dari Sprint 5 (eks-S5-14). (Eks-S6-15) |
| S7-17 | Uji manual FR-16a (mini-card + grafik tren harga 7 hari) | Rinda, Ibnu | ⬜ To Do | Dipindah dari Sprint 5 (eks-S5-15), setelah S7-16 selesai. (Eks-S6-16) |

---

## Checklist Testing Mobile

### Modul POS / Kasir
- [ ] Grid menu tampil rapi di layar 360px (tidak overflow)
- [ ] Filter kategori dan search bar bisa digunakan dengan jari
- [ ] Tombol menu yang stok habis tampil abu-abu dan tidak bisa ditekan (FR-04)
- [ ] Keranjang bisa di-scroll jika item banyak
- [ ] Flow bayar: pilih metode → konfirmasi → struk muncul (FR-02)
- [ ] Tombol "Batal Transaksi" berfungsi, stok tidak berubah (FR-05)
- [ ] Struk digital terbaca di layar kecil, ada tombol "Transaksi Baru"

### Modul Inventaris
- [ ] Sub-tab Stok / Restock / Menu & Resep bisa di-tap dengan nyaman
- [ ] Label merah "Stok Menipis" terlihat jelas (FR-07)
- [ ] Form restock bisa diisi di keyboard mobile
- [ ] Modal riwayat harga (📈) bisa dibuka dan di-close (FR-08a)
- [ ] Editor resep bisa digunakan di layar kecil (FR-08b)
- [ ] Label "Margin Kritis" dan rekomendasi harga jual muncul (FR-10, FR-10a)

### Modul Dashboard
- [ ] Summary cards (pendapatan, transaksi, laba) terbaca jelas
- [ ] Teks ringkasan otomatis muncul di atas dashboard (FR-14)
- [ ] Daftar menu terlaris tampil (FR-11)
- [ ] Alert kenaikan harga bahan baku muncul jika ada (FR-16)
- [ ] Daftar rekomendasi restock muncul jika stok kritis (FR-15)

### Modul Laporan (Sprint 6)
- [ ] Date range picker custom bisa dipakai di layar kecil
- [ ] Ringkasan agregat rentang tampil jelas (FR-19, FR-20)
- [ ] Tombol Export PDF berfungsi di mobile browser (FR-22)

### PWA & Offline
- [ ] Tombol "Tambahkan ke Layar Utama" / install banner muncul di Android Chrome
- [ ] Setelah install, ikon SIPI muncul di home screen
- [ ] Aplikasi bisa dibuka dari home screen (tanpa browser bar)
- [ ] Halaman POS masih muncul saat WiFi dimatikan
- [ ] Transaksi offline tersimpan dan sync saat WiFi nyala kembali
- [ ] Indikator "Offline" muncul di header saat tidak ada koneksi

---

## Format Bug Report (S7-11)

File: `03-output-review/bug-report-sprint7.md`

| No | Halaman | Perangkat | Langkah Reproduksi | Expected | Actual | Prioritas |
|----|---------|-----------|-------------------|----------|--------|-----------|
| B-01 | | | | | | Tinggi/Sedang/Rendah |

---

## Log Progres

| Tanggal | Update | Oleh |
|---------|--------|------|
| 28 Jun 2026 | Sprint dibuat sebagai "Sprint 6" | Claude Cowork |
| 5 Jul 2026 | Ditambah task dummy data 6 bulan + prompt teknis dibuat untuk Favian (waktu itu S6-00) | Claude Cowork |
| 5 Jul 2026 | Dummy data 6 bulan selesai digenerate (waktu itu S6-00) | Favian |
| 5 Jul 2026 | Sprint 5 (chatbot AI) implementasi inti dikonfirmasi selesai. Task polish & uji manual dipindah ke sini (waktu itu S6-13–S6-16) | Favian |
| 5 Jul 2026 | Ditukar penomoran jadi Sprint 7 (task ID S6-xx → S7-xx) karena Sprint Laporan (semula Sprint 7) sudah selesai duluan dan dijadikan Sprint 6. Ditambah task S7-05 (uji Laporan di mobile). File lama `sprint-6-mobile-testing.md` dihapus, digantikan file ini | Claude Cowork |
