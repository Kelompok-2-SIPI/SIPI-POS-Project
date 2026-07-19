# Laporan Dokumentasi Pengembangan SIPI POS

**Disusun oleh:** Claude Cowork (Dokumentator)
**Tanggal Laporan:** 19 Juli 2026 (revisi setelah pembaruan status Sprint 7, deployment-notes, dan klarifikasi FR-14)
**Versi PRD Acuan:** 4.8
**Sprint Tercakup:** Sprint 1 s.d. Sprint 8 (seluruhnya Selesai)

---

## 1. Ringkasan Eksekutif

SIPI POS (Sistem Informasi POS dan Inventaris Stok F&B) adalah Progressive Web App (PWA) yang dirancang khusus untuk UMKM Food & Beverage, dengan fokus utama penggunaan di smartphone. Sistem ini memecahkan dua masalah inti UMKM skala kecil: ketidaksinkronan pencatatan manual antara laju penjualan dan sisa stok dapur, serta "kebocoran margin" akibat fluktuasi harga bahan baku yang tidak terpantau — diatasi lewat penghitungan Harga Pokok Penjualan (HPP) otomatis dan real-time. Dalam MVP, satu akun (Pemilik) merangkap seluruh peran fungsional (Kasir, Admin Gudang, Owner) tanpa pembatasan akses berbasis peran.

Setelah melalui 8 sprint pengembangan, seluruh 27 functional requirement (FR-01 s.d. FR-27) pada PRD v4.8 telah diimplementasikan dan berstatus Selesai — termasuk FR-16a yang polish visual dan pengujian manualnya baru dituntaskan pada penutupan Sprint 7 (Mobile Testing & PWA Polish) tanggal 19 Juli 2026. Cakupan fitur mencakup modul POS/Kasir, Inventaris & HPP otomatis, Dashboard Owner dengan laporan rentang tanggal dan ekspor PDF, chatbot AI bidirectional (Q&A sekaligus input inventaris via bahasa natural), analitik prediktif (prediksi menu terlaris dan rekomendasi bundling), serta infrastruktur PWA installable yang sudah diverifikasi lulus uji mobile. Sistem sudah di-deploy ke lingkungan production menggunakan Vercel (frontend) dan Railway (backend & database).

---

## 2. Kronologi Pengembangan

| Sprint | Nama & Tujuan | FR / Fitur Dikerjakan | Status | Catatan Penting |
|--------|---------------|------------------------|--------|------------------|
| Sprint 1 | POS / Kasir — Kasir dapat memproses transaksi dari pilih menu hingga struk muncul, stok terpotong otomatis | FR-01, FR-02, FR-03, FR-04, FR-05 | 🟢 Selesai | Diselesaikan via migrasi MVP awal (16–20 Juni 2026). Struk digital dirender sebagai bottom sheet modal, bukan modal tengah layar. |
| Sprint 2 | Inventaris & HPP — Admin Gudang kelola stok, catat harga pasar, sistem hitung ulang HPP otomatis | FR-06, FR-07, FR-08, FR-08a, FR-08b, FR-09, FR-10, FR-10a | 🟢 Selesai | Dibangun di atas arsitektur monolith (Next.js API Routes) sebelum refactor Sprint 4. Ada fitur bonus di luar PRD: Configurable Thresholds (ambang margin kritis & target HPP bisa diubah Owner, disimpan di localStorage). |
| Sprint 3 | Dashboard Owner — ringkasan performa bisnis harian sekilas | FR-11, FR-14, FR-15, FR-16 | 🟢 Selesai | FR-14 sempat berstatus "perlu verifikasi apakah pakai LLM atau template string" — baru dikonfirmasi murni template string (bukan LLM) di Sprint 4 (S4-03). |
| Sprint 4 | Arsitektur & Polish — refactor ke 3 container sesuai PRD v4.2, perbaikan navigasi | Refactor arsitektur monolith → 3 container terpisah (frontend/backend/database), navigasi 4 tab → 3 tab (OQ-7), verifikasi FR-14 | 🟢 Selesai | Perubahan arsitektur signifikan: `sipi_web` monolith (:3080) dipecah jadi `sipi_frontend` (Next.js, :3000), `sipi_backend` (Express + Prisma, :4000), `sipi_database` (PostgreSQL 16, :5432). Halaman `/restock` yang semula tab terpisah digabung jadi sub-tab di dalam `/inventory`. |
| Sprint 5 | AI Chatbot Bidirectional — Owner dapat tanya performa bisnis & lapor belanja via chat natural language | FR-12, FR-13, FR-17, FR-18 (+ FR-16a tambahan v4.5) | 🟢 Selesai (implementasi inti) | Menggunakan Google Gemini Flash (`gemini-1.5-flash`, gratis via AI Studio). Fitur dapat dimatikan via env var `ENABLE_AI_CHAT=false`. Polish styling & uji manual (S5-16, S5-11) sengaja dipindah ke Sprint 7 agar diuji bersamaan dengan mobile testing. |
| Sprint 6 | Laporan Rentang Tanggal & Export PDF — laporan agregat periode custom, terpisah dari ringkasan real-time | FR-19, FR-20, FR-21, FR-22 | 🟢 Selesai | **Perubahan penomoran sprint:** sprint ini semula bernomor "Sprint 7", ditukar jadi Sprint 6 pada 5 Juli 2026 karena selesai lebih dulu dari sprint mobile testing. Tabel baru `menu_hpp_history` ditambahkan sebagai snapshot historis HPP & harga jual, wajib dikerjakan sebelum fitur margin kritis rentang tanggal karena tabel `menus` hanya menyimpan nilai terkini. PDF digenerate di client-side (jsPDF), bukan endpoint backend baru. |
| Sprint 7 | Mobile Testing & PWA Polish — verifikasi seluruh fitur di perangkat mobile nyata, kriteria PWA installable | Pengujian seluruh FR di mobile + PWA installable + polish & uji manual sisa Sprint 5 | 🟢 Selesai (19 Juli 2026) | **Perubahan penomoran sprint:** semula bernomor "Sprint 6", ditukar jadi Sprint 7 agar berada di akhir alur (lebih logis menguji fitur yang sudah stabil, termasuk chatbot AI dan Laporan). Seluruh task S7-00 s.d. S7-17 dikonfirmasi selesai, termasuk pengujian mobile per modul, verifikasi PWA installable, uji offline mode, aksesibilitas (tap target, kontras), bug fix, retest, serta polish akhir chatbot AI dan FR-16a. |
| Sprint 8 | Advanced Insights & Infrastructure Polish — analitik prediktif, perluasan AI, penguatan infrastruktur | FR-23, FR-24, FR-25, FR-26, FR-27 | 🟢 Selesai | Migrasi upload foto menu dari disk lokal ke Cloudinary — diperlukan karena lingkungan production (Railway) menggunakan *ephemeral storage* sehingga file lokal hilang setiap redeploy. Perbaikan bug Service Worker (timing hydration) dan penambahan Halaman Akun dinamis + tombol instalasi PWA. |

---

## 3. Daftar Fitur yang Sudah Diimplementasikan

### Modul POS / Kasir
- Tambah menu ke keranjang dengan perhitungan total otomatis (FR-01)
- Proses transaksi menjadi status Selesai dengan struk digital (bottom sheet modal) (FR-02)
- Pengurangan stok bahan baku otomatis berdasarkan resep (FR-03)
- Tombol menu di-greyed-out saat stok tidak mencukupi (FR-04)
- Pembatalan transaksi aktif tanpa memotong stok (FR-05)

### Modul Inventaris
- Restock bahan baku ke total stok (FR-06)
- Label peringatan visual saat stok ≤ batas minimum (FR-07)
- Formulir pencatatan harga beli harian (FR-08)
- Linimasa riwayat harga pasar dalam modal visual (FR-08a)
- Editor komposisi resep pada tab "Menu & Resep" (FR-08b)
- Daftar rekomendasi restock berbasis rumus deterministik `stock_qty / avg_consumption_7d < 2` (FR-15)

### Modul HPP & Harga
- Perhitungan ulang HPP otomatis saat harga bahan baku berubah (FR-09)
- Label "Margin Kritis" saat HPP melebihi 80% harga jual (FR-10)
- Rekomendasi harga jual baru otomatis, target rasio HPP 50% (FR-10a)
- Snapshot historis HPP & harga jual ke tabel `menu_hpp_history` (FR-21)

### Modul Dashboard & Laporan
- Dashboard harian: pendapatan, transaksi, laba kotor, menu terlaris (FR-11)
- Ringkasan teks otomatis berbasis template string (bukan LLM) (FR-14)
- Notifikasi kenaikan harga bahan baku > 20% dalam 7 hari (FR-16)
- Mini-card & grafik tren harga 7 hari per bahan baku pada kartu alert, termasuk styling, aksesibilitas warna, dan animasi expand/collapse (FR-16a)
- Bagian "Laporan" terpisah dengan pemilihan rentang tanggal custom (FR-19)
- Laporan agregat rentang tanggal: pendapatan, transaksi, laba, top 5 menu, kenaikan harga, margin kritis historis (FR-20)
- Ekspor laporan rentang tanggal sebagai PDF (FR-22)
- Prediksi Menu Terlaris Besok berbasis pola 4 minggu ke belakang (FR-23)
- Rekomendasi Ekspansi Menu (Bundling) berbasis analisis co-occurrence 8 minggu (FR-24)

### Modul AI Assistant
- Chatbot berbasis teks di halaman Dashboard dan Inventaris (FR-12)
- Jawaban LLM berbasis data aktual untuk pertanyaan bisnis natural (FR-13)
- Pelaporan belanja bahan baku via bahasa natural dengan restock otomatis (FR-17)
- Konfirmasi parsing sebelum eksekusi aksi restock/harga (FR-18)
- Perluasan konteks AI: tren laba 6 bulan, prediksi menu, rekomendasi bundling (FR-25)

### Modul Akun & Infrastruktur PWA
- Halaman Akun dengan nama usaha dinamis dan tombol instalasi PWA (FR-26)
- Upload foto menu ke Cloudinary, menggantikan disk lokal, dengan gambar fallback (FR-27)

---

## 4. Keputusan Teknis dan Arsitektur Penting

- **Migrasi arsitektur monolith ke 3 container (Sprint 4):** Sistem awalnya dibangun sebagai monolith Next.js dengan API Routes (2 container: web + database). Sesuai PRD v4.2, arsitektur direfaktor menjadi 3 service terpisah — `frontend` (Next.js, port 3000), `backend` (Express + Prisma, port 4000), `database` (PostgreSQL 16, port 5432) — agar Frontend dan Backend dapat di-*containerize* dan di-*deploy* secara independen.
- **Pilihan PostgreSQL dibanding MongoDB:** relasi Menu ↔ Resep ↔ Bahan Baku membutuhkan *join query* kompleks dan konsistensi ACID, sehingga database relasional dipilih dibanding skema-bebas.
- **Pemisahan Laporan dari Dashboard real-time (Sprint 6):** Bagian "Laporan" dengan rentang tanggal custom dibuat terpisah dari ringkasan Dashboard utama yang tetap menampilkan data hari ini, agar tidak mengubah perilaku Dashboard yang sudah stabil (bersifat aditif).
- **Penambahan tabel `menu_hpp_history`:** dibutuhkan karena tabel `menus` hanya menyimpan nilai HPP dan harga jual terkini; tanpa snapshot historis, laporan margin kritis untuk rentang tanggal lampau akan salah menampilkan kondisi hari ini, bukan kondisi saat itu.
- **Penomoran ulang Sprint 6 dan Sprint 7:** Sprint Laporan (awalnya diberi nomor Sprint 7) ditukar menjadi Sprint 6 karena selesai lebih dulu, sedangkan Sprint Mobile Testing (awalnya Sprint 6) dipindah menjadi Sprint 7 agar berada di akhir alur pengembangan — pertimbangannya, pengujian mobile dan polish PWA sebaiknya dilakukan setelah seluruh fitur (termasuk chatbot AI Sprint 5 dan Laporan Sprint 6) sudah stabil.
- **Pemilihan Google Gemini Flash untuk AI Assistant:** dipilih karena tersedia gratis via Google AI Studio; fitur chatbot dapat dinonaktifkan seluruhnya lewat env var `ENABLE_AI_CHAT=false` tanpa memengaruhi fitur lain, dan data sensitif (password, baris transaksi mentah) sengaja tidak dikirim ke API eksternal.
- **Migrasi upload foto ke Cloudinary (Sprint 8):** dilakukan karena lingkungan production di Railway menggunakan *ephemeral storage* — file yang diupload ke disk lokal akan hilang setiap kali aplikasi di-redeploy. Cloudinary dipilih sebagai cloud storage permanen, disertai gambar fallback default.
- **Ekspor PDF di sisi client:** laporan rentang tanggal (FR-22) digenerate langsung di browser menggunakan jsPDF, bukan endpoint backend baru, untuk menghindari penambahan dependency generation PDF di server tanpa kebutuhan jelas.
- **Deployment production — split arsitektur Vercel & Railway:** Sistem di-deploy dengan arsitektur *split deployment* — frontend (Next.js/PWA) di-hosting pada **Vercel** (auto-deploy dari branch `main`, CDN global, HTTPS wajib untuk registrasi Service Worker), sedangkan backend (Express API) dan database (PostgreSQL) di-hosting pada **Railway** sebagai service terpisah dalam satu project. Konfigurasi CORS backend dibatasi hanya menerima request dari `FRONTEND_URL` (URL Vercel). Keputusan penggunaan Railway untuk backend secara langsung memengaruhi keputusan teknis FR-27 (migrasi upload foto ke Cloudinary) karena Railway menggunakan *ephemeral disk* yang membuat file upload lokal hilang setiap redeploy — foto menu yang diupload sebelum migrasi Cloudinary (Sprint 8) berpotensi tidak lagi tersedia bila disk Railway sudah di-reset. Dokumentasi resmi lengkap tersedia di `01-dokumentasi/deployment-notes.md` (env variables, alur deploy, dan catatan operasional production).

---

## 5. Status Akhir Proyek

| FR | Kebutuhan Singkat | Modul | Sprint | Status |
|----|--------------------|--------|--------|--------|
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
| FR-12 | AI Business Q&A (natural language) | AI | 5 | 🟢 Done |
| FR-13 | AI jawab pertanyaan performa bisnis | AI | 5 | 🟢 Done |
| FR-14 | Ringkasan teks otomatis di atas dashboard (template string) | Dashboard | 3 | 🟢 Done |
| FR-15 | Rekomendasi restock: stok/avg_7d < 2 hari | Dashboard | 3 | 🟢 Done |
| FR-16 | Notifikasi kenaikan harga bahan baku > 20% dalam 7 hari | Dashboard | 3 | 🟢 Done |
| FR-16a | Mini-card + grafik tren harga 7 hari per bahan baku | Dashboard | 5 (tambahan), polish di Sprint 7 | 🟢 Done |
| FR-17 | AI parse laporan belanja → restock + catat harga | AI | 5 | 🟢 Done |
| FR-18 | Konfirmasi parsing sebelum eksekusi aksi | AI | 5 | 🟢 Done |
| FR-19 | Bagian Laporan terpisah + custom date range picker | Dashboard | 6 | 🟢 Done |
| FR-20 | Laporan agregat rentang tanggal | Dashboard | 6 | 🟢 Done |
| FR-21 | Snapshot HPP + harga jual ke `menu_hpp_history` | HPP | 6 | 🟢 Done |
| FR-22 | Export laporan rentang tanggal sebagai PDF | Dashboard | 6 | 🟢 Done |
| FR-23 | Prediksi Menu Terlaris Besok (window 4 minggu) | Dashboard | 8 | 🟢 Done |
| FR-24 | Rekomendasi Ekspansi Menu (Bundling) via co-occurrence | Dashboard | 8 | 🟢 Done |
| FR-25 | Perluas konteks AI: tren laba, prediksi, rekomendasi | AI | 8 | 🟢 Done |
| FR-26 | Halaman Akun Dinamis & Install PWA | Akun | 8 | 🟢 Done |
| FR-27 | Migrasi upload foto menu ke Cloudinary | Arsitektur | 8 | 🟢 Done |

**Ringkasan:** Seluruh 27 FR (FR-01 s.d. FR-27) berstatus Done. FR-16a resmi ditutup pada 19 Juli 2026 setelah task polish (S7-16) dan uji manual (S7-17) di Sprint 7 selesai.

---

## Lampiran: Pemetaan ke Elemen Mata Kuliah

Bagian ini disusun untuk memenuhi permintaan bahwa laporan mencakup empat elemen mata kuliah: Design Thinking, Rekayasa Perangkat Lunak (RPL), Pengembangan Aplikasi Berbasis Web (PABW), dan Pengembangan Sistem Informasi (PSI).

**Design Thinking** tercermin dalam proses penggalian kebutuhan yang mendasari PRD: tahap *Empathize* dan *Define* terlihat dari identifikasi dua masalah inti UMKM F&B pada Bagian 1 (ketidaksinkronan pencatatan stok dan kebocoran margin akibat fluktuasi harga bahan baku) beserta User Stories per peran (Kasir, Admin Gudang, Owner) dalam PRD. Tahap *Ideate* tercermin dari daftar Functional Requirements yang menerjemahkan kebutuhan tersebut menjadi fitur konkret. Tahap *Prototype* tercermin dari mockup desain (task D-01 s.d. D-04 pada Sprint 1) dan Design Considerations di PRD §6 (prinsip mobile-first, aksesibilitas WCAG 2.1 AA, sistem warna semantik untuk alert). Tahap *Test* tercermin dari siklus pengujian manual di setiap sprint dan khususnya Sprint 7 (Mobile Testing & PWA Polish) yang memvalidasi seluruh fitur di perangkat nyata.

**RPL** tercermin pada Bagian 2 (Kronologi Pengembangan) — siklus pengembangan Agile/Scrum berbasis 8 sprint dengan sprint goal, task breakdown, acceptance criteria, dan log progres per sprint, termasuk keputusan re-planning (penukaran penomoran Sprint 6↔7) sebagai contoh adaptasi proses.

**PABW** tercermin pada Bagian 4 (Keputusan Teknis dan Arsitektur) — pemilihan tech stack (Next.js, Express/Prisma, PostgreSQL), arsitektur 3 container, strategi PWA (Service Worker, offline capability, installable), dan deployment production ke Vercel (frontend) dan Railway (backend/database).

**PSI** tercermin pada Bagian 3 dan 5 (Daftar Fitur dan Status Akhir Proyek) — bagaimana sistem mengolah data transaksi dan inventaris mentah menjadi informasi yang mendukung keputusan bisnis pemilik UMKM: Dashboard ringkasan harian, laporan rentang tanggal, prediksi menu, rekomendasi bundling, dan asisten AI berbasis data aktual.

---

## Catatan Inkonsistensi Antar Dokumen (Riwayat — Seluruhnya Sudah Diselesaikan)

Seluruh inkonsistensi yang ditemukan selama penyusunan laporan ini sudah diselesaikan oleh tim per 19 Juli 2026:

1. ~~Deployment Vercel/Railway belum terdokumentasi resmi~~ — **selesai.** Kini terdokumentasi resmi di `01-dokumentasi/deployment-notes.md` (arsitektur split deployment, environment variables, alur deploy, catatan operasional production).
2. ~~`sprint-board.md` belum sinkron dengan status terbaru Sprint 7~~ — **selesai.** `sprint-board.md` kini konsisten dengan `sprint-7-mobile-testing.md` dan `task-assignment.md`, menampilkan Sprint 7 dan seluruh task S7-00–S7-17 berstatus Done, serta FR-16a Done.
3. ~~FR-14 sempat berstatus ambigu~~ di `sprint-3-dashboard.md` ("❓ Perlu dicek apakah pakai template string atau LLM") — **selesai.** Sudah diklarifikasi: dikonfirmasi murni template string (bukan LLM) di Sprint 4 (S4-03), dan `sprint-3-dashboard.md` sudah diperbarui menghilangkan status "perlu cek" tersebut.
