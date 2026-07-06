# Ringkasan Perubahan — Branch `redesign/uiux-stitch-janu`

**Base branch:** `main`
**Commit di branch ini:** 30 commit sejak diverge dari `main`
**Untuk reviewer:** dokumen ini merangkum SEMUA perbedaan branch ini vs `main` — baik redesign UI/UX, fitur backend baru, maupun perbaikan bug — supaya bisa direview tanpa harus membaca 30 commit satu-satu. Detail teknis tahap-per-tahap redesign UI/UX (dengan commit hash per tahap) sudah ada duluan di [`03-output-review/redesign-uiux-progress.md`](../03-output-review/redesign-uiux-progress.md); dokumen ini melengkapinya dengan pekerjaan sesudahnya (analitik dashboard baru, perluasan AI chatbot, rombak data dummy, cleanup navigasi) plus rangkuman level-tinggi untuk reviewer yang tidak familiar detail per tahap.

> Dibuat via `git log`/`git diff origin/main..HEAD` yang dijalankan langsung — bukan dari ingatan percakapan sebelumnya, supaya akurat.

---

## 1. Ringkasan Tingkat Tinggi

Branch ini punya dua gelombang pekerjaan:

1. **Redesign UI/UX total** ("SIPI Modern Merchant") — ganti tema visual dari "Premium Warm Bistro" (oranye/cream) ke tema cobalt biru, redesign semua halaman (Login, POS, Inventaris, Dashboard), tambah shell navigasi desktop (sidebar 280px, sebelumnya cuma ada bottom nav mobile), dan fitur upload gambar menu. **Tidak ada logic bisnis, endpoint API, atau skema database yang diubah** di gelombang ini — murni presentasional kecuali penambahan aditif (upload gambar).
2. **Fitur analitik & AI baru + data demo realistis** — dashboard dapat 3 insight baru (tren 6 bulan, pola pengunjung mingguan, jam tersibuk), AI chatbot diperluas supaya bisa menjawab pertanyaan soal data historis itu DAN mengatur resep menu lewat percakapan (bukan cuma restock seperti sebelumnya), serta data dummy database di-generate ulang total jadi simulasi 6 bulan yang realistis (bukan random flat) untuk keperluan demo.

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

---

## 5. Breaking Changes & Perlu Diperhatikan Reviewer

- **Database dev sudah di-reset total.** Menu & bahan baku dasar (`seed.ts`) diganti dari generik jadi konsep "Ayam Geprek Bu Yuli", dan seluruh data transaksi/histori harga/HPP di-generate ulang (`seed-dummy.ts`). Kalau reviewer/tim lain sudah punya data dev sendiri yang ingin dipertahankan, **backup dulu sebelum pull branch ini dan jalankan seed ulang** — lihat instruksi di `CHANGELOG.md` bagian cara menjalankan seeder.
- **3 endpoint dashboard baru** (`monthly-sales`, `visit-pattern-by-day`, `visit-pattern-by-hour`) belum ditambahkan ke dokumentasi API resmi di PRD §9 — perlu update kalau PRD ingin tetap jadi source of truth API.
- **Tidak ada perubahan skema database** (`schema.prisma`) atau migration baru di branch ini — aman dari sisi itu, cukup jalankan seeder ulang, tidak perlu migrate.
- **✅ Ikon PWA — RESOLVED.** Sebelumnya dilaporkan file `icon-192x192.png`/`icon-512x512.png` hilang (tergantikan file bernama aneh `icon-192x192 21.36.10.png` dkk). Sempat diklaim sudah di-restore manual, tapi verifikasi ulang (bukan asumsi) menunjukkan file dengan nama yang benar **masih belum ada** di disk — isi gambarnya sendiri valid (PNG 192×192 dan 512×512, tidak corrupt), cuma nama filenya yang salah. Diperbaiki dengan `git mv` (rename, riwayat file tetap terjaga, bukan hapus-buat-ulang). Sudah diverifikasi menyeluruh: kedua file di-serve `200 OK` dengan `content-type: image/png` dan ukuran byte yang benar dari `http://localhost:3000/icons/...`, dan dicek lewat Chrome DevTools Protocol `Page.getAppManifest` (mesin yang sama dipakai panel Application > Manifest) — hasilnya `"errors": []`, tidak ada warning.
- **✅ Service worker precache `/restock` — FIXED.** `frontend/public/sw.js` masih mem-precache route `/restock` yang sudah dihapus sejak redesign navigasi 3-tab (`CHANGELOG.md` v2.0.0). Ini bukan cuma satu entry cache yang gagal diam-diam — `cache.addAll()` di Cache API **gagal total (reject) kalau ADA SATU SAJA** URL yang responsnya bukan `2xx`, jadi seluruh proses precache/`install` service worker berpotensi gagal gara-gara satu route mati ini. Diperbaiki dengan menghapus `/restock` dari `ASSETS_TO_CACHE`; sisa 7 URL yang di-precache sudah diverifikasi satu-satu mengembalikan `200 OK`.
- **✅ `backend/Dockerfile` masih mode dev — FIXED.** Sebelumnya cuma satu stage, `CMD` selalu `npm run dev` (`tsx watch`, live file-watcher) — cocok untuk dev tapi tidak untuk production (tidak ada compiled output, overhead watcher, source TS ikut ke image). Diperbaiki jadi **multi-stage** dengan 3 target: `dev` (perilaku identik seperti sebelumnya, dipakai `docker-compose.yml` lewat `target: dev` — **dev workflow existing tidak berubah sama sekali**, sudah diverifikasi ulang jalan normal), `build` (compile TypeScript via `tsc`), dan `production` (target default kalau `docker build` dijalankan tanpa `--target` eksplisit — menjalankan `node dist/index.js` yang sudah dikompilasi, bukan `tsx watch`). Target `production` sudah dibuild & dijalankan sungguhan sebagai container terpisah (bukan cuma baca Dockerfile) — terbukti boot normal dan endpoint API (`/health`, `/api/v1/dashboard/monthly-sales`) merespons `200 OK`.
  - **Catatan:** `frontend/Dockerfile` punya masalah yang sama persis (single-stage, selalu `npm run dev`) tapi **belum disentuh** — di luar scope perbaikan yang diminta kali ini, dicatat di bagian Known Issues di bawah.

---

## 6. Belum Dikerjakan / Known Issues

- `frontend/Dockerfile` masih single-stage mode dev (`npm run dev`), sama seperti masalah `backend/Dockerfile` yang sudah diperbaiki di atas — belum disentuh, perlu perbaikan serupa (multi-stage `dev`/`production`) sebelum deployment produksi sungguhan.
- File upload gambar menu belum ada mekanisme hapus otomatis saat menu dihapus (`DELETE /menus/:id`) — file lama jadi orphan di `uploads/menus/`.
- Belum semua halaman diverifikasi ulang untuk print stylesheet (`@media print`) pasca redesign Dashboard.
- Catatan di `03-output-review/redesign-uiux-progress.md` baris terakhir masih menyebut placeholder "Lainnya" sebagai item yang "menunggu keputusan fitur" — **sudah usang**, karena placeholder itu sudah dihapus di commit `8bd7605`. Perlu update baris itu kalau dokumen tersebut mau tetap akurat.

---

## 7. Catatan Verifikasi

- Perubahan chart, dashboard, AI chatbot (recipe-setting), dan navigasi masing-masing sudah diuji manual end-to-end (screenshot browser untuk UI, request langsung ke endpoint asli untuk backend/AI — bukan mock) sepanjang proses pengerjaan.
- `npx tsc --noEmit` bersih di backend maupun frontend per titik pengecekan terakhir.
- Ikon PWA: diverifikasi lewat `file` command (dimensi & validitas PNG), `curl` (HTTP 200 + content-type + ukuran byte persis), dan Chrome DevTools Protocol `Page.getAppManifest` langsung di browser asli (bukan cuma baca source) — nol error.
- Service worker: dicek satu-satu tiap URL di `ASSETS_TO_CACHE` yang tersisa mengembalikan `200 OK`.
- `backend/Dockerfile`: target `dev` di-rebuild & di-restart di container yang sedang jalan, dikonfirmasi masih `tsx watch` seperti semula (dev workflow tidak berubah). Target `production` di-build & dijalankan sebagai container terpisah yang benar-benar tersambung ke database yang sama, dikonfirmasi boot sukses dan endpoint API merespons normal — bukan cuma diasumsikan dari isi Dockerfile.
- Tidak ada test otomatis (unit/integration) yang ditambahkan di branch ini untuk fitur-fitur baru — verifikasi murni manual.
