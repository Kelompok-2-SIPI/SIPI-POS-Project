# Sprint 8 — Advanced Insights & Infrastructure Polish

**Sprint Goal:** Menambahkan fitur analitik prediktif (Dashboard Insights), memperluas kapabilitas asisten AI dengan konteks bisnis yang lebih dalam, dan memperkuat infrastruktur (upload Cloudinary, PWA installation). Sprint ini adalah pemolesan lanjutan dari Sprint-sprint sebelumnya.

**Status Sprint:** 🟢 Done
**Tanggal Mulai:** 5 Juli 2026
**Target Selesai:** 5 Juli 2026

---

## Pembagian Tugas

| # | Task | PIC | Status | Catatan |
|---|------|-----|--------|---------|
| S8-01 | Prediksi Menu Terlaris Besok (window 4 minggu) di Dashboard | Janu, Favian | 🟢 Done | FR-23 |
| S8-02 | Rekomendasi Ekspansi Menu (Bundling) via co-occurrence (8 minggu) | Janu, Favian | 🟢 Done | FR-24 |
| S8-03 | Tombol "Atur Resep" di card Bundling pre-fill form Menu Baru | Raihan | 🟢 Done | FR-24a |
| S8-04 | Perluas konteks AI: Tren laba 6 bulan, prediksi, rekomendasi bundling | Janu | 🟢 Done | FR-25 |
| S8-05 | Perbaiki prompt AI (nama hari eksplisit) & hapus template lama | Janu | 🟢 Done | - |
| S8-06 | Halaman Akun Dinamis (nama usaha) & Tombol Install PWA | Favian | 🟢 Done | FR-26 |
| S8-07 | Fix bug Service Worker (SW tidak ter-register karena timing hydration) | Favian | 🟢 Done | - |
| S8-08 | Migrasi upload foto menu ke Cloudinary dari disk lokal (Railway support) | Janu | 🟢 Done | FR-27 |

---

## Catatan Implementasi

- **Dashboard Insights:** Analisis *co-occurrence* memeriksa pasangan menu yang dibeli bersamaan. Harga rekomendasi bundling tidak boleh lebih kecil dari HPP gabungan untuk menghindari "kebocoran margin" baru.
- **AI Chatbot:** AI tidak lagi disuruh menebak hari (karena sering halusinasi). Sekarang, nama hari dieksplisitkan langsung di prompt sistem.
- **Cloudinary:** Diperlukan karena lingkungan production (Railway) menggunakan ephemeral disk, sehingga foto yang diupload ke lokal akan hilang setiap kali redeploy.

---

## Log Progres

| Tanggal | Update | Oleh |
|---------|--------|------|
| 10 Jul 2026 | Sprint dibuat dan langsung ditandai selesai berdasarkan riwayat commit terbaru | Claude Cowork |
