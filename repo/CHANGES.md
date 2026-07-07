# Ringkasan Perubahan — Branch `redesign/uiux-stitch-janu`

**Base branch:** `main`
**Commit di branch ini:** 33 commit sejak diverge dari `main`
**Untuk reviewer:** dokumen ini merangkum SEMUA perbedaan branch ini vs `main` — baik redesign UI/UX, fitur backend baru, maupun perbaikan bug — supaya bisa direview tanpa harus membaca 33 commit satu-satu. Detail teknis tahap-per-tahap redesign UI/UX (dengan commit hash per tahap) sudah ada duluan di [`03-output-review/redesign-uiux-progress.md`](../03-output-review/redesign-uiux-progress.md); dokumen ini melengkapinya dengan pekerjaan sesudahnya (analitik dashboard baru, perluasan AI chatbot, rombak data dummy, cleanup navigasi) plus rangkuman level-tinggi untuk reviewer yang tidak familiar detail per tahap.

> Dibuat via `git log`/`git diff origin/main..HEAD` yang dijalankan langsung — bukan dari ingatan percakapan sebelumnya, supaya akurat.

> **📌 Update pasca-merge (2026-07-07):** Branch `redesign/uiux-stitch-janu` sudah di-*review* dan **di-merge ke `main` lewat PR #2** (merge commit `958b32f`, disetujui reviewer `FiveUII`/Favian). Sejak titik itu, pengembangan berlanjut **langsung di `main`** — repo ini sekarang berada di branch `main`, bukan lagi branch redesign terpisah. Bagian 1–8 di bawah tetap dibiarkan sebagai snapshot isi PR #2 apa adanya (tidak ditulis ulang retroaktif). Perubahan **setelah** merge itu didokumentasikan terpisah di **bagian 9**, dengan base perbandingan `958b32f..HEAD` — bukan lagi `main..redesign/uiux-stitch-janu`.

---

## 1. Ringkasan Tingkat Tinggi

Branch ini punya dua gelombang pekerjaan:

1. **Redesign UI/UX total** ("SIPI Modern Merchant") — ganti tema visual dari "Premium Warm Bistro" (oranye/cream) ke tema cobalt biru, redesign semua halaman (Login, POS, Inventaris, Dashboard), tambah shell navigasi desktop (sidebar 280px, sebelumnya cuma ada bottom nav mobile), dan fitur upload gambar menu. **Tidak ada logic bisnis, endpoint API, atau skema database yang diubah** di gelombang ini — murni presentasional kecuali penambahan aditif (upload gambar).
2. **Fitur analitik & AI baru + data demo realistis** — dashboard dapat 3 insight baru (tren 6 bulan, pola pengunjung mingguan, jam tersibuk) plus **1 baris insight/rekomendasi teks dinamis di bawah tiap chart** (bukan cuma angka mentah — kasih tahu Owner "jadi aku harus ngapain"), AI chatbot diperluas supaya bisa menjawab pertanyaan soal data historis itu DAN mengatur resep menu lewat percakapan (bukan cuma restock seperti sebelumnya) DAN sekarang **merender balasannya sebagai Markdown asli** (bold/list, bukan teks mentah dengan tanda bintang), serta data dummy database di-generate ulang total jadi simulasi 6 bulan yang realistis (bukan random flat) untuk keperluan demo.

---

## 2. Fitur Baru (ringkasan fungsional)

### 2.1 Redesign UI/UX "SIPI Modern Merchant"
Redesign visual menyeluruh: warna, tipografi, semua halaman (Login/POS/Inventaris/Dashboard), plus **shell navigasi baru** — sidebar tetap 280px untuk layar desktop (sebelumnya cuma bottom nav mobile 3-tab), dan **upload foto menu asli** (sebelumnya semua menu pakai placeholder ikon garpu-pisau, sekarang Owner bisa upload foto lewat form Tambah/Edit Menu dan foto itu muncul konsisten di grid POS, Menu/Resep, dan Menu Terlaris di Dashboard).
Detail tahap-per-tahap: lihat [`03-output-review/redesign-uiux-progress.md`](../03-output-review/redesign-uiux-progress.md).

### 2.2 Dashboard — 3 Insight Baru untuk Owner
- **Tren Penjualan Bulanan** — grafik batang pendapatan 6 bulan terakhir, bulan tertinggi di-highlight, biar Owner bisa lihat tren musiman/pertumbuhan.
- **Pola Pengunjung Mingguan** — rata-rata transaksi per hari (Senin–Minggu) dari 4 minggu terakhir, hari paling ramai di-highlight. Tujuannya: Owner bisa siapkan karyawan/bahan baku lebih banyak di hari yang biasanya ramai.
- **Jam Tersibuk** — jumlah transaksi per jam operasional (bukan 24 jam penuh — jam yang warungnya jelas tutup otomatis dipangkas dari grafik biar tidak boros ruang), jam tersibuk di-highlight.

Ketiganya proxy pakai jumlah transaksi selesai (belum ada pencatatan "pengunjung" sungguhan di sistem), dan dikonversi ke waktu lokal Asia/Jakarta dengan benar sebelum dikelompokkan (lihat bug timezone di bagian 4).

**Endpoint backend baru** (belum ada dokumentasi resmi di PRD §9, perlu ditambahkan kalau mau diformalkan):
- `GET /api/v1/dashboard/monthly-sales?months=N`
- `GET /api/v1/dashboard/visit-pattern-by-day`
- `GET /api/v1/dashboard/visit-pattern-by-hour`

### 2.3 AI Chatbot — Konteks Lebih Luas + Kemampuan Baru
Sebelumnya chatbot cuma tahu data HARI INI (pendapatan, stok, margin kritis), jadi kalau ditanya soal tren 6 bulan atau pola pengunjung, dia jawab "tidak punya data itu" padahal datanya sudah ada di sistem. Sekarang:
- **Konteks diperluas** — system prompt AI sekarang juga menyertakan ringkasan tren penjualan 6 bulan, pola pengunjung mingguan, dan jam tersibuk (reuse endpoint yang sama seperti di atas, lewat modul backend bersama `dashboard-insights.ts`, bukan query terpisah).
- **Kemampuan baru: atur resep menu via chat** — sebelumnya AI cuma bisa memproses laporan belanja/restock (FR-17/18). Sekarang Owner juga bisa bilang misalnya *"set resep Ayam Geprek Dada: 1 potong ayam dada, 50 gram tepung terigu, 20 gram cabai rawit"*, dan bot akan:
  1. Mencocokkan nama menu & bahan baku ke data yang benar-benar ada di database (exact match dulu, baru pencocokan sebagian dua arah) — **kalau tidak ketemu atau ambigu, bot minta klarifikasi, tidak pernah menebak atau membuat entry baru sendiri**.
  2. Menampilkan konfirmasi yang jelas: resep LAMA vs resep BARU, dengan kata "MENGGANTI" (bukan menambah) karena ini mengganti seluruh resep, bukan cuma nambah stok.
  3. Setelah Owner setuju, resep di-replace lewat endpoint `PUT /menus/:id/recipe` yang sudah ada, lalu HPP menu dihitung ulang otomatis (reuse `recalculateMenuHpp`, logic yang sama dipakai FR-09).

### 2.4 Data Dummy — Simulasi Realistis 6 Bulan
Data dummy sebelumnya random flat (jumlah transaksi rata-rata sepanjang waktu, tidak ada pola). Sekarang di-generate ulang total jadi simulasi bisnis UMKM fiktif "Ayam Geprek Bu Yuli" di Jogja, periode **1 Jan – 8 Juli 2026** (tanggal fixed, bukan relatif ke waktu run script):
- Kurva pertumbuhan organik (sepi di bulan pertama buka, makin ramai seiring waktu).
- Pola mingguan (akhir pekan lebih ramai) dan pola jam (puncak makan siang & malam) yang konsisten dengan insight baru di 2.2.
- Efek Ramadan/Lebaran 2026 (19 Feb – 20 Mar, tanggal diverifikasi dari sumber resmi Kemenag): transaksi siang turun drastis, lonjakan jelang buka puasa, lonjakan jelang Lebaran, lalu tutup total 3 hari saat libur Lebaran.
- Fluktuasi harga bahan baku realistis (cabai rawit paling volatil dengan lonjakan besar jelang Lebaran, ayam & minyak fluktuasi kecil-menengah, bahan lain stabil).
- Skenario margin kritis (2 menu dengan margin tertipis melewati ambang batas persis saat lonjakan harga, lalu Owner "menaikkan harga" ~3 minggu kemudian — data ini yang bikin fitur Margin Kritis Historis punya contoh nyata untuk didemokan).
- Skenario stok kritis (bahan baku sengaja dibuat hampir habis di momen tertentu, termasuk menjelang tanggal presentasi, supaya fitur rekomendasi restok punya data untuk ditunjukkan).

File yang terdampak: `backend/prisma/seed.ts` (menu & bahan baku dasar diganti total sesuai konsep Ayam Geprek Bu Yuli) dan `backend/prisma/seed-dummy.ts` (simulasi historis ditulis ulang total).

### 2.5 Insight/Rekomendasi Dinamis di Tiap Chart Dashboard
Owner yang awam data harus bisa langsung paham "jadi aku harus ngapain" tanpa perlu menafsirkan grafik sendiri. Sekarang tiap chart di Dashboard punya 1 baris insight/rekomendasi teks di bawahnya, 100% dinamis (reuse nilai yang sudah dihitung komponen masing-masing, bukan teks statis):
- **Tren Penjualan Bulanan** — bandingkan bulan terbaru vs sebelumnya, sebut juga bulan mana yang tertinggi.
- **Pola Pengunjung Mingguan** — reuse `busiestDay` yang sudah ada: *"[Hari] paling ramai (rata-rata N transaksi) — siapkan karyawan & stok bahan baku ekstra di hari ini."*
- **Jam Tersibuk** — reuse `busiestHour`: *"Jam [X] paling sibuk — pastikan bahan sudah disiapkan dan karyawan standby sebelum jam ini."*
- **Kenaikan Harga Bahan Baku** — sebut bahan baku dengan `increasePercent` tertinggi, dorong aksi cepat sebelum margin makin tergerus.

**Fix penting pada insight Tren Penjualan Bulanan — hindari perbandingan menyesatkan:** perbandingan naif "bulan ini vs bulan lalu" memakai TOTAL mentah akan selalu kelihatan "anjlok drastis" kalau bulan berjalan belum genap sebulan (misal baru tanggal 7, dibandingkan ke bulan lalu yang sudah penuh 30 hari) — padahal itu cuma karena datanya belum lengkap, bukan indikasi bisnis memburuk. Diperbaiki dengan mendeteksi apakah bulan terakhir di data adalah bulan yang SEDANG BERJALAN (cocokkan `month` dengan bulan-tahun hari ini):
- Kalau sudah berjalan **≤3 hari** — insight netral tanpa klaim naik/turun sama sekali (belum cukup data bahkan buat rata-rata harian sekalipun): *"[Bulan] baru berjalan N hari, terlalu dini untuk dibandingkan — pantau terus di sini."*
- Kalau **>3 hari** — bandingkan **rata-rata pendapatan PER HARI** (total bulan berjalan ÷ hari yang sudah lewat) vs rata-rata harian bulan sebelumnya (total ÷ jumlah hari penuh di bulan itu) — apple-to-apple, bukan total vs total.
- Kalau bulan terakhir di data **sudah genap sebulan penuh**, perbandingan total mentah seperti biasa tetap dipakai (tidak perlu disesuaikan).

File yang terdampak: `frontend/src/app/dashboard/page.tsx` (fungsi `buildMonthlySalesInsight`, `buildWeeklyPatternInsight`, `buildHourlyPatternInsight`, `buildPriceAlertInsight`, komponen `InsightNote`).

### 2.6 Markdown Rendering di Balasan AI Chatbot
Gemini API sering mengembalikan jawaban berformat Markdown (`**bold**`, list bernomor/bullet), tapi sebelumnya `AiChatWidget` merender `{msg.text}` mentah — tanda bintang dan simbol list muncul apa adanya, bukan diformat. Sekarang balasan dengan `role === 'ai'` dirender lewat **`react-markdown`** (v10.1.0, dependency baru — lihat bagian 5), sedangkan pesan user & system tetap teks polos seperti semula (tidak perlu markdown, dan menghindari efek samping kalau user kebetulan mengetik karakter `*`/`#`).

**Kenapa `react-markdown`, bukan `marked`+`dangerouslySetInnerHTML`:** react-markdown mem-parsing Markdown lalu merender langsung ke elemen React (`createElement`), bukan ke string HTML yang perlu di-`dangerouslySetInnerHTML`. Karena itu **aman dari XSS by default** — teks HTML mentah di dalam respons AI (misal ada yang menyerupai tag) hanya diperlakukan sebagai teks biasa, tidak pernah diparse jadi elemen sungguhan, kecuali sengaja diaktifkan lewat plugin `rehype-raw` (yang **tidak** dipasang di sini). Ini menghindari seluruh kelas bug sanitasi HTML yang biasa jadi sumber celah XSS kalau pakai pendekatan render-HTML-string.

Styling disesuaikan lewat class `.ai-markdown` (heading di-cap ke ukuran teks normal + bold, bukan H1/H2 raksasa bawaan browser yang tidak proporsional untuk bubble chat kecil; warna & ukuran font `inherit` dari bubble AI yang sudah ada, bukan warna/ukuran baru).

File yang terdampak: `frontend/src/components/AiChatWidget.tsx`, `frontend/package.json`, `frontend/package-lock.json`.

**Keterbatasan yang disadari:** tidak memasang plugin `remark-gfm`, jadi kalau suatu saat Gemini merespons dengan tabel Markdown (fitur GFM, bukan CommonMark dasar), tabel itu belum akan dirender sebagai tabel asli — cuma teks biasa. Belum ditemukan jadi masalah nyata di pengujian (respons yang diuji selalu list/paragraf/bold), dicatat untuk referensi kalau nanti dibutuhkan.

---

### 2.7 Backend Hardening (Auth Middleware, Race Condition Stok, Konflik Sync Offline, JWT Fail-Fast)

Empat perbaikan keamanan/konsistensi data di backend, belum pernah didokumentasikan di file ini sebelumnya walau sudah ada di diff branch:

- **Auth middleware aktif di 4 router** (`transactions`, `ingredients`, `menus`, `dashboard`) lewat `router.use(authenticate)` — sebelumnya endpoint-endpoint ini bisa diakses tanpa token sama sekali. Diverifikasi ulang: request tanpa token / dengan token rusak sama-sama ditolak `401`, request dengan token valid tetap berjalan normal di ketiga alur inti (checkout POS, restock, dashboard summary).
- **Race condition stok saat checkout** (`backend/src/lib/transaction-helpers.ts`) — pola lama baca stok dulu (`findUnique`) lalu tulis belakangan (`update`) rentan *lost update* kalau 2 transaksi menghabiskan bahan baku yang sama nyaris bersamaan. Diganti jadi atomik: `updateMany` dengan guard `stockQty: { gte: qtyToDeduct }` di `WHERE` + `decrement` di `DATA`, sehingga cek-lalu-kurangi dijamin satu statement oleh row lock Postgres, bukan oleh aplikasi.
- **Konflik stok saat sinkronisasi transaksi offline** (`POST /transactions/sync`) — pola atomik yang sama diterapkan di sini. Kalau stok ternyata tidak cukup saat baru disinkronkan (device offline lama, stok sudah kepakai transaksi lain), transaksi TETAP dicatat (uang sudah diterima Kasir saat itu, tidak boleh hilang) tapi stok di-floor ke 0 (bukan dipaksa negatif diam-diam) dan dicatat sebagai `StockMovement` beranotasi `⚠️ KONFLIK SYNC OFFLINE ... PERLU REVIEW MANUAL OWNER`, lalu di-flag balik ke response (`hasConflicts`/`conflictedCount`/`conflicts`).
- **`JWT_SECRET` fail-fast** (`backend/src/lib/env.ts`, baru) — sebelumnya kalau env var ini kosong/lupa di-set, aplikasi tetap jalan (potensi pakai fallback yang bisa ditebak). Sekarang `requireEnv()` memaksa `process.exit(1)` saat startup dengan pesan `[FATAL]` yang jelas kalau env var wajib ini tidak ada.
- **Frontend: banner konflik sync offline** (`frontend/src/components/PwaRegister.tsx`) — sebelumnya response `hasConflicts` dari `/transactions/sync` di atas **tidak ditampilkan sama sekali** ke Owner (frontend cuma peduli `syncedCount` untuk pesan sukses biasa yang auto-dismiss 4 detik). Sekarang kalau `hasConflicts` true, muncul modal bottom-sheet terpisah (reuse pola visual `.bottom-sheet-backdrop`/`.bottom-sheet` yang sama dengan struk digital POS, warna `--color-danger`/ikon ⚠️ sama seperti badge "Stok Kritis" di Inventaris) yang mendaftar bahan baku apa saja yang terdampak beserta jumlah kekurangannya, dan **tidak auto-dismiss** — cuma bisa ditutup lewat tombol eksplisit "Mengerti, saya akan cek stok", supaya tidak gampang terlewat begitu saja seperti banner sukses biasa. Diverifikasi dengan simulasi nyata (bukan cuma baca kode): set stok bahan baku jadi lebih kecil dari kebutuhan, inject transaksi offline via `localStorage`, reload — modal muncul dengan data yang benar (nama bahan, jumlah kurang, jumlah transaksi terdampak), lalu data simulasi dibersihkan lagi dari database.

File yang terdampak: `backend/src/lib/transaction-helpers.ts`, `backend/src/lib/env.ts` (baru), `backend/src/middleware/auth.ts`, `backend/src/routes/{auth,dashboard,ingredients,menus,transactions}.ts`, `backend/.env.example`, `frontend/src/components/PwaRegister.tsx`.

---

## 3. Perubahan Signifikan (masalah → solusi → file)

| # | Masalah/Kebutuhan | Perubahan | File Terdampak |
|---|---|---|---|
| 1 | Chatbot tidak bisa jawab pertanyaan soal data historis (6 bulan, mingguan, jam) | Extract 3 fungsi query dashboard jadi modul bersama, dipakai baik oleh route dashboard maupun system prompt AI | `backend/src/lib/dashboard-insights.ts` (baru), `backend/src/routes/dashboard.ts`, `backend/src/controllers/aiController.ts` |
| 2 | AI cuma bisa restock, belum bisa atur resep menu (FR-17/18 extension) | Tambah intent baru `action_type: "recipe"`, validasi nama menu/bahan sebelum konfirmasi (beda dari restock yang divalidasi setelah "Ya" — karena resep berdampak ke SEMUA transaksi ke depan, bukan cuma nambah stok) | `backend/src/controllers/aiController.ts` |
| 3 | Data dummy random flat, tidak representatif untuk demo | Rombak total jadi simulasi 6 bulan dengan growth curve, efek Ramadan/Lebaran, margin & stok kritis terjadwal | `backend/prisma/seed.ts`, `backend/prisma/seed-dummy.ts` |
| 4 | Chart baru (Pola Pengunjung Mingguan, Jam Tersibuk) ukurannya tidak konsisten dengan chart lain | Reuse className `monthly-sales-chart` yang sudah ada + samakan viewBox (500×240) supaya `aspect-ratio` CSS match persis | `frontend/src/app/dashboard/page.tsx` |
| 5 | Item nav "Lainnya" (`href="#"`) dead link, akan kelihatan aneh saat demo | Hapus dari Sidebar & BottomNav, sesuaikan grid bottom-nav dari `repeat(4,1fr)` → `repeat(3,1fr)` + `max-width` diperkecil proporsional supaya tidak nyisa gap kosong | `frontend/src/components/Sidebar.tsx`, `frontend/src/components/BottomNav.tsx`, `frontend/src/app/globals.css` |
| 6 | Foto menu asli tidak muncul di Dashboard "Menu Terlaris" padahal sudah tampil di POS/Menu-Resep | Endpoint `/dashboard/top-menus` ternyata tidak pernah join ke tabel `Menu`, cuma agregasi `TransactionItem` | `backend/src/routes/dashboard.ts` |
| 7 | Card "Kenaikan Harga Bahan Baku" tidak ada rekomendasi harga baru (padahal Margin Kritis sudah punya) | `/price-alerts` kirim `sellingPrice`, frontend hitung rekomendasi pakai rumus yang sama dengan Margin Kritis | `backend/src/routes/dashboard.ts`, `frontend/src/app/dashboard/page.tsx` |
| 8 | Belum ada cara lihat tren penjualan bulanan | Endpoint `monthly-sales` baru + `MonthlySalesChart` (bar chart SVG custom) | `backend/src/routes/dashboard.ts`, `frontend/src/app/dashboard/page.tsx` |
| 9 | Owner belum bisa upload foto menu asli | `multer` disk storage di backend, form upload + preview di frontend | `backend/src/routes/menus.ts`, `backend/src/index.ts`, `frontend/src/app/inventory/page.tsx`, `frontend/src/lib/api.ts` |
| 10 | Ikon PWA hilang/salah nama, `manifest.json` 404 | Rename file (`git mv`) kembali ke nama persis yang direferensikan manifest | `frontend/public/icons/icon-192x192.png`, `icon-512x512.png` |
| 11 | Service worker precache `/restock` (route sudah dihapus) bikin `install` SW berpotensi gagal total | Hapus `/restock` dari `ASSETS_TO_CACHE` | `frontend/public/sw.js` |
| 12 | `backend/Dockerfile` selalu mode dev (`tsx watch`), tidak siap production | Ubah jadi multi-stage (`dev`/`build`/`production`), `docker-compose.yml` dipin ke `target: dev` supaya dev workflow tidak berubah | `backend/Dockerfile`, `docker-compose.yml` |
| 13 | Owner awam data susah menafsirkan chart sendiri, tidak tahu "harus ngapain" | Tambah 1 baris insight/rekomendasi dinamis di bawah tiap chart (reuse nilai yang sudah dihitung: bulan/hari/jam tertinggi, bahan naik paling tajam) | `frontend/src/app/dashboard/page.tsx` |
| 14 | Perbandingan "bulan ini vs bulan lalu" menyesatkan kalau bulan berjalan belum genap (total mentah pasti kelihatan anjlok) | Deteksi bulan yang sedang berjalan, bandingkan rata-rata pendapatan PER HARI (bukan total mentah), fallback netral tanpa klaim kalau baru ≤3 hari | `frontend/src/app/dashboard/page.tsx` |
| 15 | Balasan AI chatbot tampil sebagai teks mentah (`**bold**` literal, bukan tebal; list tidak terformat) | Render balasan AI (khusus `role === 'ai'`) lewat `react-markdown`; pesan user/system tetap teks polos | `frontend/src/components/AiChatWidget.tsx`, `frontend/package.json` |
| 16 | Endpoint transaksi/inventaris/dashboard bisa diakses tanpa auth sama sekali | `router.use(authenticate)` di 4 router utama | `backend/src/middleware/auth.ts`, `backend/src/routes/{dashboard,ingredients,menus,transactions}.ts` |
| 17 | Race condition stok: 2 transaksi bersamaan bisa habiskan bahan baku yang sama lewat batas (read-then-write) | Ganti jadi atomik `updateMany` dengan guard `stockQty >= qtyToDeduct` di `WHERE` + `decrement` | `backend/src/lib/transaction-helpers.ts` |
| 18 | Sinkronisasi transaksi offline bisa bikin stok negatif diam-diam kalau bahan sudah kepakai transaksi lain selagi offline | Floor ke 0 (bukan negatif), catat `StockMovement` beranotasi konflik, flag balik ke response (`hasConflicts`) — TAPI sebelum perbaikan ini, frontend tidak menampilkan flag itu ke Owner sama sekali | `backend/src/routes/transactions.ts`, `frontend/src/components/PwaRegister.tsx` (banner baru, lihat 2.7) |
| 19 | `JWT_SECRET` kosong/lupa di-set tidak menghentikan aplikasi (potensi fallback tidak aman) | `requireEnv()` fail-fast (`process.exit(1)`) saat startup kalau env var wajib kosong | `backend/src/lib/env.ts` (baru), `backend/src/routes/auth.ts`, `backend/src/middleware/auth.ts` |

Untuk perubahan redesign visual murni (Login, POS, Inventaris, shell navigasi, dashboard styling) — lihat tabel tahapan lengkap di [`03-output-review/redesign-uiux-progress.md`](../03-output-review/redesign-uiux-progress.md#ringkasan-tahapan).

---

## 4. Bug yang Ditemukan & Diperbaiki Selama Proses

Penting buat reviewer supaya paham konteks kenapa beberapa perubahan "kecil" ada:

1. **Bug timezone di data seed** — `seed-dummy.ts` versi lama membuat timestamp transaksi pakai `setHours()` yang berjalan di timezone container (UTC), bukan Asia/Jakarta. Efeknya: jam transaksi yang seharusnya "makan siang 11-14" dan "makan malam 17-21" WIB malah tersimpan sebagai UTC 11-14/17-21, yang kalau dibaca ulang di frontend (dikonversi +7 ke WIB) jadi terlihat jam 18-21 dan 00-04 — pola yang sama sekali tidak masuk akal untuk warung makan. Diperbaiki dengan membangun timestamp lewat `Date.UTC(y, m, d, jamLokal - 7, ...)` secara eksplisit, tidak lagi bergantung timezone proses Node.
2. **Inline style menimpa CSS class** (ditemukan 2 kali, pola berulang) — pertama di `SimpleLineChart` (sisa inline `style={{ maxWidth: '100%' }}` yang selalu menang atas rule `max-width` di CSS manapun), kedua di dua chart baru (Pola Pengunjung Mingguan, Jam Tersibuk) yang wrapper div-nya **tidak diberi className sama sekali** jadi tidak kena rule `max-width` apa pun dan melebar penuh mengikuti lebar card. Keduanya diperbaiki dengan memastikan className CSS yang benar dipakai, tanpa inline style yang menimpa.
3. **Dev server (Turbopack) CSS stale** — perubahan `globals.css` (rule `aspect-ratio`) sempat tidak ter-compile ulang ke bundle yang diserve ke browser, butuh restart container penuh untuk memastikan CSS baru benar-benar berlaku, bukan cuma cek source file.
4. **Endpoint agregasi tidak join ke tabel Menu** — `/dashboard/top-menus` melewatkan `imageUrl` karena cuma agregasi `TransactionItem`, tidak pernah `include`/`select` relasi `Menu`.
5. **`themeColor`/`viewport` Next.js salah tempat** — di `layout.tsx`, meta tag `theme-color` tidak pernah benar-benar ter-render karena diletakkan di `metadata` bukan export `viewport` terpisah (API Next.js versi ini sudah pindah).
6. Bug-bug redesign lain (font reference stale, SVG icon tanpa `flex-shrink`, badge tanpa ikon WCAG, blok `<style>` mati, tab content bocor) — didokumentasikan lengkap di [progress doc](../03-output-review/redesign-uiux-progress.md#bug-lama-yang-ditemukan--diperbaiki-sepanjang-proses).
7. **Bug scoping styled-jsx: style tidak ke-apply sama sekali padahal sudah ditulis benar** (ditemukan 2 kali — pola ini kemungkinan besar akan ketemu lagi oleh developer lain, penting dipahami). `<style jsx>` (scoped) di styled-jsx **hanya menyuntik hash-class scoping ke elemen yang ditulis literal di dalam function React yang SAMA dengan tag `<style jsx>`-nya**. Kalau elemen yang mau distyle sebenarnya dirender oleh komponen ANAK (function React lain) atau oleh library eksternal, elemen itu tidak pernah dapat hash-class-nya — jadi seluruh rule CSS di situ diam-diam gagal **total** (bukan cuma sebagian: font-size, padding, background, radius, semuanya balik ke default browser), bukan sekadar keliru salah satu properti. Ini beda dari bug "inline style menimpa CSS" (#2 di atas) — di situ rule-nya sempat jalan tapi kalah prioritas; di sini rule-nya tidak pernah match elemen manapun sama sekali. Ditemukan di 2 tempat:
   - **`InsightNote`** (komponen card insight baru, lihat 2.5) — CSS-nya sempat ditulis di `<style jsx>` milik `DashboardPage` (parent), padahal elemen `<p>`/`<div>`-nya dirender oleh `InsightNote` (komponen anak terpisah). Fix: pindahkan `<style jsx>` ke dalam function `InsightNote` itu sendiri — pola yang sama seperti `PriceAlertItem` di file yang sama, yang dari awal sudah benar melakukan ini.
   - **Markdown balasan AI chatbot** (lihat 2.6) — elemen `<p>`/`<ul>`/`<strong>` dirender oleh `react-markdown` (library eksternal), sama sekali bukan JSX literal di `AiChatWidget`. Fix: pakai `<style jsx global>` (bukan scoped) khusus untuk class `.ai-markdown`, supaya rule-nya tidak bergantung pencocokan hash-class apa pun.

   **Cara mendeteksi bug ini kalau ketemu lagi:** kalau CSS sudah ditulis dengan selector yang benar tapi elemen di browser sama sekali tidak menunjukkan efeknya (bukan "keliru salah satu properti", tapi SEMUA properti dalam rule itu tidak berpengaruh) — cek dulu apakah elemen itu dirender oleh komponen/library LAIN, bukan JSX literal di komponen yang sama dengan `<style jsx>`-nya. Cara verifikasi tercepat: buka DevTools, inspect elemen itu, cek apakah dia punya class `jsx-xxxxxxxx` — kalau tidak ada, itu tandanya scoping gagal match dan rule-nya tidak akan pernah berlaku.

---

## 5. Breaking Changes & Perlu Diperhatikan Reviewer

- **Database dev sudah di-reset total.** Menu & bahan baku dasar (`seed.ts`) diganti dari generik jadi konsep "Ayam Geprek Bu Yuli", dan seluruh data transaksi/histori harga/HPP di-generate ulang (`seed-dummy.ts`). Kalau reviewer/tim lain sudah punya data dev sendiri yang ingin dipertahankan, **backup dulu sebelum pull branch ini dan jalankan seed ulang** — lihat instruksi di `CHANGELOG.md` bagian cara menjalankan seeder.
- **3 endpoint dashboard baru** (`monthly-sales`, `visit-pattern-by-day`, `visit-pattern-by-hour`) belum ditambahkan ke dokumentasi API resmi di PRD §9 — perlu update kalau PRD ingin tetap jadi source of truth API.
- **Tidak ada perubahan skema database** (`schema.prisma`) atau migration baru di branch ini — aman dari sisi itu, cukup jalankan seeder ulang, tidak perlu migrate.
- **✅ Ikon PWA — RESOLVED.** Sebelumnya dilaporkan file `icon-192x192.png`/`icon-512x512.png` hilang (tergantikan file bernama aneh `icon-192x192 21.36.10.png` dkk). Sempat diklaim sudah di-restore manual, tapi verifikasi ulang (bukan asumsi) menunjukkan file dengan nama yang benar **masih belum ada** di disk — isi gambarnya sendiri valid (PNG 192×192 dan 512×512, tidak corrupt), cuma nama filenya yang salah. Diperbaiki dengan `git mv` (rename, riwayat file tetap terjaga, bukan hapus-buat-ulang). Sudah diverifikasi menyeluruh: kedua file di-serve `200 OK` dengan `content-type: image/png` dan ukuran byte yang benar dari `http://localhost:3000/icons/...`, dan dicek lewat Chrome DevTools Protocol `Page.getAppManifest` (mesin yang sama dipakai panel Application > Manifest) — hasilnya `"errors": []`, tidak ada warning.
- **✅ Service worker precache `/restock` — FIXED.** `frontend/public/sw.js` masih mem-precache route `/restock` yang sudah dihapus sejak redesign navigasi 3-tab (`CHANGELOG.md` v2.0.0). Ini bukan cuma satu entry cache yang gagal diam-diam — `cache.addAll()` di Cache API **gagal total (reject) kalau ADA SATU SAJA** URL yang responsnya bukan `2xx`, jadi seluruh proses precache/`install` service worker berpotensi gagal gara-gara satu route mati ini. Diperbaiki dengan menghapus `/restock` dari `ASSETS_TO_CACHE`; sisa 7 URL yang di-precache sudah diverifikasi satu-satu mengembalikan `200 OK`.
- **✅ `backend/Dockerfile` masih mode dev — FIXED.** Sebelumnya cuma satu stage, `CMD` selalu `npm run dev` (`tsx watch`, live file-watcher) — cocok untuk dev tapi tidak untuk production (tidak ada compiled output, overhead watcher, source TS ikut ke image). Diperbaiki jadi **multi-stage** dengan 3 target: `dev` (perilaku identik seperti sebelumnya, dipakai `docker-compose.yml` lewat `target: dev` — **dev workflow existing tidak berubah sama sekali**, sudah diverifikasi ulang jalan normal), `build` (compile TypeScript via `tsc`), dan `production` (target default kalau `docker build` dijalankan tanpa `--target` eksplisit — menjalankan `node dist/index.js` yang sudah dikompilasi, bukan `tsx watch`). Target `production` sudah dibuild & dijalankan sungguhan sebagai container terpisah (bukan cuma baca Dockerfile) — terbukti boot normal dan endpoint API (`/health`, `/api/v1/dashboard/monthly-sales`) merespons `200 OK`.
  - **Catatan:** `frontend/Dockerfile` punya masalah yang sama persis (single-stage, selalu `npm run dev`) tapi **belum disentuh** — di luar scope perbaikan yang diminta kali ini, dicatat di bagian Known Issues di bawah.
- **`frontend/package.json`/`package-lock.json` berubah** — dependency baru `react-markdown` (^10.1.0) untuk render Markdown balasan AI chatbot (lihat 2.6). Reviewer/tim lain **wajib jalankan `npm install` ulang** di folder `frontend/` setelah pull branch ini. Kalau pakai Docker, image frontend juga perlu di-rebuild — lihat catatan troubleshooting volume anonim di bagian 7 sebelum rebuild, supaya dependency barunya benar-benar kepakai.

---

## 6. Belum Dikerjakan / Known Issues

- `frontend/Dockerfile` masih single-stage mode dev (`npm run dev`), sama seperti masalah `backend/Dockerfile` yang sudah diperbaiki di atas — belum disentuh, perlu perbaikan serupa (multi-stage `dev`/`production`) sebelum deployment produksi sungguhan.
- File upload gambar menu belum ada mekanisme hapus otomatis saat menu dihapus (`DELETE /menus/:id`) — file lama jadi orphan di `uploads/menus/`.
- Belum semua halaman diverifikasi ulang untuk print stylesheet (`@media print`) pasca redesign Dashboard.
- Catatan di `03-output-review/redesign-uiux-progress.md` baris terakhir masih menyebut placeholder "Lainnya" sebagai item yang "menunggu keputusan fitur" — **sudah usang**, karena placeholder itu sudah dihapus di commit `8bd7605`. Perlu update baris itu kalau dokumen tersebut mau tetap akurat.
- Markdown balasan AI chatbot (2.6) belum pakai `remark-gfm`, jadi tabel Markdown (kalau suatu saat direspons Gemini) belum dirender sebagai tabel asli. Belum jadi masalah nyata sejauh ini.
- **Tidak ada UI untuk membatalkan transaksi.** Backend punya endpoint `POST /transactions/:id/cancel` (berfungsi normal saat dites langsung), tapi ditemukan saat regression test E2E browser bahwa **tidak ada satupun tombol/halaman di frontend** yang memanggilnya — tidak ada halaman riwayat transaksi sama sekali untuk POS. Owner secara praktis tidak bisa membatalkan transaksi lewat aplikasi.
- **Kuota gratis Gemini API (free tier) sangat kecil untuk kebutuhan produksi** — 20 request/hari per model (`generate_content_free_tier_requests`). Ditemukan saat regression E2E: 3 pertanyaan berturut-turut ke chatbot AI sempat kena `429 Too Many Requests` dari Gemini (backend menangani dengan benar, balikin `502` + pesan "Layanan AI sementara tidak tersedia" ke frontend — bukan bug, memang graceful degradation yang disengaja di `aiController.ts`). Tapi kuota 20/hari jelas tidak cukup untuk pemakaian nyata sehari-hari sebuah warung — **wajib upgrade ke paid tier Gemini API sebelum deployment produksi**, kalau tidak fitur AI chatbot akan sering mati di jam sibuk.
- **`POST /transactions` menyimpang dari kontrak API yang didokumentasikan PRD §9 — `/transactions/:id/cancel` jadi praktis tidak pernah terpanggil.** `POST /transactions` saat ini selalu default `status: completed` langsung (checkout 1 langkah), bukan default `pending` seperti yang didokumentasikan di PRD §9. Ini membuat endpoint `POST /transactions/:id/cancel` secara praktis tidak pernah terpanggil dari alur manapun di aplikasi (FR-05 "Batal Transaksi" di UI Kasir bekerja lewat mekanisme lain — clear local state sebelum checkout dipanggil sama sekali, bukan lewat endpoint cancel ini). FR-05 tetap terpenuhi penuh secara fungsional (acceptance criteria §10 lolos), ini murni penyimpangan kontrak API dari dokumentasi PRD, bukan bug. Perlu didiskusikan dengan pemegang keputusan desain apakah checkout 1-langkah ini disengaja dipertahankan (lebih simpel) atau perlu dikembalikan ke alur pending→complete (memberi window "batalkan sebelum stok terpotong" untuk kasus training kasir baru/salah pencet).

> **Dicek ulang pasca commit `958b32f..25d675b` (bagian 9):** tidak ada satu pun item di daftar ini yang terselesaikan oleh 4 commit pasca-merge tersebut — semuanya masih terbuka apa adanya. Item baru dari commit `40f1c91` (stok desimal, badge overlap) sudah langsung diperbaiki di commit yang sama, jadi tidak pernah masuk daftar ini.

---

## 7. Troubleshooting / Catatan Operasional (penting untuk developer lain)

- **`docker compose up --build` tidak selalu memakai dependency baru** (`npm install`/`package.json` berubah, misal saat menambah `react-markdown` untuk 2.6). Volume anonim `/app/node_modules` (dideklarasikan di `docker-compose.yml` sebagai `- /app/node_modules`, tanpa nama volume) **tidak otomatis di-refresh** oleh Docker Compose saat image di-rebuild — Compose bisa tetap memakai data volume lama dari container sebelumnya alih-alih `node_modules` baru hasil `npm ci` di image. Gejalanya: log Next.js bilang `Module not found: Can't resolve 'xxx'` walau `package.json` dan image sudah benar berisi dependency itu (sempat terjadi persis begini saat verifikasi 2.6).
  - **Solusi:** jalankan `docker compose up -d --build --force-recreate -V <nama-service>` — flag `-V` (alias `--renew-anon-volumes`) memaksa Compose membuang volume anonim lama dan memakai isi image yang baru saja di-build.
  - Berlaku juga untuk perubahan dependency backend (`backend/package.json`) di masa depan, bukan cuma frontend.

---

## 8. Catatan Verifikasi

- Perubahan chart, dashboard, AI chatbot (recipe-setting), dan navigasi masing-masing sudah diuji manual end-to-end (screenshot browser untuk UI, request langsung ke endpoint asli untuk backend/AI — bukan mock) sepanjang proses pengerjaan.
- Ikon PWA: diverifikasi lewat `file` command (dimensi & validitas PNG), `curl` (HTTP 200 + content-type + ukuran byte persis), dan Chrome DevTools Protocol `Page.getAppManifest` langsung di browser asli (bukan cuma baca source) — nol error.
- Service worker: dicek satu-satu tiap URL di `ASSETS_TO_CACHE` yang tersisa mengembalikan `200 OK`.
- Insight dashboard (2.5): dicek computed style di browser asli (bukan cuma baca source) untuk membuktikan bug scoping styled-jsx-nya nyata — sebelum fix, `.insight-note` computed `font-size: 16px`/`padding: 0px`/`background: transparent` (rule tidak pernah match); sesudah fix, `font-size: 14px`/`padding: 10px 14px`/`background` sesuai tone. Insight "bulan berjalan" dicek dengan data asli (Juli baru berjalan beberapa hari) — hasilnya perbandingan rata-rata harian, bukan klaim "turun 69%" yang menyesatkan dari perbandingan total mentah sebelumnya.
- Markdown chatbot (2.6): diuji dengan 2 pertanyaan nyata ke Gemini API (bukan mock) — dikonfirmasi lewat `element.innerHTML`/`getComputedStyle` di browser asli bahwa `<ul><li>` dan `<strong>` (dengan `font-weight: 700` computed) benar-benar ter-render, `textContent` tidak lagi mengandung tanda `**` mentah.
- `backend/Dockerfile`: target `dev` di-rebuild & di-restart di container yang sedang jalan, dikonfirmasi masih `tsx watch` seperti semula (dev workflow tidak berubah). Target `production` di-build & dijalankan sebagai container terpisah yang benar-benar tersambung ke database yang sama, dikonfirmasi boot sukses dan endpoint API merespons normal — bukan cuma diasumsikan dari isi Dockerfile.
- Tidak ada test otomatis (unit/integration) yang ditambahkan di branch ini untuk fitur-fitur baru — verifikasi murni manual.
- **Regression check backend (curl, token asli):** 3 alur inti (`POST /transactions` → `/complete`, `POST /ingredients/:id/restock`, `GET /dashboard/summary`) dites dengan token JWT asli hasil login sungguhan (bukan mock) — semua `200 OK` dengan data yang masuk akal (harga/HPP/stok konsisten dengan DB). Middleware auth dikonfirmasi menolak `401` untuk request tanpa token maupun token rusak.
- **Regression E2E browser penuh (Playwright, Chromium asli, bukan simulasi):** login → POS (tambah keranjang, checkout, struk) → Inventaris (restock, riwayat harga, Menu & Resep) → Dashboard (4 chart/insight, Laporan Rentang Waktu + generate + Cetak PDF) → AI Chatbot (tanya data historis, restock via chat, set resep via chat) — semua alur berhasil dijalankan lewat UI asli dan discreenshot. Tidak ada console error maupun uncaught exception sepanjang alur; satu-satunya HTTP error yang muncul (`502` di `/api/v1/ai/chat`) berasal dari kuota gratis Gemini API habis (lihat Known Issues), bukan bug kode — backend maupun frontend menanganinya dengan benar (pesan error yang jelas ke Owner, bukan crash).
- **Banner konflik sync offline (baru, 2.7):** diverifikasi dengan simulasi nyata, bukan cuma inspeksi kode — stok bahan baku "Air Mineral Botol" diturunkan sementara di database (`0.5`, di bawah kebutuhan `3`), sebuah transaksi offline di-inject lewat `localStorage`, halaman di-reload sehingga alur sync otomatis berjalan sungguhan lewat `POST /transactions/sync`. Modal konflik muncul dengan data yang benar (nama bahan, jumlah kekurangan, jumlah transaksi terdampak) dan tidak auto-dismiss. Data simulasi (transaksi test, stock movement konflik, angka stok) dibersihkan kembali dari database sesudahnya.
- `npx tsc --noEmit` dijalankan ulang di titik pengecekan sesi ini (bukan cuma diasumsikan dari sesi sebelumnya) — bersih di backend maupun frontend, nol error.
- **Fail-fast `JWT_SECRET` (2.7) — baru diverifikasi lewat baca kode, BELUM lewat live-test.** Percobaan menguji langsung (unset `JWT_SECRET` lalu jalankan container) tidak berhasil memicu kondisi "benar-benar kosong": `backend/src/index.ts` baris pertama `import 'dotenv/config'` memuat ulang `backend/.env` (file secrets asli, ter-mount sebagai volume di container dev) sebelum `requireEnv()` sempat mengecek — jadi nilai asli ke-reload lagi walau sudah di-unset di level shell. Logic `requireEnv()` sendiri sudah benar dari pembacaan kode (`process.exit(1)` kalau `!value`), tapi belum ada observasi langsung container benar-benar keluar dengan pesan `[FATAL]`. Beda dengan 3 fix lain (auth middleware, race condition, konflik sync) yang sudah dikonfirmasi live lewat curl/Playwright sesi ini.

---

## 9. Perubahan Setelah Merge ke `main` (Pasca PR #2)

Base perbandingan bagian ini: `958b32f` (merge commit PR #2) → `25d675b` (`HEAD` saat ditulis). 4 commit baru, seluruhnya langsung di `main`, belum ada PR terpisah dibuka untuk merangkumnya — makanya ditambahkan di sini. Semua sudah `tsc --noEmit` bersih dan diverifikasi manual (curl/Playwright/screenshot), belum ada test otomatis ditambahkan.

### 9.1 Fix Stok Desimal untuk Satuan Diskrit (`potong`/`pcs`) + Fix Overlap Badge Inventaris
**Commit:** `40f1c91`

Dua bug ditemukan sekaligus di kartu bahan baku halaman Inventaris:

- **Stok tampil desimal untuk satuan hitungan** (mis. "147.64 potong", "237.09 potong") — tidak masuk akal karena "potong"/"pcs" itu hitungan bulat, beda dari gram/ml yang wajar desimal. Akar masalah: `backend/prisma/seed-dummy.ts` membulatkan SEMUA kuantitas restock harian ke 2 desimal secara seragam (`Math.round(orderQty * 100) / 100`), tanpa membedakan satuan diskrit vs kontinu — dan skema database sendiri tidak punya kategorisasi ini (kolom `unit` cuma `VarChar` bebas). Diperbaiki di **3 layer**:
  1. **Seed generation** — `roundToUnit()` baru + `DISCRETE_UNITS` set di `seed-dummy.ts`, supaya reseed berikutnya otomatis hasilkan bilangan bulat untuk satuan diskrit.
  2. **Display** — `frontend/src/lib/format.ts` (baru): `isDiscreteUnit()`/`formatStockQty()`, dipakai di semua tempat stok ditampilkan (kartu bahan baku, subtitle Min. Stok, tab Restock) — bukan cuma satu tempat yang kelihatan di laporan awal.
  3. **Input validation** — `step` pada input angka Restock/Edit/Create Bahan Baku diubah jadi `1` (bukan `any`) kalau satuannya diskrit, supaya entri manual tidak reintroduksi desimal.
  - **Data lama:** dijalankan `UPDATE ingredients SET stock_qty = ROUND(stock_qty) WHERE unit IN (...)` satu kali di database dev yang sedang berjalan (11 baris, non-destruktif, tidak menyentuh `stock_movements`) — kalau developer lain belum reseed ulang sejak commit ini, data dev mereka mungkin masih punya nilai desimal lama sampai reseed atau dikoreksi manual dengan query yang sama.
- **Badge "Stok: X" menimpa nama bahan baku panjang** (terlihat di "Ayam Potong (Paha Atas/Bawah/Dada)", "Ayam Fillet (Dada Tanpa Tulang)"). Akar masalah: `.inv-card-badge` pakai `position: absolute; top:0; right:0` tanpa reservasi ruang apa pun di layout — nama panjang yang wrapping tidak punya apa pun yang mendorongnya menjauh dari badge. Diperbaiki dengan memindahkan badge dari absolute-positioned jadi flex item normal dalam row baru `.inv-card-header` (bersama `<h3>` judul, `justify-content: space-between; flex-wrap: wrap`), judul diberi `flex:1; min-width:120px` — badge sekarang selalu punya ruang nyata dan jatuh ke baris sendiri kalau tidak muat, bukan menimpa teks.

Diverifikasi lewat Playwright: circle data-point (tidak relevan di sini, itu untuk 9.3) — untuk fix ini, screenshot kartu "Ayam Fillet (Dada Tanpa Tulang)" (nama terpanjang di data) di viewport 1440px dan 375px, keduanya tidak overlap; nilai stok terkonfirmasi bulat ("142 potong", dst.) lewat `innerText()`, bukan cuma dibaca visual.

File yang terdampak: `backend/prisma/seed-dummy.ts`, `frontend/src/lib/format.ts` (baru), `frontend/src/app/inventory/page.tsx`.

### 9.2 Halaman Akun Baru — Ganti Logout Floating per Halaman
**Commit:** `778dcb7`

Sebelumnya tombol "Keluar" cuma ada di header halaman POS (`.btn-logout`, tanpa gating responsive apa pun) — tidak muncul sama sekali di Inventaris/Dashboard, jadi Owner harus balik ke POS dulu kalau mau logout dari halaman lain. Ditemukan juga tidak ada versi mobile terpisah (`BottomNav.tsx` tidak punya item logout apa pun) — tombol POS yang sama itu juga yang jadi satu-satunya akses logout di mobile.

Diperbaiki dengan halaman baru `frontend/src/app/account/page.tsx` sebagai satu tempat konsisten untuk info akun (Nama, Peran — dari `localStorage.sipi_user`, field yang memang tersedia dari sistem auth 1-akun-hardcoded ini, tidak mengarang field baru) dan tombol "Keluar" (reuse logic logout yang sudah ada, bukan ditulis ulang). Diakses lewat item nav ke-4 **"Akun"** di `Sidebar.tsx` (desktop, ≥1024px) dan `BottomNav.tsx` (mobile, <1024px, grid dikembalikan ke `repeat(4,1fr)`/`max-width` proporsional — kebalikan persis dari perubahan 3-kolom di commit `8bd7605`). Tombol `.btn-logout` floating di header POS dihapus total, beserta `handleLogout`/`useRouter` yang jadi dead code di file itu.

Diverifikasi: screenshot desktop (1440px) & mobile (375px) di POS/Inventaris/Dashboard/Akun — nol console error di 8 kombinasi halaman×viewport, tidak ada lagi logout floating di manapun selain halaman Akun. Fungsional logout dites end-to-end lewat Playwright (klik "Keluar" → `POST /auth/logout` → `localStorage` `sipi_token`/`sipi_logged_in`/`sipi_user` terkonfirmasi terhapus → redirect ke `/login`), bukan cuma baca kode.

File yang terdampak: `frontend/src/app/account/page.tsx` (baru), `frontend/src/components/Sidebar.tsx`, `frontend/src/components/BottomNav.tsx`, `frontend/src/app/globals.css`, `frontend/src/app/pos/page.tsx`.

### 9.3 Line Chart: Kurva Halus → Garis Lurus (Fix Overshoot di Titik Data)
**Commit:** `1892f36`

Grafik "Tren Harga (30 Hari Terakhir)" di mini-card alert kenaikan harga (`SimpleLineChart`, `dashboard/page.tsx`) memakai `buildSmoothLinePath` — kurva quadratic Bézier yang ditarik lewat titik TENGAH antar data (`Q prev midX midY`), bukan lewat titik data itu sendiri. Efeknya: garis cuma benar-benar menyentuh titik pertama/terakhir, titik-titik di tengah (yang lingkarannya digambar terpisah persis di koordinat data asli) selalu sedikit meleset dari kurva — kelihatan sebagai "overshoot" di puncak/lembah.

Diperbaiki dengan `buildStraightLinePath` — polyline biasa (`M`/`L` per segmen, garis lurus antar titik), tanpa menyentuh `getX`/`getY`/`chartPoints`/logic data apa pun, murni cara path digambar. Dicek juga apakah ada chart line lain di aplikasi yang pakai smoothing serupa — `SimpleLineChart` ternyata satu-satunya; chart lain (`MonthlySalesChart`, Pola Pengunjung Mingguan, Jam Tersibuk) semuanya bar chart, tidak ada path smoothing.

Diverifikasi bukan cuma visual — lewat `page.evaluate()` di browser asli, dikonfirmasi programatik bahwa koordinat `(cx, cy)` tiap `<circle>` data-point sama persis dengan salah satu vertex di string `d` milik `<path>` (bukan mendekati, tapi sama persis).

File yang terdampak: `frontend/src/app/dashboard/page.tsx`.

### 9.4 Pembulatan Tampilan Rata-rata Transaksi/Hari (Pola Pengunjung Mingguan)
**Commit:** `25d675b`

Tooltip hover bar chart "Pola Pengunjung Mingguan" dan insight text di bawahnya menampilkan angka rata-rata transaksi/hari apa adanya dari backend (mis. "86.75 transaksi/hari") — desimal ganjil untuk sesuatu yang secara alami dihitung sebagai satuan bulat oleh Owner ("86.75 transaksi" tidak masuk akal, beda dengan stok yang memang bisa desimal untuk satuan berat/volume). Ini **murni perubahan tampilan** — `Math.round()` diterapkan HANYA di titik render (tooltip di komponen chart, teks di `buildWeeklyPatternInsight`), perhitungan rata-rata di backend (`avgTransactions`) tetap presisi seperti semula, tidak diubah sama sekali.

Dicek juga cakupan lain: chart "Jam Tersibuk" (`buildHourlyPatternInsight`, `totalTransactions`) TIDAK perlu pembulatan — nilainya sudah selalu bilangan bulat dari sononya (jumlah total transaksi per jam, bukan rata-rata), dikonfirmasi lewat panggilan langsung ke `GET /dashboard/visit-pattern-by-hour`. Tidak ada tempat lain di dashboard yang menampilkan `avgTransactions` dengan desimal (dicek lewat pencarian semua penggunaan field ini).

File yang terdampak: `frontend/src/app/dashboard/page.tsx`.

### 9.5 Keputusan: Permintaan Fitur Registrasi Multi-Tenant — DITOLAK

Permintaan untuk menambah alur registrasi/multi-tenant (banyak akun/warung terpisah dalam satu instalasi) didiskusikan dan **diputuskan untuk TIDAK dikerjakan**, mempertahankan desain single-tenant/1-akun-hardcoded sesuai PRD (OQ-6, dan Non-Goals yang eksplisit mengecualikan "alur registrasi dan autentikasi multi-user").

**Alasan penolakan:**
- Mengubah ke multi-tenant butuh redesign skema database besar (`tenant_id` di semua tabel bisnis: `Menu`, `Ingredient`, `Transaction`, dll.) — bukan perubahan aditif kecil.
- Butuh audit ulang SEMUA query yang ada (setiap query harus di-scope ke tenant yang benar) — berisiko tinggi menimbulkan kebocoran data antar tenant kalau ada satu saja query yang terlewat, apalagi kalau dikerjakan terburu-buru.
- Timing permintaan ini H-1 presentasi — risiko regresi dari perubahan sebesar ini jauh lebih besar dari manfaatnya untuk kebutuhan demo/MVP saat ini.

Dicatat di sini supaya keputusan ini (dan alasannya) tetap terdokumentasi — kalau permintaan serupa muncul lagi di kemudian hari, konteks penolakannya sudah jelas tanpa perlu didiskusikan ulang dari nol.

---

## 10. Catatan Verifikasi — Bagian 9

- **9.1 (stok desimal):** `stock_qty` untuk 11 bahan baku bersatuan diskrit dicek lewat `psql` sebelum & sesudah `UPDATE`, dikonfirmasi bulat semua sesudahnya. Kartu "Ayam Fillet (Dada Tanpa Tulang)" (nama terpanjang) discreenshot di 1440px & 375px, tidak ada overlap.
- **9.2 (halaman Akun):** logout end-to-end dites lewat Playwright asli (bukan baca kode) — token/localStorage terhapus, redirect ke `/login` terkonfirmasi. 8 kombinasi halaman×viewport discreenshot, nol console error.
- **9.3 (line chart):** koordinat tiap `<circle>` dicek programatik cocok persis dengan vertex `<path>` lewat `page.evaluate()`, bukan cuma dilihat visual.
- **9.4 (pembulatan transaksi/hari):** dikonfirmasi lewat `innerText()` tooltip & insight-note di browser asli menampilkan "87" (dibulatkan dari 86.75 via API `visit-pattern-by-day`), dan `visit-pattern-by-hour` dikonfirmasi sudah selalu integer dari respons API langsung.
- `npx tsc --noEmit` bersih di backend & frontend untuk semua 4 commit di bagian ini.
- Tidak ada test otomatis ditambahkan — verifikasi murni manual (curl/Playwright/query database langsung).
