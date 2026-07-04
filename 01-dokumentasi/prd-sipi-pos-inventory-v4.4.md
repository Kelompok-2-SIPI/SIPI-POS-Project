# /tasks/prd-sipi-pos-inventory.md
**Versi:** 4.6 — Laporan Rentang Tanggal & Export PDF
**Tanggal Revisi:** 4 Juli 2026

---

## 1. Introduction/Overview

Sistem Informasi POS dan Inventaris Stok F&B (SIPI) adalah **Progressive Web App (PWA)** yang dirancang khusus untuk UMKM Food & Beverage, dengan fokus utama pada penggunaan di perangkat smartphone. SIPI memecahkan dua masalah utama:

1. **Ketidaksinkronan pencatatan manual** antara laju penjualan dan sisa stok dapur.
2. **"Kebocoran margin"** akibat fluktuasi harga bahan baku di pasar tradisional, yang diatasi dengan penghitungan Harga Pokok Penjualan (HPP) harian secara otomatis.

### Catatan Aktor / User

Dalam konteks UMKM F&B skala kecil, **satu orang (Pemilik) umumnya merangkap semua peran** — kasir, admin gudang, dan pemilik sekaligus. Istilah *Kasir*, *Admin Gudang*, dan *Pemilik* dalam dokumen ini adalah **label fungsional** untuk mengelompokkan fitur, bukan entitas pengguna yang terpisah. Secara teknis, MVP menggunakan **1 akun hardcoded** (OQ-6) tanpa pembatasan akses berbasis peran — seluruh fitur dapat diakses dari akun yang sama.

---

## 2. Goals

| # | Tujuan | Indikator Keberhasilan Awal |
|---|--------|-----------------------------|
| G-1 | Mengeliminasi kesalahan pencatatan inventaris akibat proses manual | 0% selisih antara stok sistem dan fisik selama periode uji coba |
| G-2 | Menghadirkan perhitungan HPP otomatis secara *real-time* berbasis harga pasar terkini | 100% menu memiliki nilai HPP terhitung di sistem |
| G-3 | Menyediakan riwayat harga pasar bahan baku untuk mendukung keputusan pembelian pemilik | Minimal 80% bahan baku utama memiliki entri harga mingguan |

---

## 3. User Stories

### Kasir
- Sebagai Kasir, saya ingin menambahkan menu ke keranjang dan memproses pembayaran dengan cepat agar pelanggan tidak menunggu lama.
- Sebagai Kasir, saya ingin melihat struk digital di layar setelah transaksi berhasil agar saya dapat mengonfirmasi pesanan tanpa membutuhkan printer fisik.
- Sebagai Kasir, saya ingin dapat membatalkan transaksi yang sedang berjalan tanpa mempengaruhi data stok.
- Sebagai Kasir, saya ingin tombol menu yang stoknya habis ditampilkan dengan jelas (*greyed out*) agar saya tidak menjual menu yang tidak bisa dibuat.
- Sebagai Kasir, saya ingin aplikasi tetap bisa diakses saat koneksi internet terputus sejenak agar proses transaksi tidak terganggu.

### Admin Gudang
- Sebagai Admin Gudang, saya ingin memasukkan jumlah stok masuk dan harga beli harian agar sistem dapat memperbarui sisa inventaris dan nilai HPP secara akurat.
- Sebagai Admin Gudang, saya ingin mendapatkan peringatan visual pada bahan baku yang stoknya mendekati batas minimum agar saya bisa melakukan *restock* tepat waktu.
- Sebagai Admin Gudang, saya ingin mendapatkan rekomendasi otomatis dari AI tentang bahan baku apa yang perlu dibeli hari ini agar saya tidak perlu menghitung kebutuhan secara manual.

### Pemilik (Owner)
- Sebagai Pemilik, saya ingin melihat *dashboard* yang menyajikan laba kotor, HPP, dan menu terlaris secara otomatis agar saya dapat mengevaluasi kesehatan bisnis tanpa menghitung manual.
- Sebagai Pemilik, saya ingin mendapat peringatan pada menu yang HPP-nya mendekati atau melebihi harga jual agar saya bisa segera menyesuaikan harga atau mengganti bahan baku.
- Sebagai Pemilik, saya ingin bertanya kepada asisten AI tentang performa bisnis saya dalam bahasa sehari-hari agar saya tidak perlu membaca tabel angka satu per satu.
- Sebagai Pemilik, saya ingin melaporkan hasil belanja bahan baku ke asisten AI dalam bahasa natural (misal: *"tadi beli gula 2kg Rp18.000, tepung 1kg Rp12.500"*) agar sistem langsung memperbarui stok dan mencatat harga tanpa saya harus mengisi form secara manual.

---

## 4. Functional Requirements

### Modul POS / Kasir

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| FR-01 | Sistem harus memungkinkan Kasir menambahkan menu ke keranjang transaksi dan menghitung total harga secara otomatis. | Wajib |
| FR-02 | Sistem harus memproses transaksi menjadi status `Selesai` dan langsung menampilkan struk digital di layar dalam bentuk modal. | Wajib |
| FR-03 | Sistem harus mengurangi stok bahan baku secara otomatis berdasarkan relasi komposisi resep dari setiap menu yang terjual. | Wajib |
| FR-04 | Sistem harus menonaktifkan (*greyed out*) tombol menu di layar Kasir jika stok bahan baku untuk menu tersebut tidak mencukupi (≤ 0). | Wajib |
| FR-05 | Sistem harus memungkinkan Kasir membatalkan transaksi aktif dan mengosongkan keranjang tanpa memotong stok bahan baku. | Wajib |

### Modul Inventaris / Admin Gudang

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| FR-06 | Sistem harus memungkinkan Admin Gudang menambahkan kuantitas barang masuk (*restock*) ke total stok bahan baku yang ada. | Wajib |
| FR-07 | Sistem harus menampilkan label peringatan visual (label merah) pada daftar bahan baku jika kuantitasnya menyentuh atau berada di bawah batas stok minimal yang telah dikonfigurasi. | Wajib |
| FR-08 | Sistem harus menyediakan formulir bagi Admin Gudang untuk mencatat harga beli harian terbaru beserta tanggalnya ke dalam tabel riwayat harga pasar per bahan baku. | Wajib |
| FR-08a | Sistem harus menyajikan linimasa riwayat harga pasar bahan baku secara visual dalam bentuk modal untuk melacak perubahan harga secara detail. | Wajib |
| FR-08b | Sistem harus menyediakan antarmuka pengelola resep di tab "Menu & Resep" bagi Admin/Owner untuk menyetel komposisi bahan baku (nama & takaran) pada masing-masing menu. | Wajib |

### Modul HPP & Harga

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| FR-09 | Sistem harus menghitung ulang dan memperbarui nilai HPP pada setiap menu secara otomatis ketika terjadi penambahan atau perubahan harga pasar pada bahan baku yang digunakan dalam resep menu tersebut. | Wajib |
| FR-10 | Sistem harus menampilkan label peringatan `"Margin Kritis"` pada menu jika nilai HPP menu tersebut melebihi 80% dari Harga Jualnya. | Wajib |
| FR-10a | Sistem harus menampilkan rekomendasi harga jual baru secara otomatis pada menu ber-margin kritis, menargetkan rasio HPP ideal 50% dan dibulatkan ke kelipatan Rp1.000 terdekat. | Wajib |

### Modul Dashboard / Owner

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| FR-11 | Sistem harus menampilkan *Dashboard* Owner yang berisi: total pendapatan kotor, jumlah transaksi selesai, estimasi laba kotor, dan daftar menu terlaris—semua untuk periode hari ini. | Wajib |
| FR-14 | Sistem harus menampilkan ringkasan teks otomatis di bagian atas *Dashboard* menggunakan template string yang diisi data dari database. Format: `"Hari ini {n} transaksi, pendapatan Rp {x}, estimasi laba Rp {y}. Menu terlaris: {menu}."` | Wajib |
| FR-16 | Sistem harus menampilkan notifikasi peringatan kepada Owner ketika harga bahan baku naik lebih dari 20% dalam 7 hari terakhir, dihitung langsung dari tabel `ingredient_price_history`, disertai daftar menu terdampak dan nilai HPP barunya. | Wajib |
| FR-16a **(Baru v4.5)** | Sistem harus menampilkan mini-card per bahan baku yang memicu alert FR-16 di dalam kartu notifikasi Dashboard. Saat mini-card ditekan, sistem menampilkan grafik garis (*line chart*) tren harga 7 hari terakhir bahan baku tersebut, menggunakan data `ingredient_price_history` yang sama (endpoint `GET /ingredients/:id/price-history` yang sudah ada — tidak perlu skema atau endpoint baru). | Wajib |
| FR-19 **(Baru v4.6)** | Sistem harus menyediakan bagian "Laporan" terpisah dari ringkasan real-time Dashboard (yang tetap data hari ini per OQ-3), di mana Owner dapat memilih rentang tanggal custom (tanggal mulai & akhir bebas) untuk melihat laporan agregat periode tersebut. | Wajib |
| FR-20 **(Baru v4.6)** | Untuk rentang tanggal terpilih (FR-19), sistem harus menampilkan: total pendapatan, jumlah transaksi, estimasi laba, top 5 menu terlaris, daftar kenaikan harga bahan baku (dihitung dari `ingredient_price_history` — akurat untuk rentang manapun), dan daftar margin kritis (dihitung dari `menu_hpp_history` — lihat FR-21, akurat untuk rentang manapun karena berbasis snapshot historis, bukan nilai HPP/harga jual terkini). | Wajib |
| FR-21 **(Baru v4.6)** | Sistem harus mencatat snapshot `hpp` dan `selling_price` setiap menu ke tabel baru `menu_hpp_history` setiap kali: (a) HPP menu dihitung ulang otomatis (FR-09), atau (b) harga jual menu diubah manual oleh Owner/Admin (OQ-4). Snapshot ini menjadi sumber data satu-satunya yang membuat margin kritis historis (FR-20) bisa direkonstruksi akurat — tanpa ini, sistem hanya bisa menampilkan margin kritis kondisi terkini. | Wajib |
| FR-22 **(Baru v4.6)** | Sistem harus memungkinkan Owner mengekspor hasil laporan rentang tanggal (FR-20) sebagai file PDF, diunduh langsung dari halaman Dashboard. | Wajib |

### Modul Inventaris / Admin Gudang — Restock Cerdas

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| FR-15 | Sistem harus menampilkan daftar rekomendasi restock kepada Admin Gudang menggunakan rumus deterministik: bahan baku dengan `stock_qty / avg_consumption_7d < 2` (sisa stok < 2 hari) ditampilkan otomatis, diurutkan dari yang paling mendesak. | Wajib |

### Modul AI Assistant

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| FR-12 | Sistem harus menyediakan antarmuka chatbot berbasis teks yang dapat diakses dari halaman Dashboard dan halaman Inventaris, di mana Owner dapat mengajukan pertanyaan bisnis dalam bahasa natural dan mendapatkan jawaban ringkas dari LLM berdasarkan data aktual. | Wajib |
| FR-13 | LLM harus dapat menjawab pertanyaan seperti: "Menu apa yang paling laris minggu ini?", "Bahan baku mana yang harganya naik paling tinggi bulan ini?", dan "Berapa estimasi laba bersih hari ini?" | Wajib |
| FR-17 | Sistem harus memungkinkan Owner melaporkan hasil belanja bahan baku dalam bahasa natural melalui chatbot (contoh: *"tadi beli gula 2kg Rp18.000 dan tepung 1kg Rp12.500"*), kemudian LLM mem-parsing input tersebut dan sistem secara otomatis melakukan restock stok bahan baku serta mencatat harga beli harian — tanpa Owner perlu mengisi form secara manual. | Wajib |
| FR-18 | Sebelum mengeksekusi aksi restock/pencatatan harga dari input natural language, sistem harus menampilkan **konfirmasi parsing** kepada Owner (misal: *"Saya akan menambah stok gula 2kg dan mencatat harga Rp18.000/kg. Lanjutkan?"*) agar Owner dapat memverifikasi sebelum data diubah. | Wajib |

---

## 5. Non-Goals (Out of Scope)

Fitur-fitur berikut **tidak termasuk** dalam cakupan MVP ini dan tidak akan dikerjakan:

- Integrasi dengan *Payment Gateway* (GoPay, OVO, QRIS otomatis).
- Laporan keuangan akuntansi lengkap (neraca, arus kas, laporan multi-periode). **Catatan (v4.6):** ini merujuk ke laporan akuntansi formal (neraca, arus kas). Fitur Laporan rentang tanggal di FR-19–FR-22 adalah ringkasan operasional (pendapatan, laba estimasi, menu terlaris, alert harga/margin) — bukan laporan akuntansi, jadi tidak melanggar batasan ini.
- Fitur *loyalty point* dan manajemen *membership* pelanggan.
- Aplikasi *mobile native* (Android/iOS) — digantikan oleh PWA.
- Manajemen multi-outlet atau sistem *franchise*.
- Integrasi pencetakan struk fisik (*hardware printer* kasir).
- Alur registrasi dan autentikasi *multi-user* (MVP hanya menggunakan 1 akun *pilot project*).

---

## 6. Design Considerations

- **PWA — Mobile-First:** Aplikasi dibangun sebagai PWA dan dirancang **mobile-first**. Layout, ukuran teks, dan komponen diprioritaskan untuk layar 360–430px lebar terlebih dahulu sebelum menyesuaikan ke tampilan desktop.
- **Installable:** PWA harus memenuhi syarat `manifest.json` dan Service Worker agar dapat di-*install* ke layar utama (Home Screen) smartphone Android seperti aplikasi native.
- **Offline Capability:** Halaman POS/Kasir harus tetap dapat diakses dan berfungsi secara terbatas saat koneksi terputus, menggunakan strategi *cache-first* via Service Worker. Data transaksi offline disimpan sementara di IndexedDB dan disinkronkan ke server saat koneksi pulih.
- **Area Sentuh:** Seluruh tombol utama pada modul Kasir/POS harus menggunakan area sentuh (*tap target*) minimal **44×44px** untuk meminimalisir salah tekan di lingkungan dapur yang sibuk.
- **Performa di HP Kelas Menengah:** Target *Lighthouse Performance Score* ≥ 80 pada perangkat Android kelas menengah. Hindari animasi berat dan aset gambar tidak terkompresi.
- **Bahasa:** Menggunakan Bahasa Indonesia yang lugas dan menghindari jargon teknis basis data.
- **Aksesibilitas:** Mematuhi panduan **WCAG 2.1 Level AA**.
- **Kontras & Visibilitas di Lingkungan Dapur:** Gunakan tema dengan kontras warna tinggi dan ukuran font minimum 14px untuk teks body (16px untuk angka harga/total) agar tetap terbaca di kondisi pantulan cahaya dapur atau saat layar terkena uap/tangan basah.
- **Sistem Warna Semantik untuk Alert:** Seluruh label peringatan di sistem (stok menipis, margin kritis, kenaikan harga pasar) harus menggunakan palet warna yang konsisten dan berbeda agar tidak rancu satu sama lain, dan tidak boleh mengandalkan warna saja (harus disertai ikon dan/atau teks) demi aksesibilitas pengguna buta warna:
  | Jenis Alert | Warna | Ikon | Pemicu |
  |---|---|---|---|
  | Stok Kritis | Merah | ⚠️ | `stock_qty ≤ min_stock_qty` (FR-07) |
  | Margin Kritis | Oranye/Kuning | 🟠 | HPP > 80% harga jual (FR-10) |
  | Info Kenaikan Harga Pasar | Biru | 📈 | Kenaikan harga > 20% dalam 7 hari (FR-16) |
- **Indikator Status Offline/Sinkronisasi:** Karena transaksi dapat dibuat saat koneksi terputus (lihat §7 Offline Capability), antarmuka POS/Kasir harus menampilkan indikator status koneksi yang jelas (misal badge "Offline" di header) serta status sinkronisasi pada transaksi yang belum terkirim ke server (misal ikon "Menunggu Sinkron" pada struk/riwayat transaksi). Tanpa indikator ini, Kasir tidak punya cara mengetahui apakah transaksi sudah benar-benar tersimpan di server.
- **Empty State & First-Run:** Setiap halaman yang menampilkan data (grid menu POS, daftar bahan baku, dashboard) harus memiliki tampilan *empty state* yang jelas untuk kondisi belum ada data — misalnya saat UMKM baru pertama kali memakai SIPI dan belum menambahkan menu/bahan baku sama sekali. Empty state minimal berisi ilustrasi/ikon sederhana, teks penjelasan singkat, dan tombol aksi langsung (misal "+ Tambah Menu Pertama").
- **Komponen Visual Dashboard Owner:** Dashboard tidak ditampilkan sebagai tabel angka mentah, melainkan sebagai kartu ringkasan (*summary cards*) untuk pendapatan, jumlah transaksi, dan estimasi laba, ditambah daftar ranking sederhana (bukan tabel) untuk 5 menu terlaris. Ini selaras dengan kebutuhan Owner yang ingin memahami performa bisnis tanpa membaca tabel angka satu per satu (lihat User Stories — Pemilik).

---

## 7. Technical Considerations

### Tech Stack

| Layer | Pilihan | Catatan |
|-------|---------|---------|
| Frontend | Next.js (App Router) | Mendukung PWA via `next-pwa` atau `@ducanh2912/next-pwa`. Berjalan sebagai service terpisah, hanya melakukan fetch ke Backend API (tidak lagi pakai Next.js API Routes — lihat catatan revisi v4.2 di bawah). |
| Backend | Node.js + Express (atau NestJS) | **(Direvisi v4.2)** Dipisah menjadi service API mandiri, bukan lagi Next.js API Routes, agar Frontend dan Backend dapat di-*containerize* dan di-deploy secara independen. |
| Database | PostgreSQL | Direkomendasikan karena relasi menu ↔ resep ↔ bahan baku bersifat relasional |
| ORM | Prisma | Type-safe, migrasi mudah, kompatibel PostgreSQL, dijalankan di dalam container Backend |
| PWA | Service Worker + `manifest.json` | Gunakan Workbox untuk strategi cache |
| Offline Storage | IndexedDB (via `idb` library) | Untuk keranjang & transaksi sementara saat offline |
| Containerization | Docker + Docker Compose | **(Baru v4.2)** Frontend, Backend, dan Database masing-masing berjalan di container terpisah — lihat detail di bawah. |

> **Mengapa PostgreSQL, bukan MongoDB?** Relasi tabel Menu ↔ Resep ↔ Bahan Baku membutuhkan *join query* yang kompleks dan konsistensi data ACID. PostgreSQL lebih tepat untuk kebutuhan ini dibandingkan MongoDB yang skema-bebas.

> **Catatan Revisi v4.2:** Versi sebelumnya menggunakan Next.js API Routes yang menyatukan Frontend dan Backend dalam satu proses (monolith). Untuk mendukung arsitektur containerized yang memisahkan Frontend/Backend/Database secara tegas, Backend dipindahkan menjadi service Express/NestJS mandiri yang berkomunikasi dengan Frontend melalui REST API (lihat §9 API Endpoints). Frontend Next.js tetap dapat menggunakan Server Components untuk *server-side rendering*, namun seluruh akses data harus melalui pemanggilan ke Backend API, bukan akses langsung ke database.

### Arsitektur Containerized (Docker)

SIPI POS dijalankan sebagai **3 container terpisah** yang saling terhubung melalui jaringan internal Docker Compose:

```
┌─────────────────────────────────────────────────────────┐
│                     docker-compose                       │
│                                                           │
│  ┌──────────────┐      ┌──────────────┐   ┌────────────┐ │
│  │   frontend   │ ───▶ │   backend    │──▶│  database  │ │
│  │  (Next.js)   │ REST │ (Express/    │SQL│(PostgreSQL)│ │
│  │  port 3000   │ API  │  NestJS)     │   │ port 5432  │ │
│  │              │      │  port 4000   │   │            │ │
│  └──────────────┘      └──────────────┘   └────────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘
        ▲
        │ HTTPS (production, via reverse proxy)
   Browser Kasir/Admin/Owner
```

**Pembagian tanggung jawab per container:**

| Container | Image Dasar | Tanggung Jawab | Port (internal) |
|---|---|---|---|
| `frontend` | `node:20-alpine` (multi-stage build Next.js) | Render UI, PWA shell, Service Worker, panggil Backend API via `NEXT_PUBLIC_API_URL` | 3000 |
| `backend` | `node:20-alpine` | Business logic, validasi, kalkulasi HPP, autentikasi, akses Prisma ke database | 4000 |
| `database` | `postgres:16-alpine` | Penyimpanan data persisten, terhubung ke volume Docker agar data tidak hilang saat container restart | 5432 |

**Ketentuan implementasi:**
- Ketiga container didefinisikan dalam satu `docker-compose.yml` di root proyek, masing-masing dengan `Dockerfile` sendiri di folder `frontend/` dan `backend/`.
- Container `database` menggunakan **named volume** (`postgres_data`) agar data tidak hilang saat container di-*rebuild*.
- Komunikasi antar container menggunakan **nama service** sebagai hostname (misal Backend mengakses database via `postgresql://user:pass@database:5432/sipi`), bukan `localhost`.
- Variabel environment (kredensial database, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`) disimpan di file `.env` per service dan **tidak di-commit ke repository**.
- Backend harus mengaktifkan **CORS** untuk origin Frontend, karena keduanya kini berjalan sebagai service terpisah meski masih dalam satu jaringan Docker.
- Untuk pengembangan lokal, gunakan `docker-compose up` dengan *volume mount* kode sumber agar mendukung *hot-reload*; untuk produksi, gunakan multi-stage build agar image final lebih kecil.
- **Penting untuk Docker Build:**
  - File `package-lock.json` **wajib** di-commit untuk frontend dan backend karena Docker menggunakan perintah `npm ci` yang lebih cepat dan deterministik.
  - Jika file `package-lock.json` hilang atau tidak sinkron, lakukan *generate* secara lokal dengan perintah `npm install --package-lock-only --ignore-scripts` untuk menghindari gagal jaringan pada skrip *postinstall* (seperti Prisma engines).
  - Image backend (`node:alpine`) **wajib** di-install `openssl` via `RUN apk add --no-cache openssl` di dalam Dockerfile agar Prisma berjalan normal dan tidak *crash* dengan *PrismaClientInitializationError*.

---

### PWA Requirements

Untuk memenuhi kriteria *installable* PWA di Android:
- `manifest.json` harus memiliki `name`, `short_name`, `icons` (192px & 512px), `start_url`, `display: standalone`, dan `theme_color`.
- Service Worker harus terdaftar dan menggunakan strategi `StaleWhileRevalidate` untuk aset statis dan `NetworkFirst` untuk API calls.
- Aplikasi harus di-*serve* via HTTPS di production.

### Authentication

Untuk versi MVP / *Pilot Project*, alur registrasi yang kompleks **dilewati**. Gunakan **1 akun hardcoded** untuk langsung mendemonstrasikan sistem pada satu *tenant* UMKM. Pertimbangan untuk versi pasca-MVP:
- Implementasi JWT-based authentication
- Role-based access control (RBAC) untuk memisahkan akses Kasir, Admin Gudang, dan Owner

### Struk Digital

Struk transaksi di-*render* sebagai **Bottom Sheet Modal** (bukan modal tengah layar) agar lebih ergonomis di HP. Kasir dapat menunjukkan struk langsung dari layar perangkat.

### Persistensi Keranjang Belanja

Keranjang belanja aktif **disimpan otomatis di `localStorage`** browser. Keranjang dikosongkan setelah transaksi selesai atau dibatalkan eksplisit oleh Kasir.

---

## 8. Database Schema

### Diagram Relasi (Ringkas)

```
users
  └── transactions (1:N)
        └── transaction_items (1:N)
              └── menus (N:1)

menus
  └── recipe_items (1:N)
        └── ingredients (N:1)

ingredients
  └── ingredient_price_history (1:N)
  └── stock_movements (1:N)

menus
  └── menu_hpp_history (1:N) — (Baru v4.6)
```

### Tabel Utama

#### `users`
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | |
| `name` | VARCHAR(100) | |
| `role` | ENUM(`kasir`, `admin_gudang`, `owner`) | |
| `password_hash` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

#### `menus`
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | |
| `name` | VARCHAR(150) | Nama menu |
| `category` | VARCHAR(50) | Kategori untuk filter POS (misal: Minuman, Makanan, Snack) |
| `selling_price` | NUMERIC(12,2) | Harga jual |
| `hpp` | NUMERIC(12,2) | Dihitung otomatis dari resep |
| `is_available` | BOOLEAN | `false` jika stok bahan baku tidak cukup |
| `image_url` | TEXT | Opsional |
| `created_at` | TIMESTAMPTZ | |

#### `ingredients` (Bahan Baku)
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | |
| `name` | VARCHAR(150) | Nama bahan baku |
| `unit` | VARCHAR(20) | Satuan: gram, ml, pcs, dll. |
| `stock_qty` | NUMERIC(12,3) | Stok saat ini |
| `min_stock_qty` | NUMERIC(12,3) | Batas minimum stok (pemicu label merah) |
| `latest_price` | NUMERIC(12,2) | Harga beli terkini (disalin dari price history) |
| `created_at` | TIMESTAMPTZ | |

#### `recipe_items` (Komposisi Resep)
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | |
| `menu_id` | UUID (FK → menus) | |
| `ingredient_id` | UUID (FK → ingredients) | |
| `qty_used` | NUMERIC(12,3) | Jumlah bahan terpakai per 1 porsi menu |

#### `ingredient_price_history` (Riwayat Harga Pasar)
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | |
| `ingredient_id` | UUID (FK → ingredients) | |
| `price` | NUMERIC(12,2) | Harga beli pada tanggal tersebut |
| `recorded_at` | DATE | Tanggal pencatatan harga |
| `recorded_by` | UUID (FK → users) | |

#### `menu_hpp_history` (Riwayat HPP & Harga Jual — Baru v4.6)
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | |
| `menu_id` | UUID (FK → menus) | |
| `hpp` | NUMERIC(12,2) | Snapshot HPP menu pada saat dicatat |
| `selling_price` | NUMERIC(12,2) | Snapshot harga jual pada saat dicatat (harga jual bisa berubah manual — OQ-4 — jadi disnapshot juga agar rasio margin historis akurat) |
| `recorded_at` | TIMESTAMPTZ | Kapan snapshot dibuat — sama dengan waktu HPP direkalkulasi (FR-09) atau harga jual diubah (OQ-4) |

> **Catatan:** Tabel ini murni untuk kebutuhan laporan historis (FR-20/FR-21). Kolom `hpp` dan `selling_price` di tabel `menus` tetap jadi sumber nilai *real-time* untuk Dashboard utama (FR-10, OQ-17) dan tidak berubah perannya.

#### `stock_movements` (Riwayat Pergerakan Stok)
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | |
| `ingredient_id` | UUID (FK → ingredients) | |
| `type` | ENUM(`restock`, `usage`, `adjustment`) | |
| `qty_change` | NUMERIC(12,3) | Positif = masuk, negatif = keluar |
| `note` | TEXT | Opsional |
| `created_at` | TIMESTAMPTZ | |
| `created_by` | UUID (FK → users) | |

#### `transactions`
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | |
| `status` | ENUM(`pending`, `completed`, `cancelled`) | |
| `payment_method` | ENUM(`cash`, `non_cash`) | Dipilih Kasir sebelum konfirmasi |
| `total_price` | NUMERIC(12,2) | Total harga jual |
| `total_hpp` | NUMERIC(12,2) | Snapshot HPP total saat transaksi |
| `cashier_id` | UUID (FK → users) | |
| `created_at` | TIMESTAMPTZ | |
| `completed_at` | TIMESTAMPTZ | |

#### `transaction_items`
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | |
| `transaction_id` | UUID (FK → transactions) | |
| `menu_id` | UUID (FK → menus) | |
| `menu_name` | VARCHAR(150) | Snapshot nama menu (anti data drift) |
| `qty` | INTEGER | |
| `unit_price` | NUMERIC(12,2) | Snapshot harga jual saat transaksi |
| `unit_hpp` | NUMERIC(12,2) | Snapshot HPP saat transaksi |

---

## 9. API Endpoints

Base URL: `http://backend:4000/api/v1` (internal Docker network) — diakses Frontend melalui environment variable `NEXT_PUBLIC_API_URL`. Di production, Backend diekspos lewat reverse proxy/HTTPS, bukan diakses langsung dari internet.

### Auth
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/auth/login` | Login dengan username & password |
| POST | `/auth/logout` | Hapus sesi / invalidate token |

### Menus
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/menus` | Ambil semua menu + status ketersediaan |
| POST | `/menus` | Buat menu baru |
| PUT | `/menus/:id` | Update data menu (nama, harga jual) |
| DELETE | `/menus/:id` | Hapus menu |

### Ingredients (Bahan Baku)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/ingredients` | Ambil semua bahan baku + status stok |
| POST | `/ingredients` | Tambah bahan baku baru |
| PUT | `/ingredients/:id` | Update data bahan baku |
| POST | `/ingredients/:id/restock` | Tambah stok masuk (membuat stock_movement) |
| GET | `/ingredients/:id/price-history` | Ambil riwayat harga bahan baku |
| POST | `/ingredients/:id/price-history` | Catat harga beli harian baru |

### Recipes (Resep)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/menus/:id/recipe` | Ambil komposisi resep suatu menu |
| PUT | `/menus/:id/recipe` | Update komposisi resep (replace all) |

### Transactions
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/transactions` | Buat transaksi baru (status: `pending`) |
| POST | `/transactions/:id/complete` | Selesaikan transaksi → kurangi stok → hitung HPP |
| POST | `/transactions/:id/cancel` | Batalkan transaksi tanpa memotong stok |
| GET | `/transactions/:id` | Ambil detail transaksi (untuk struk digital) |

### Dashboard
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/dashboard/summary?date=YYYY-MM-DD` | Ringkasan: pendapatan, transaksi, estimasi laba + teks ringkasan template |
| GET | `/dashboard/top-menus?date=YYYY-MM-DD&limit=5` | Menu terlaris hari ini |
| GET | `/dashboard/critical-margins` | Daftar menu dengan label "Margin Kritis" |
| GET | `/dashboard/price-alerts` | Bahan baku dengan kenaikan harga > 20% dalam 7 hari + menu terdampak |
| GET | `/dashboard/restock-recommendations` | Bahan baku dengan sisa stok < 2 hari berdasarkan konsumsi rata-rata |
| GET | `/dashboard/summary-range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | **(Baru v4.6)** Ringkasan agregat rentang tanggal: pendapatan, transaksi, estimasi laba |
| GET | `/dashboard/top-menus-range?startDate=...&endDate=...&limit=5` | **(Baru v4.6)** Top menu terlaris dalam rentang tanggal |
| GET | `/dashboard/price-alerts-range?startDate=...&endDate=...` | **(Baru v4.6)** Kenaikan harga bahan baku dalam rentang tanggal, dari `ingredient_price_history` |
| GET | `/dashboard/critical-margins-range?startDate=...&endDate=...` | **(Baru v4.6)** Margin kritis dalam rentang tanggal, direkonstruksi dari snapshot `menu_hpp_history` (FR-21) |

### AI Assistant (Opsional)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/ai/chat` | Kirim pesan natural language → jawaban dari LLM (Q&A atau aksi restock/harga) |
| POST | `/ai/confirm-action` | Konfirmasi eksekusi aksi yang di-parse dari chat (restock + catat harga) |

---

## 10. Acceptance Criteria per Functional Requirement

| FR | Skenario Uji | Kriteria Lulus |
|----|-------------|----------------|
| FR-01 | Kasir menambahkan 2 menu berbeda ke keranjang | Total harga = harga menu A + harga menu B, tampil real-time |
| FR-02 | Kasir menekan "Bayar" setelah keranjang terisi | Status transaksi berubah jadi `completed`, modal struk muncul dalam < 3 detik |
| FR-03 | Transaksi "Es Teh Manis" (bahan: 200ml air, 5g teh, 15g gula) selesai | Stok air berkurang 200ml, teh 5g, gula 15g di database |
| FR-04 | Stok gula = 0, semua menu yang menggunakan gula di-query | Tombol menu tersebut tampil abu-abu dan tidak dapat ditekan |
| FR-05 | Kasir menekan "Batal Transaksi" saat keranjang berisi 3 item | Keranjang kosong, stok bahan baku tidak berubah |
| FR-06 | Admin Gudang menambahkan restock 5kg gula | `stock_qty` gula bertambah 5000g, `stock_movements` mencatat entri baru dengan type `restock` |
| FR-07 | `stock_qty` tepung = 200g, `min_stock_qty` tepung = 500g | Label merah "Stok Menipis" muncul di baris tepung pada halaman inventaris |
| FR-08 | Admin mencatat harga tepung = Rp18.000/kg hari ini | Entri baru muncul di `ingredient_price_history`, `latest_price` tepung diperbarui |
| FR-09 | Harga gula naik dari Rp15.000 menjadi Rp20.000/kg | HPP semua menu yang menggunakan gula dihitung ulang dan diperbarui otomatis |
| FR-10 | HPP "Pisang Goreng" = Rp8.500, harga jual = Rp10.000 (HPP = 85%) | Label "Margin Kritis" muncul pada kartu menu Pisang Goreng di dashboard |
| FR-11 | Owner membuka dashboard pada tanggal hari ini | Tampil: total pendapatan, jumlah transaksi, estimasi laba, dan 5 menu terlaris — semua data akurat dan termuat < 5 detik |
| FR-12 | Owner mengetik "Kenapa laba hari ini turun?" di kolom chat AI | LLM membalas dalam < 5 detik dengan jawaban berbasis data aktual (bukan jawaban generik), dalam Bahasa Indonesia; chatbot dapat diakses dari halaman Dashboard maupun Inventaris |
| FR-13 | Owner mengetik "Bahan baku apa yang harganya paling naik bulan ini?" | LLM menyebut nama bahan baku yang benar sesuai data `ingredient_price_history`, bukan hasil karangan |
| FR-17 | Owner mengetik "tadi beli gula 2kg Rp18.000 dan tepung 1kg Rp12.500" di chatbot | LLM mem-parsing input → sistem menampilkan konfirmasi: "Saya akan menambah stok gula 2kg dan mencatat harga Rp9.000/kg, serta tepung 1kg dengan harga Rp12.500/kg. Lanjutkan?" |
| FR-18 | Owner menekan "Ya, Lanjutkan" setelah konfirmasi parsing | Stok gula bertambah 2000g, stok tepung bertambah 1000g; entri harga baru tercatat di `ingredient_price_history` untuk kedua bahan baku; HPP menu terdampak dihitung ulang otomatis |
| FR-14 | Owner membuka dashboard, terdapat 12 transaksi dengan pendapatan Rp 850.000 dan laba Rp 320.000 | Teks ringkasan muncul otomatis di atas dashboard menggunakan template string yang terisi data akurat — tidak memanggil LLM API |
| FR-15 | Stok gula tersisa 150g, rata-rata konsumsi 7 hari = 200g/hari (sisa 0,75 hari) | Gula muncul di daftar restock dengan urutan teratas; bahan baku dengan stok > 2 hari tidak muncul dalam daftar |
| FR-16 | Harga tepung naik dari Rp12.000 menjadi Rp17.000/kg dalam 7 hari (naik 41%) | Notifikasi peringatan muncul untuk tepung, menampilkan persentase kenaikan dan daftar menu yang HPP-nya terdampak |
| FR-16a | Alert FR-16 aktif untuk tepung dan gula sekaligus; Owner menekan mini-card "tepung" di kartu alert | Muncul grafik garis tren harga tepung 7 hari terakhir (bukan gabungan dengan gula); mini-card gula tetap collapsed sampai ditekan terpisah |
| FR-19 | Owner membuka bagian Laporan di Dashboard, pilih tanggal mulai 1 Juni dan tanggal akhir 30 Juni 2026 | Sistem menampilkan laporan agregat periode 1–30 Juni tanpa mengubah ringkasan real-time Dashboard utama (yang tetap data hari ini) |
| FR-20 | Rentang 1–30 Juni dipilih; ada kenaikan harga gula tgl 10 Juni dan menu "Es Kopi Susu" sempat margin kritis tgl 15–20 Juni (sudah tidak kritis di harga jual saat ini) | Laporan menampilkan kenaikan harga gula (dari `ingredient_price_history`) dan tetap menampilkan "Es Kopi Susu" sebagai margin kritis periode itu (direkonstruksi dari `menu_hpp_history`), walau saat ini sudah tidak kritis |
| FR-21 | Harga bahan baku berubah sehingga HPP menu "Cappuccino" direkalkulasi (FR-09) pada 15 Juni | Entri baru muncul di `menu_hpp_history` untuk menu Cappuccino dengan `hpp` dan `selling_price` sesuai kondisi tanggal 15 Juni |
| FR-22 | Owner menekan tombol "Export PDF" setelah laporan rentang 1–30 Juni tampil | File PDF terunduh berisi ringkasan pendapatan/transaksi/laba, top 5 menu, kenaikan harga, dan margin kritis periode tersebut |

---

## 11. Non-Goals (Out of Scope)

Fitur-fitur berikut **tidak termasuk** dalam cakupan MVP ini dan tidak akan dikerjakan:

- Integrasi dengan *Payment Gateway* (GoPay, OVO, QRIS otomatis).
- Laporan keuangan akuntansi lengkap (neraca, arus kas, laporan multi-periode). **Catatan (v4.6):** ini merujuk ke laporan akuntansi formal (neraca, arus kas). Fitur Laporan rentang tanggal di FR-19–FR-22 adalah ringkasan operasional (pendapatan, laba estimasi, menu terlaris, alert harga/margin) — bukan laporan akuntansi, jadi tidak melanggar batasan ini.
- Fitur *loyalty point* dan manajemen *membership* pelanggan.
- Aplikasi *mobile native* (Android/iOS) — digantikan oleh PWA.
- Manajemen multi-outlet atau sistem *franchise*.
- Integrasi pencetakan struk fisik (*hardware printer* kasir).
- Alur registrasi dan autentikasi *multi-user* (MVP hanya menggunakan 1 akun *pilot project*).

---

## 12. LLM Integration

### Mengapa Perlu LLM?

LLM pada SIPI berfungsi sebagai **asisten bisnis bidirectional** — tidak hanya menjawab pertanyaan Owner, tetapi juga dapat menerima laporan belanja dalam bahasa natural dan mengeksekusinya langsung ke database (restock + catat harga). Ini memangkas alur kerja yang sebelumnya membutuhkan beberapa langkah form menjadi satu kali percakapan.

### Use Cases

| # | Use Case | FR | Nilai Bisnis |
|---|----------|----|-------------|
| UC-LLM-1 | **AI Business Q&A** — Owner bertanya performa bisnis, LLM menjawab berdasarkan data aktual | FR-12, FR-13 | Tinggi |
| UC-LLM-2 | **AI Inventory Input** — Owner lapor belanja via chat, sistem otomatis restock + catat harga | FR-17, FR-18 | Tinggi |

> **Catatan:** Ringkasan dashboard (FR-14), rekomendasi restock (FR-15), dan alert harga (FR-16) **tidak menggunakan LLM** — ketiganya tetap diimplementasikan sebagai logika backend deterministik.

### Arsitektur: Chatbot Bidirectional

Backend harus mampu mendeteksi **intent** dari pesan Owner — apakah pesan bersifat pertanyaan (Q&A) atau laporan aksi (inventory input) — lalu merespons sesuai:

```
Owner → Pesan → Backend SIPI
                     ↓
               Deteksi Intent via LLM
                     ↓
          ┌──────────┴──────────┐
       Q&A Intent          Action Intent
          ↓                    ↓
    Query DB              Parse entity
    Susun konteks         (bahan baku, qty, harga)
    LLM → jawaban              ↓
          ↓              Tampilkan konfirmasi
    Tampilkan ke Owner         ↓
                         Owner konfirmasi → Ya
                               ↓
                         Eksekusi: restock +
                         catat harga + hitung HPP
                               ↓
                         Tampilkan ringkasan hasil
```

**Endpoint yang dibutuhkan:**
- `POST /api/v1/ai/chat` — terima pesan, deteksi intent, kembalikan jawaban atau konfirmasi parsing
- `POST /api/v1/ai/confirm-action` — terima konfirmasi Owner, eksekusi aksi ke database

### Contoh Flow UC-LLM-2

```
Owner: "tadi beli gula 2kg Rp18.000 sama tepung 1kg Rp12.500"

Sistem: "Saya mendeteksi pembelian berikut:
  • Gula — tambah 2.000g, harga Rp9.000/kg
  • Tepung — tambah 1.000g, harga Rp12.500/kg
Lanjutkan? [Ya] [Batal]"

Owner: [Ya]

Sistem: "✅ Stok diperbarui.
  • Gula: +2.000g | HPP menu terdampak dihitung ulang
  • Tepung: +1.000g | HPP menu terdampak dihitung ulang"
```

### Penempatan UI (OQ-19)

Chatbot diakses via ikon 💬 floating button yang tersedia di:
- Halaman **Dashboard** — untuk pertanyaan performa bisnis (UC-LLM-1)
- Halaman **Inventaris** — untuk laporan belanja (UC-LLM-2)

Chatbot terbuka sebagai **bottom sheet** agar tidak mengganggu tampilan utama.

### Provider LLM

| Provider | Model | Harga Input | Harga Output | Keunggulan |
|----------|-------|------------|-------------|------------|
| **Google Gemini** | Gemini Flash | ~$0.10/M token | ~$0.40/M token | Paling murah, free tier tersedia |
| **Anthropic Claude** | Haiku 4.5 | ~$1.00/M token | ~$5.00/M token | Akurasi Bahasa Indonesia tinggi, prompt caching |
| **OpenAI** | GPT-4o Mini | ~$0.15/M token | ~$0.60/M token | Ekosistem SDK terlengkap |

**Rekomendasi:** Google Gemini Flash — paling hemat untuk konteks UMKM, free tier cukup untuk pilot.

### System Prompt

```
Kamu adalah asisten bisnis SIPI untuk [Nama UMKM].
Kamu punya DUA kemampuan utama:

1. MENJAWAB PERTANYAAN bisnis Owner berdasarkan data di bawah.
2. MEMPROSES LAPORAN BELANJA Owner — jika Owner menyebut nama bahan baku,
   kuantitas, dan harga, ekstrak informasi tersebut dan tampilkan konfirmasi
   sebelum mengeksekusi perubahan data.

=== DATA BISNIS HARI INI ({tanggal}) ===
Pendapatan: Rp {pendapatan} | Transaksi: {jumlah} | Laba: Rp {laba}

=== STOK BAHAN BAKU ===
{daftar bahan baku + stok saat ini}

=== STOK KRITIS ===
{bahan baku di bawah batas minimum}

=== MENU MARGIN KRITIS ===
{menu dengan HPP > threshold}

ATURAN:
- Jawab dalam Bahasa Indonesia yang singkat dan jelas.
- Jangan mengarang data di luar konteks di atas.
- Untuk laporan belanja, selalu tampilkan konfirmasi sebelum eksekusi.
- Jika input ambigu (misal kuantitas tidak jelas), tanyakan klarifikasi.
```

### Catatan Implementasi

- **Jangan kirim data sensitif** (password, detail pelanggan) ke LLM API.
- **Batasi konteks** — kirim data agregat, bukan raw transaction rows.
- **Validasi parsing** — sebelum eksekusi restock/harga, backend harus memvalidasi bahwa bahan baku yang disebut Owner ada di database. Jika tidak ditemukan, minta klarifikasi.
- **Tambahkan disclaimer** di UI bahwa jawaban AI bersifat estimasi.
- Fitur ini dapat dinonaktifkan via environment variable `ENABLE_AI_CHAT=false` tanpa mempengaruhi fungsi inti SIPI.

---

## 13. Success Metrics

| # | Metrik | Target |
|---|--------|--------|
| SM-1 | Waktu rata-rata proses satu transaksi kasir (dari pilih menu hingga struk muncul) | < 60 detik |
| SM-2 | Selisih antara stok di sistem dan stok fisik selama periode uji coba | 0 laporan selisih |
| SM-3 | Waktu muat *Dashboard* laporan penjualan harian | < 5 detik |
| SM-4 | Persentase bahan baku utama yang memiliki riwayat entri harga mingguan | ≥ 80% |
| SM-5 | Persentase menu di sistem yang memiliki nilai HPP terhitung | 100% |
| SM-6 | *Lighthouse PWA Score* di perangkat Android kelas menengah | ≥ 80 |
| SM-7 | Aplikasi dapat di-*install* ke Home Screen Android tanpa error | 100% berhasil |

---

## 14. Keputusan Desain & Klarifikasi

Semua pertanyaan terbuka telah dijawab dan dicatat sebagai keputusan final berikut:

| # | Keputusan | Detail |
|---|-----------|--------|
| OQ-1 ✅ | Struk digital tetap tampil hingga Kasir menekan tombol **"Transaksi Baru"** secara manual | Tidak ada auto-dismiss atau countdown. Tombol "Transaksi Baru" tampil jelas di bawah struk. |
| OQ-2 ✅ | Batas stok minimal dapat diatur oleh **Admin Gudang maupun Owner** | Formulir pengaturan `min_stock_qty` tersedia di halaman detail bahan baku, dapat diakses oleh keduanya. |
| OQ-3 ✅ **(Direvisi v4.6)** | Dashboard MVP hanya menampilkan data **hari ini** untuk ringkasan real-time utama | Ringkasan cards utama (FR-11, FR-14, OQ-17) tetap tanpa filter tanggal — selalu data hari ini. **Perubahan v4.6:** ditambahkan bagian **Laporan** terpisah (FR-19–FR-22) dengan custom date range + export PDF, tidak menggantikan ringkasan utama. |
| OQ-4 ✅ | Harga jual menu **dapat diubah langsung dari sistem** oleh Owner/Admin | Dibutuhkan halaman manajemen menu dengan form edit nama, harga jual, kategori, dan komposisi resep. |
| OQ-5 ✅ **(Direvisi v4.4)** | Fitur AI Assistant **diaktifkan dan menjadi Wajib** | FR-12, FR-13, FR-17, FR-18 diimplementasikan. LLM API key (Gemini Flash) wajib disiapkan. Chatbot bersifat bidirectional: Q&A performa bisnis + input belanja via natural language. |
| OQ-19 ✅ **(Baru v4.4)** | Penempatan chatbot AI | Chatbot diakses via ikon 💬 floating button di halaman Dashboard (untuk Q&A bisnis) dan halaman Inventaris (untuk laporan belanja). Terbuka sebagai bottom sheet. |
| OQ-20 ✅ **(Baru v4.4)** | Alur konfirmasi sebelum eksekusi aksi | Chatbot **wajib menampilkan konfirmasi parsing** sebelum mengeksekusi restock atau pencatatan harga ke database. Owner menekan tombol [Ya, Lanjutkan] untuk konfirmasi atau [Batal] untuk membatalkan. Tidak ada eksekusi otomatis tanpa konfirmasi. |
| OQ-6 ✅ | MVP menggunakan **1 akun hardcoded** yang dapat mengakses semua modul | Tidak ada pemisahan peran di level autentikasi untuk MVP. Semua halaman (POS, Inventaris, Dashboard) dapat diakses dari 1 login. |
| OQ-7 ✅ **(Direvisi v4.1)** | Navigasi antar modul menggunakan **bottom navigation bar** | **3 tab utama:** POS, Inventaris, Dashboard. Tab **Inventaris** memiliki 3 sub-tab toggle di bagian atas: **"Stok"** (default — daftar bahan baku + harga), **"Restock"** (rekomendasi restock dari FR-15), dan **"Menu & Resep"** (lihat OQ-12). Revisi dari versi sebelumnya yang menjadikan Restock sebagai tab ke-4 terpisah — digabung ke Inventaris agar bottom nav tidak terlalu padat di layar 360px dan mental model "semua hal soal stok ada di satu tempat" lebih konsisten. |
| OQ-8 ✅ | Kasir **dapat mengubah qty** item yang sudah ada di keranjang | Tombol `+` dan `−` tersedia di setiap baris item keranjang. Qty tidak bisa di bawah 1 (gunakan tombol hapus untuk menghapus item). |
| OQ-9 ✅ | Tampilan menu POS menggunakan **grid dengan filter kategori** sekaligus **fitur pencarian** | Default tampil semua menu dalam grid. Tab kategori (Semua / Minuman / Makanan / Snack / dll.) di atas grid untuk filter. Search bar di bagian atas untuk pencarian nama. Kategori dikelola di halaman manajemen menu. |
| OQ-10 ✅ | Metode pembayaran **Tunai dan Non-tunai dicatat manual** | Kasir memilih metode (Tunai / Non-tunai) sebelum konfirmasi bayar. Tidak ada integrasi payment gateway. Pilihan ini disimpan di kolom `payment_method` pada tabel `transactions`. |
| OQ-11 ✅ | Fitur Market Price Tracker diakses secara visual | Ditampilkan lewat ikon grafik 📈 pada harga bahan baku di halaman Inventaris yang membuka modal linimasa (timeline) riwayat harga harian. |
| OQ-12 ✅ | Antarmuka menyetel komposisi resep menu | Diintegrasikan di halaman **Inventaris** sebagai sub-tab **"Menu & Resep"**, sejajar dengan sub-tab "Stok" dan "Restock" (lihat OQ-7 v4.1). |
| OQ-13 ✅ | Rekomendasi penyesuaian harga jual baru | Ditampilkan otomatis di kartu Margin Kritis Dashboard Owner dan di bawah input harga jual modal editor resep (terhitung dinamis/interaktif). Menggunakan target HPP 50% dibulatkan ke kelipatan Rp1.000 terdekat. |
| OQ-14 ✅ **(Baru v4.1)** | Sistem warna untuk berbagai jenis alert | Merah = Stok Kritis, Oranye/Kuning = Margin Kritis, Biru = Info Kenaikan Harga Pasar. Setiap warna disertai ikon agar tidak mengandalkan warna saja (lihat §6 Design Considerations). |
| OQ-15 ✅ **(Baru v4.1)** | Indikator status offline & sinkronisasi transaksi | Header POS menampilkan badge "Offline" saat koneksi terputus. Transaksi yang dibuat offline diberi ikon "Menunggu Sinkron" hingga berhasil terkirim ke server. |
| OQ-16 ✅ **(Baru v4.1)** | Tampilan saat data masih kosong (*empty state*) | Setiap halaman dengan daftar data (grid menu POS, daftar bahan baku, dashboard) menampilkan ilustrasi/ikon, teks penjelasan, dan tombol aksi langsung (misal "+ Tambah Menu Pertama") saat belum ada data. |
| OQ-17 ✅ **(Baru v4.1, direvisi v4.5)** | Bentuk visual Dashboard Owner | Kartu ringkasan (*summary cards*) untuk pendapatan, transaksi, dan laba — bukan tabel angka. Menu terlaris ditampilkan sebagai daftar ranking sederhana. **Pengecualian (v4.5):** kartu alert kenaikan harga (FR-16) berisi mini-card per bahan baku yang dapat ditekan untuk membuka grafik garis tren harga 7 hari (FR-16a) — satu grafik per bahan baku, bukan grafik gabungan. |
| OQ-18 ✅ **(Baru v4.1)** | Kontras & ukuran teks untuk lingkungan dapur | Minimum font 14px (body) / 16px (harga & total), tema kontras tinggi agar tetap terbaca dengan pantulan cahaya dapur. |

### Implikasi ke Skema Database

Berdasarkan OQ-10, tambahkan kolom berikut ke tabel `transactions`:

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `payment_method` | ENUM(`cash`, `non_cash`) | Dipilih Kasir sebelum konfirmasi transaksi |

Berdasarkan OQ-9, tambahkan kolom berikut ke tabel `menus`:

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `category` | VARCHAR(50) | Kategori menu (misal: `Minuman`, `Makanan`, `Snack`) untuk filter di POS |

---

## 15. Changelog

### v4.6 (4 Juli 2026) — Laporan Rentang Tanggal & Export PDF
- **Menambahkan FR-19** — bagian "Laporan" terpisah di Dashboard dengan custom date range picker (tanggal mulai & akhir bebas), tidak menggantikan ringkasan real-time utama (yang tetap data hari ini, OQ-3).
- **Menambahkan FR-20** — laporan agregat rentang tanggal: pendapatan, transaksi, laba, top 5 menu, kenaikan harga bahan baku (akurat historis dari `ingredient_price_history`), dan margin kritis (akurat historis dari `menu_hpp_history` baru).
- **Menambahkan FR-21** — snapshot `hpp` + `selling_price` menu ke tabel baru `menu_hpp_history` setiap kali HPP direkalkulasi (FR-09) atau harga jual diubah (OQ-4). Tanpa ini margin kritis historis tidak bisa direkonstruksi akurat karena tabel `menus` cuma simpan nilai *real-time*.
- **Menambahkan FR-22** — export laporan rentang tanggal sebagai PDF, diunduh dari halaman Dashboard.
- **Merevisi OQ-3** — menegaskan ringkasan utama Dashboard tetap "hari ini saja" (tidak berubah), fitur Laporan (FR-19–22) adalah bagian terpisah yang ditambahkan, bukan pengganti.
- **Menambahkan tabel `menu_hpp_history`** ke skema database (§8) dan 4 endpoint baru ke §9: `/dashboard/summary-range`, `/dashboard/top-menus-range`, `/dashboard/price-alerts-range`, `/dashboard/critical-margins-range`.
- **Klarifikasi Non-Goals (§5/§11)** — menegaskan fitur Laporan ini adalah ringkasan operasional, bukan laporan akuntansi formal (neraca/arus kas) yang memang tetap di luar cakupan MVP.
- Ditempatkan sebagai **Sprint 7** tersendiri (lihat `00-koordinasi/sprint-7-laporan-export.md`), karena scope-nya (skema baru + 4 endpoint + date picker + PDF export) cukup besar untuk berdiri sendiri di luar Sprint 5 (chatbot) dan Sprint 6 (mobile testing) yang masih berjalan.

### v4.5 (4 Juli 2026) — Grafik Tren Harga di Kartu Alert Dashboard
- **Menambahkan FR-16a** — mini-card per bahan baku pada kartu alert kenaikan harga (FR-16) di Dashboard; ditekan untuk membuka grafik garis tren harga 7 hari terakhir. Menggunakan endpoint `GET /ingredients/:id/price-history` yang sudah ada, tidak ada skema/endpoint baru.
- **Merevisi OQ-17** — pengecualian eksplisit ditambahkan: Dashboard tetap berbasis summary cards + ranking, namun kartu alert harga kini boleh menampilkan grafik garis per bahan baku (bukan grafik gabungan/multi-line).
- Konfirmasi ruang lingkup: fitur ini bukan pengganti Market Price Tracker di Inventaris (OQ-11/FR-08a) — keduanya tetap ada, saling terpisah, dan menggunakan sumber data yang sama (`ingredient_price_history`).

### v4.1 (20 Juni 2026) — Revisi UI/Design Considerations
- Menambahkan spek sistem warna semantik untuk alert (stok kritis, margin kritis, info harga) — lihat §6 dan OQ-14.
- Menambahkan spek indikator status offline & sinkronisasi transaksi — lihat §6 dan OQ-15.
- Menambahkan spek empty state / first-run untuk halaman dengan data kosong — lihat §6 dan OQ-16.
- Menambahkan spek komponen visual Dashboard (summary cards, bukan tabel) — lihat §6 dan OQ-17.
- Menambahkan spek kontras & ukuran teks minimum untuk lingkungan dapur — lihat §6 dan OQ-18.
- **Merevisi struktur navigasi (OQ-7):** dari 4 tab (POS, Inventaris, Restock, Dashboard) menjadi 3 tab (POS, Inventaris, Dashboard), dengan Restock dan Menu & Resep menjadi sub-tab di dalam Inventaris. OQ-12 diperbarui mengikuti struktur ini.

### v4.2 (20 Juni 2026) — Revisi Arsitektur Containerized (Docker)
- **Merevisi Tech Stack (§7):** Backend dipisah dari Next.js API Routes menjadi service Express/NestJS mandiri, agar Frontend, Backend, dan Database dapat di-*containerize* secara independen.
- **Menambahkan bagian baru "Arsitektur Containerized (Docker)" (§7):** spesifikasi 3 container (frontend, backend, database), pembagian tanggung jawab, port, named volume untuk database, dan ketentuan environment variable & CORS.
- **Memperbarui Base URL API (§9):** dari `/api/v1` relatif menjadi `http://backend:4000/api/v1` yang mencerminkan komunikasi antar-container via Docker network, diakses Frontend lewat `NEXT_PUBLIC_API_URL`.
- Catatan: perubahan ini murni arsitektural (cara deploy & pemisahan service), tidak mengubah Functional Requirements, skema database, atau kontrak endpoint API yang sudah ada di §9.

### v4.4 (28 Juni 2026) — Implementasi AI Chatbot Bidirectional

- **Mengaktifkan FR-12 dan FR-13** — status diubah dari Opsional/pasca-MVP menjadi **Wajib**. Chatbot kini tersedia di Dashboard dan Inventaris (OQ-19).
- **Menambahkan FR-17** — Owner dapat melaporkan hasil belanja bahan baku dalam bahasa natural, LLM mem-parsing dan sistem mengeksekusi restock + pencatatan harga otomatis.
- **Menambahkan FR-18** — konfirmasi parsing wajib ditampilkan sebelum eksekusi aksi apapun ke database (OQ-20).
- **Merevisi §12 LLM Integration** — arsitektur diperbarui menjadi chatbot bidirectional dengan deteksi intent (Q&A vs Action), contoh flow UC-LLM-2, dan endpoint baru `/ai/confirm-action`.
- **Merevisi OQ-5** — AI Assistant sekarang aktif dan wajib. LLM API key Gemini Flash diperlukan.
- **Menambahkan OQ-19 dan OQ-20** — keputusan penempatan UI chatbot dan alur konfirmasi aksi.
- **Menambahkan User Story Owner** — lapor belanja via chatbot tanpa form manual.

### v4.3 (20 Juni 2026) — Panduan Troubleshooting Docker Build
- Menambahkan **Ketentuan Implementasi Build Docker (§7)** terkait penggunaan `npm ci`, kewajiban menyertakan `package-lock.json`, serta dependensi Alpine Linux (`openssl`) untuk Prisma Engine guna mencegah proses build yang *stuck* karena isu resolusi dependensi dan error inisialisasi di sistem berbasis *musl*.

### v4.4 (20 Juni 2026) — Peningkatan UX Kalkulator Harga Grosir & HMR Polling
- **Peningkatan UX Form Atur Harga:** Menambahkan antarmuka *Kalkulator Kemasan Grosir* menggunakan pola desain *segmented toggle* ("Per satuan" vs "Per Kemasan Beli"). Fitur ini mempermudah pengguna untuk otomatis menghitung harga per gram/ml dari pembelanjaan kemasan besar tanpa bantuan kalkulator eksternal.
- **Memperbaiki Isu Sinkronisasi File Docker (HMR):** Menambahkan `CHOKIDAR_USEPOLLING=true` dan `WATCHPACK_POLLING=true` pada file `docker-compose.yml` (service frontend) agar mekanisme Hot Module Replacement (HMR) milik Next.js tetap aktif mendeteksi perubahan file lokal, khususnya di arsitektur Docker Desktop for Windows / WSL2.
