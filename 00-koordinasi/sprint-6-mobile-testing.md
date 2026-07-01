# Sprint 6 — Mobile Testing & PWA Polish

**Sprint Goal:** Verifikasi seluruh fitur SIPI berjalan dengan baik di perangkat mobile nyata (360–430px), memenuhi kriteria PWA installable, dan menutup semua gap UX mobile yang ditemukan selama testing.

**Status Sprint:** 🔵 Berjalan
**Tanggal Mulai:** 28 Juni 2026
**Target Selesai:** —
**Berjalan paralel dengan:** Sprint 5 (LLM Chatbot)

---

## Pembagian Tugas

| # | Task | PIC | Status | Catatan |
|---|------|-----|--------|---------|
| S6-01 | Siapkan environment testing mobile (buka http://[IP-lokal]:3000 di HP) | Favian | ⬜ To Do | Pastikan HP dan laptop di jaringan WiFi yang sama |
| S6-02 | Uji modul POS/Kasir di mobile — semua FR-01–FR-05 | Rinda, Ibnu | ⬜ To Do | Gunakan checklist di bawah |
| S6-03 | Uji modul Inventaris di mobile — semua FR-06–FR-10a | Rinda, Ibnu | ⬜ To Do | Termasuk sub-tab Stok / Restock / Menu & Resep |
| S6-04 | Uji modul Dashboard di mobile — semua FR-11, FR-14–FR-16 | Rinda, Ibnu | ⬜ To Do | Cek summary cards, alert, rekomendasi restock |
| S6-05 | Verifikasi PWA installable — tombol "Tambahkan ke Layar Utama" muncul | Favian | ⬜ To Do | Cek `manifest.json` + Service Worker terdaftar |
| S6-06 | Uji offline mode POS — transaksi saat koneksi mati, sync saat pulih | Rinda, Ibnu | ⬜ To Do | FR offline capability (§6 PRD) |
| S6-07 | Cek tap target semua tombol utama ≥ 44×44px | Raihan | ⬜ To Do | §6 PRD — terutama tombol menu POS & konfirmasi bayar |
| S6-08 | Cek kontras warna & ukuran font minimum 14px body / 16px angka harga | Raihan | ⬜ To Do | §6 PRD — kondisi dapur (cahaya, tangan basah) |
| S6-09 | Cek empty state semua halaman (POS, Inventaris, Dashboard) | Raihan | ⬜ To Do | §6 PRD — saat belum ada data |
| S6-10 | Dokumentasikan bug yang ditemukan di `03-output-review/bug-report-sprint6.md` | Rinda, Ibnu | ⬜ To Do | Format: No \| Halaman \| Langkah repro \| Expected \| Actual |
| S6-11 | Fix bug prioritas tinggi hasil testing | Raihan / Janu | ⬜ To Do | Tergantung temuan S6-10 |
| S6-12 | Retest setelah fix | Rinda, Ibnu | ⬜ To Do | Sign-off final |

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

### PWA & Offline
- [ ] Tombol "Tambahkan ke Layar Utama" / install banner muncul di Android Chrome
- [ ] Setelah install, ikon SIPI muncul di home screen
- [ ] Aplikasi bisa dibuka dari home screen (tanpa browser bar)
- [ ] Halaman POS masih muncul saat WiFi dimatikan
- [ ] Transaksi offline tersimpan dan sync saat WiFi nyala kembali
- [ ] Indikator "Offline" muncul di header saat tidak ada koneksi

---

## Format Bug Report (S6-10)

File: `03-output-review/bug-report-sprint6.md`

| No | Halaman | Perangkat | Langkah Reproduksi | Expected | Actual | Prioritas |
|----|---------|-----------|-------------------|----------|--------|-----------|
| B-01 | | | | | | Tinggi/Sedang/Rendah |

---

## Log Progres

| Tanggal | Update | Oleh |
|---------|--------|------|
| 28 Jun 2026 | Sprint 6 dibuat | Claude Cowork |
