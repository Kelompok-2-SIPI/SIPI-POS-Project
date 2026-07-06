# Progress Redesign UI/UX — Branch `redesign/uiux-stitch-janu`

**Pemilik branch:** Janu (jaenu-dev)
**Periode pengerjaan:** 5–6 Juli 2026
**Basis desain:** `repo/DESIGN.md` (SIPI Modern Merchant) + `repo/AGENTS-UIUX.md` (guardrail eksekusi) + mockup Stitch di `02-design/stitch-janu/`
**Total commit di branch ini:** 26 commit sejak diverge dari `main` (23 di antaranya redesign UI/UX + fitur baru oleh Janu, 3 commit `feat`/`fix` AI Chatbot & dashboard chart dari rekan tim — `FiveUII` — hasil merge `origin/main`).

Dokumen ini merangkum seluruh pekerjaan redesign yang sudah dilakukan di branch ini, tahap per tahap, supaya mudah direview atau dilanjutkan.

---

## Ringkasan Tahapan

| # | Tahap | Commit | Area | Ringkasan |
|---|-------|--------|------|-----------|
| 0 | Design Tokens Global | `26aae73` | `globals.css` | Ganti seluruh token warna/tipografi/radius dari tema lama "Premium Warm Bistro" ke "SIPI Modern Merchant" (cobalt `#0064E0`) |
| 1 | Login Page | `31a16ab`, `06936f6` | `login/page.tsx` | Redesign penuh form login + fix bug background abu-abu & referensi font mati |
| 2 | Shell Navigasi | `3aa1e90` | `AppShell.tsx`, `Sidebar.tsx`, `BottomNav.tsx` | Bottom nav 4-tab (mobile) + sidebar 280px (desktop), render-both + CSS media query |
| 3a | Inventaris — Sub-tab Stok | `80928b1` | `inventory/page.tsx` | Bento grid bahan baku, badge Stok Kritis WCAG AA, fix bug icon/tab-color/FAB-overlap/tab-bocor |
| 3b | Inventaris — Restock & Menu/Resep | `80f513f` | `inventory/page.tsx` | Restyle sub-tab Restock & Menu/Resep, fix badge WCAG, bersihkan CSS mati |
| 4a | POS — Grid Menu | `b9fd7a2` | `pos/page.tsx` | Redesign grid menu photography-first, filter kategori pill, fix style block mati & bug font |
| 4b | POS — Cart & Struk | `6537b64` | `pos/page.tsx` | Restyle bottom sheet keranjang & modal struk, payment selector jadi segmented pill |
| 4c | POS — Layout Cart Desktop | `5fa0838` | `pos/page.tsx` | Cart jadi panel tetap kanan (≥1024px) tanpa ubah logic, tetap bottom sheet di mobile |
| 5a | Dashboard — Ringkasan & Stats | `5cb0837` | `dashboard/page.tsx` | Restyle banner ringkasan, 3 stat card (watermark icon), Menu Terlaris + progress bar |
| 5b | Dashboard — Price Alert & Chart | `0f9b8b5` | `dashboard/page.tsx` | Restyle card alert kenaikan harga, `SimpleLineChart` jadi smooth curve + gradient + tooltip gelap |
| — | Fix Debug Backend | `d543d25` | `backend/routes/dashboard.ts` | Tambah `console.error` di endpoint `-range` untuk debugging 500 error |
| — | Brand & PWA | `ae6fd95` | `login`, `Sidebar`, `layout.tsx`, `manifest.json` | Ganti logo, fix `theme_color` stale + bug `themeColor`/`viewport` Next.js metadata |
| — | Upload Gambar Menu (Backend) | `399fe8b` | `backend/routes/menus.ts`, `index.ts` | Endpoint multipart upload gambar menu via `multer` |
| — | Upload Gambar Menu (Frontend) | `a18bdec` | `inventory/page.tsx`, `pos/page.tsx`, `lib/api.ts` | Form upload + preview, tampilkan gambar asli di grid POS & Menu/Resep |
| — | Fix Gambar Menu Terlaris | `a028a3a` | `backend/routes/dashboard.ts`, `dashboard/page.tsx` | `/top-menus` tidak pernah join ke tabel Menu — `imageUrl` tidak sampai ke frontend padahal sudah tampil di POS/Menu-Resep |
| — | Rekomendasi Harga di Price Alert | `ff7107d` | `backend/routes/dashboard.ts`, `dashboard/page.tsx` | `/price-alerts` kirim `sellingPrice`, frontend hitung rekomendasi harga baru per menu terdampak (rumus sama seperti Margin Kritis) |
| — | Grafik Tren Penjualan Bulanan | `6f33d35` | `backend/routes/dashboard.ts`, `dashboard/page.tsx` | Endpoint `/monthly-sales` baru + bar chart SVG custom, highlight bulan tertinggi, hover tooltip |
| — | Fix Ukuran Chart Dashboard | *(belum di-commit)* | `dashboard/page.tsx`, `globals.css` | Perbaikan berlapis ukuran `SimpleLineChart` & `MonthlySalesChart` di desktop — lihat detail di bawah |

---

## Detail per Tahap

### Tahap 0 — Design Tokens Global (`26aae73`)
Mengganti seluruh CSS custom property di `globals.css`: warna primer (oranye → cobalt `#0064E0`), radius (`--radius-sm/md/lg/pill`), tipografi (Plus Jakarta Sans sebagai font tunggal, `--font-outfit` dihapus), shadow. Ini fondasi untuk semua tahap berikutnya — semua styling baru wajib pakai token dari sini, bukan hex hardcode.

### Tahap 1 — Login Page (`31a16ab`, `06936f6`)
Redesign total halaman login sesuai mockup Stitch (`login_sipi_mobile*`): brand icon kotak cobalt, input dengan ikon kiri, tombol pill-shaped, background blob atmosferik. Logic `handleSubmit` (termasuk fallback offline `admin`/`sipi123`) **tidak diubah**. Bug tambahan yang ditemukan & diperbaiki: background abu-abu di brand name pada mobile, dan referensi `var(--font-outfit)` yang sudah dihapus di Tahap 0 (bug ini berulang muncul di tahap-tahap lain — lihat bagian "Bug Berulang" di bawah).

### Tahap 2 — Shell Navigasi (`3aa1e90`)
`AppShell.tsx` baru: render sidebar (desktop) + bottom nav (mobile) **sekaligus**, visibility diatur murni via CSS `@media (min-width: 1024px)` — pola ini dipakai ulang di Tahap 4c untuk cart panel desktop supaya tidak ada hydration mismatch (server tidak tahu ukuran viewport client).

### Tahap 3a — Inventaris: Sub-tab Stok (`80928b1`)
Redesign grid bahan baku jadi card dengan badge stok (kritis = merah + ikon wajib WCAG). Beberapa bug ditemukan & diperbaiki dalam proses review:
- Ikon action button di card muncul sebagai titik kecil → SVG kurang `flex-shrink: 0` dalam flex container.
- Tab switcher (Stok/Restock/Menu) masih background coklat lama.
- FAB chatbot AI menutupi badge "Stok Kritis" di mobile → diberi jarak aman via CSS.
- **Bug paling signifikan:** grid bahan baku sempat muncul di SEMUA sub-tab (tidak ter-scope ke `activeTab === 'ingredients'`) — diperbaiki, plus ditemukan bug turunan di header (deskripsi & tombol salah untuk tab Restock).

### Tahap 3b — Inventaris: Restock & Menu/Resep (`80f513f`)
Restyle card rekomendasi restock (badge proyeksi hari + ikon tren) dan card menu (badge margin kritis, badge Stok Habis + ikon). Membersihkan CSS mati sisa sebelum Tahap 3a (`.ingredient-card`, `.ing-stats-row`, dll yang sudah tidak dipakai JSX manapun).

### Tahap 4a — POS: Grid Menu (`b9fd7a2`)
Menemukan bahwa blok `<style>` di akhir `pos/page.tsx` ternyata **mati** (`{false && <style>...}` — dead code, styling aktual selama ini bergantung pada class global `globals.css` yang masih sisa tema lama). Diaktifkan jadi `<style jsx>` scoped + redesign grid photography-first (placeholder ikon garpu-pisau di kotak besar, badge Habis jadi pill), filter kategori jadi pill filled. Fix bug `font-family: var(--font-outfit)` (undefined) di avatar lama.

### Tahap 4b — POS: Cart & Struk (`6537b64`)
Melanjutkan mengaktifkan sisa blok CSS mati untuk cart bottom sheet & modal struk. Payment selector (Tunai/Non-tunai) diubah dari 2 tombol terpisah jadi segmented control pill (pola sama seperti sub-tab Inventaris). Qty button jadi bulat. Badge "Tersimpan Offline" ditambah ikon (WCAG). **Diverifikasi end-to-end**: tambah item → ubah qty → pilih metode bayar → checkout → struk muncul (OQ-1: tetap perlu klik manual "Transaksi Baru", tidak auto-close) → keranjang kosong kembali.

### Tahap 4c — POS: Layout Cart Desktop (`5fa0838`)
Perubahan LAYOUT (bukan cuma styling): di desktop (≥1024px), keranjang belanja pindah dari bottom sheet jadi **panel tetap di sisi kanan (400px, sticky, scroll independen)**, tanpa perlu buka/tutup. Di mobile tetap bottom sheet seperti semula. Diimplementasikan dengan mengekstrak `CartPanelContent` (komponen kecil, dipakai identik di kedua tempat) supaya tidak ada duplikasi logic. Sempat ada bug urutan CSS cascade (floating cart bar tetap muncul di desktop karena rule `display:none` kalah source-order dengan rule lama) — diperbaiki dengan memindahkan rule ke akhir stylesheet.

### Tahap 5a — Dashboard: Ringkasan & Stats (`5cb0837`)
Banner ringkasan bisnis: ikon sparkle/AI di mockup **sengaja diganti ikon dokumen** karena teks ringkasan berasal dari template string database, bukan hasil LLM (menghindari kesan menyesatkan). 3 stat card ditambah ikon watermark besar transparan (uang/struk/dompet). List Menu Terlaris ditambah progress bar proporsional (lebar sesuai porsi terjual relatif terhadap menu #1) dan placeholder foto (pola sama seperti POS). Fix bug `font-family: var(--font-outfit)` lagi di `.top-rank`.

### Tahap 5b — Dashboard: Price Alert & Chart (`0f9b8b5`)
Card alert "Kenaikan Harga Bahan Baku" direstyle (border merah, badge + ikon tren wajib WCAG). `SimpleLineChart` (grafik SVG custom, **fungsional dengan data asli**, bukan komponen chart library) direstyle tanpa mengubah logic kalkulasi titik data sama sekali:
- Warna hardcode (`#cbd5e1`, `#64748b`, `#dc2626`, dst.) → token CSS variable.
- Garis lurus antar titik → smooth curve (quadratic bezier via titik tengah, murni cara gambar).
- Gradient fill cobalt tipis di bawah kurva.
- Tooltip hover jadi card gelap melayang (`--color-ink-deep` + drop-shadow SVG filter).

### Fix Debug Backend (`d543d25`)
Endpoint `-range` di `backend/routes/dashboard.ts` (`summary-range`, `top-menus-range`, `price-alerts-range`, `critical-margins-range`) mengembalikan 500 tanpa log — ditambahkan `console.error('[nama-endpoint]', e)` di tiap catch block untuk mempermudah debug ke depannya. Murni logging, tidak ada logic lain yang diubah.

### Brand & PWA Metadata (`ae6fd95`)
Ganti logo di Login & Sidebar dari SVG storefront generik ke `brand-icon.png` (aset baru). Perbaiki `theme_color`/`background_color` di `manifest.json` dari sisa warna oranye lama ke token Modern Merchant. **Bug tersembunyi yang ditemukan:** `themeColor` di `layout.tsx` (baik nilai lama maupun baru) **tidak pernah benar-benar ter-render** sebagai `<meta name="theme-color">` sama sekali — karena API metadata Next.js versi ini sudah memindahkan `themeColor`/`viewport` ke export `viewport` terpisah, bukan lagi di dalam `metadata`. Diperbaiki dengan memisahkan ke `export const viewport: Viewport = {...}` — sekarang meta tag benar-benar muncul di HTML (dikonfirmasi via inspeksi HTML mentah).

### Upload Gambar Menu — Backend (`399fe8b`)
- `multer` (disk storage) di `backend/routes/menus.ts`: destinasi `uploads/menus/`, nama file unik (`crypto.randomUUID()`), validasi tipe (`jpeg`/`png`/`webp`) & maksimal 2MB.
- `POST`/`PUT /menus` menerima `multipart/form-data`; field `image` opsional — update tanpa file baru tidak menghapus `imageUrl` lama.
- `express.static('/uploads')` di `index.ts` untuk serve file.
- `backend/uploads/` di-gitignore (kecuali `uploads/menus/.gitkeep`).
- Diuji manual lewat `curl`: upload sukses, validasi tipe & ukuran file ditolak dengan benar, update tanpa gambar tidak menghapus gambar lama.

### Upload Gambar Menu — Frontend (`a18bdec`)
- Form Tambah/Edit Menu (Inventaris): input file + **preview sebelum submit** (`URL.createObjectURL`), preview default ke gambar existing saat mode edit.
- `submitCreateMenu`/`submitEditMenu` diganti dari JSON body ke `FormData`.
- `apiFetch` (`lib/api.ts`) diperbaiki supaya tidak memaksa `Content-Type: application/json` saat body-nya `FormData` (biar browser set boundary multipart otomatis) — tanpa fix ini upload akan gagal diam-diam.
- `resolveAssetUrl()` helper baru untuk resolve URL gambar dari `API_URL`.
- Grid POS & Menu/Resep: tampilkan `<img>` asli kalau `menu.imageUrl` ada, fallback ke placeholder ikon garpu-pisau kalau tidak. (Card Menu/Resep sebelumnya tidak punya elemen foto sama sekali — jadi ditambahkan baru, bukan sekadar diganti.)
- Diuji end-to-end: edit menu asli → upload gambar → preview tampil sebelum submit → submit → gambar muncul benar di grid POS **dan** Menu/Resep, menu lain tanpa gambar tetap fallback.

### Fix Gambar Menu Terlaris (`a028a3a`)
Setelah fitur upload gambar menu selesai, gambar sudah muncul benar di grid POS & Menu/Resep tapi **tetap placeholder** di "Menu Terlaris Hari Ini" (Dashboard). Root cause: endpoint `/dashboard/top-menus` menghitung ranking murni dari agregasi `TransactionItem` (qty, harga), **tidak pernah join ke tabel `Menu`**, jadi `imageUrl` memang tidak pernah dikirim ke frontend. Fix: tambah `select: { menu: { select: { imageUrl: true } } }` di query, teruskan ke response. Kalkulasi ranking/qty/totalSales tidak diubah.

### Rekomendasi Harga di Price Alert (`ff7107d`)
Card "Kenaikan Harga Bahan Baku" awalnya cuma menampilkan HPP baru per menu terdampak, tanpa rekomendasi harga jual baru (padahal section Margin Kritis sudah punya fitur ini). Backend `/price-alerts` ditambah `sellingPrice` per menu terdampak; frontend hitung rekomendasi pakai **rumus yang sama persis** dengan Margin Kritis (`Math.ceil((hpp / (targetHpp/100)) / 1000) * 1000`), supaya konsisten satu aplikasi.

### Grafik Tren Penjualan Bulanan (`6f33d35`)
Fitur baru: bar chart SVG custom (`MonthlySalesChart`, konsisten gaya dengan `SimpleLineChart`) menampilkan pendapatan 6 bulan terakhir dari data transaksi asli (9.134 transaksi historis Jan–Jul 2026 di database), bulan dengan pendapatan tertinggi di-highlight hijau + label "Tertinggi", hover tooltip menampilkan revenue & jumlah transaksi asli. Endpoint baru `GET /dashboard/monthly-sales?months=N` (default 6) agregasi `prisma.transaction.aggregate` per bulan, pakai konvensi timezone GMT+7 yang sama seperti endpoint lain di file ini.

### Fix Ukuran Chart Dashboard (belum di-commit)
Setelah chart bulanan ditambahkan, muncul masalah ukuran berlapis di kedua chart SVG (`SimpleLineChart` "Tren Harga" dan `MonthlySalesChart` "Tren Penjualan Bulanan") — diselesaikan lewat beberapa iterasi:
1. **Bar chart kepotong/gepeng:** tinggi area & padding-top diperbesar supaya tooltip hover dan label "Tertinggi" tidak lagi tabrakan/kepotong di ujung atas chart.
2. **Chart melebar/meninggi berlebihan di desktop:** div pembungkus tadinya `width/height="100%"` tanpa batas, jadi tinggi ikut membesar proporsional mengikuti lebar card yang bisa >1000px di desktop. Diperbaiki dengan `className` (`price-trend-chart` / `monthly-sales-chart`) + CSS `aspect-ratio` yang match persis rasio `viewBox` masing-masing (500:170 dan 500:240), supaya rasio tampilan selalu konsisten di semua lebar layar, bukan tebak-tebak `min-height` px yang sempat salah (tidak match rasio asli, tetap menyebabkan letterbox).
3. **Bug tersembunyi #1 — CSS stale di dev server:** setelah rule `aspect-ratio` ditambah/diubah beberapa kali, Turbopack **tidak selalu meng-compile ulang `globals.css`** — CSS baru sempat hilang total dari bundle yang ter-serve ke browser (dikonfirmasi lewat inspeksi langsung file CSS terserve, bukan cuma baca source). Sama seperti bug caching metadata Next.js sebelumnya, solusinya `docker restart sipi_frontend`.
4. **Bug tersembunyi #2 — inline style menang atas CSS class:** div pembungkus `SimpleLineChart` masih punya inline `style={{ maxWidth: '100%' }}` sisa dari instruksi sebelumnya. Inline style **selalu menang** atas `max-width` di CSS class manapun (spesifisitas inline > stylesheet), jadi walau CSS sudah benar, chart tetap melebar penuh. Fix: hapus inline `maxWidth` supaya CSS class (`max-width: 640px`, disamakan dengan chart penjualan bulanan) yang berlaku.

Kedua chart sekarang: `max-width: 640px`, `aspect-ratio` sesuai `viewBox` asli masing-masing, sejajar & seukuran di semua breakpoint. Logic perhitungan data (`getX`, `getY`, `chartPoints`, `buildSmoothLinePath`, agregasi bar) tidak disentuh sama sekali di seluruh proses ini — murni CSS/JSX presentasional.

---

## Bug Lama yang Ditemukan & Diperbaiki Sepanjang Proses

Beberapa pola bug berulang ditemukan di banyak tahap berbeda (sisa dari tema lama "Premium Warm Bistro" sebelum Tahap 0, atau dari implementasi awal yang belum sempat diverifikasi):

1. **`var(--font-outfit)` stale reference** — variabel dihapus sejak Tahap 0, tapi masih dirujuk di beberapa tempat (login brand-name, POS menu-avatar, dashboard `.top-rank`) sehingga font jatuh ke default browser tanpa disadari.
2. **SVG icon tanpa `flex-shrink: 0`** — ikon di dalam flex container menyusut jadi titik kecil saat ruang sempit (pertama ditemukan di Sidebar, berulang di Inventaris/POS/Dashboard).
3. **Badge/alert tanpa ikon** — beberapa badge status (Stok Kritis, Naik %, Stok Habis, Tersimpan Offline) awalnya hanya mengandalkan warna, melanggar WCAG AA §2.1 DESIGN.md ("tidak boleh mengandalkan warna saja") — semua ditambahkan ikon.
4. **Blok `<style>` mati** — di `pos/page.tsx`, seluruh CSS custom sempat dibungkus `{false && <style>...}` sehingga styling aktual diam-diam bergantung pada `globals.css` versi lama.
5. **`themeColor`/`viewport` salah tempat** — di `layout.tsx`, tidak pernah benar-benar ter-render sebagai meta tag karena diletakkan di `metadata` bukan `viewport` (API Next.js versi terbaru).
6. **Tab content bocor** — grid bahan baku sempat tidak ter-scope ke kondisi tab yang benar di Inventaris.
7. **Endpoint agregasi tidak join ke tabel Menu** — `/dashboard/top-menus` melewatkan `imageUrl` karena cuma agregasi `TransactionItem`, tidak pernah `include`/`select` relasi `Menu`.
8. **Dev server (Turbopack) CSS stale** — perubahan `globals.css` kadang tidak ter-compile ulang ke bundle yang diserve, butuh restart container penuh untuk memastikan CSS baru benar-benar berlaku (bukan cuma cek source file).
9. **Inline style mengalahkan CSS class** — `style={{ maxWidth: ... }}` inline pada elemen JSX selalu menang atas rule `max-width` di stylesheet manapun (spesifisitas inline lebih tinggi), gampang lupa saat sebelumnya sempat diminta "lepas batasan lebar" lalu belakangan mau dibatasi lagi lewat CSS class.

---

## Yang Sengaja TIDAK Disentuh

Sesuai guardrail `AGENTS-UIUX.md` dan instruksi eksplisit tiap tahap:
- Semua logic bisnis: `handleSubmit`, `handleCheckout`, `addToCart`, kalkulasi HPP/margin, `recalculateMenuHpp`, cart/localStorage persistence.
- Endpoint API & skema database (`prisma/schema.prisma`) — kecuali penambahan kapabilitas upload gambar yang murni aditif.
- Modal-modal Inventaris (restock/price/edit/create/price-history/edit-menu/create-menu) — hanya disentuh kalau eksplisit diminta per tahap.
- `LaporanRangeSection`, `AiChatWidget`, Margin Kritis section — di luar scope tahap Dashboard.

---

## Rekomendasi Lanjutan

- Belum semua halaman diverifikasi print-stylesheet (`@media print`) pasca redesign Dashboard — sebaiknya dicek ulang saat fitur cetak laporan dipakai.
- File upload gambar menu belum ada mekanisme hapus otomatis saat menu dihapus (`DELETE /menus/:id`) — file lama jadi orphan di `uploads/menus/`. Di luar scope permintaan awal, tapi baik untuk dicatat sebagai technical debt.
- Belum ada halaman/komponen "Lainnya" (placeholder nav item `href="#"` di Sidebar/BottomNav) — masih menunggu keputusan fitur.
