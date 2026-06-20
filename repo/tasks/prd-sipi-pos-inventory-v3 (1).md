# /tasks/prd-sipi-pos-inventory.md
**Versi:** 4.0 — FINAL (Siap untuk GSD Core)
**Tanggal Revisi:** 14 Juni 2026

---

## 1. Introduction/Overview

Sistem Informasi POS dan Inventaris Stok F&B (SIPI) adalah **Progressive Web App (PWA)** yang dirancang khusus untuk UMKM Food & Beverage, dengan fokus utama pada penggunaan di perangkat smartphone. SIPI memecahkan dua masalah utama:

1. **Ketidaksinkronan pencatatan manual** antara laju penjualan dan sisa stok dapur.
2. **"Kebocoran margin"** akibat fluktuasi harga bahan baku di pasar tradisional, yang diatasi dengan penghitungan Harga Pokok Penjualan (HPP) harian secara otomatis.

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

### Modul Inventaris / Admin Gudang — Restock Cerdas

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| FR-15 | Sistem harus menampilkan daftar rekomendasi restock kepada Admin Gudang menggunakan rumus deterministik: bahan baku dengan `stock_qty / avg_consumption_7d < 2` (sisa stok < 2 hari) ditampilkan otomatis, diurutkan dari yang paling mendesak. | Wajib |

### Modul AI Assistant (Opsional — pasca-MVP)

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| FR-12 | Sistem harus menyediakan antarmuka tanya-jawab berbasis teks di mana Owner dapat mengajukan pertanyaan bisnis dalam bahasa natural dan mendapatkan jawaban ringkas dari LLM. | Opsional |
| FR-13 | LLM harus dapat menjawab pertanyaan seperti: "Menu apa yang paling laris minggu ini?", "Bahan baku mana yang harganya naik paling tinggi bulan ini?", dan "Berapa estimasi laba bersih hari ini?" | Opsional |

---

## 5. Non-Goals (Out of Scope)

Fitur-fitur berikut **tidak termasuk** dalam cakupan MVP ini dan tidak akan dikerjakan:

- Integrasi dengan *Payment Gateway* (GoPay, OVO, QRIS otomatis).
- Laporan keuangan akuntansi lengkap (neraca, arus kas, laporan multi-periode).
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

---

## 7. Technical Considerations

### Tech Stack

| Layer | Pilihan | Catatan |
|-------|---------|---------|
| Frontend | Next.js (App Router) | Mendukung PWA via `next-pwa` atau `@ducanh2912/next-pwa` |
| Backend | Next.js API Routes / Node.js Express | API Routes cukup untuk MVP; pisahkan Express jika skala membesar |
| Database | PostgreSQL | Direkomendasikan karena relasi menu ↔ resep ↔ bahan baku bersifat relasional |
| ORM | Prisma | Type-safe, migrasi mudah, kompatibel PostgreSQL |
| PWA | Service Worker + `manifest.json` | Gunakan Workbox untuk strategi cache |
| Offline Storage | IndexedDB (via `idb` library) | Untuk keranjang & transaksi sementara saat offline |

> **Mengapa PostgreSQL, bukan MongoDB?** Relasi tabel Menu ↔ Resep ↔ Bahan Baku membutuhkan *join query* yang kompleks dan konsistensi data ACID. PostgreSQL lebih tepat untuk kebutuhan ini dibandingkan MongoDB yang skema-bebas.

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

Base URL: `/api/v1`

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

### AI Assistant (Opsional)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/ai/chat` | Kirim pertanyaan bisnis natural language → jawaban dari LLM |

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
| FR-12 | Owner mengetik "Kenapa laba hari ini turun?" di kolom chat AI | LLM membalas dalam < 5 detik dengan jawaban berbasis data aktual (bukan jawaban generik), dalam Bahasa Indonesia |
| FR-13 | Owner mengetik "Bahan baku apa yang harganya paling naik bulan ini?" | LLM menyebut nama bahan baku yang benar sesuai data `ingredient_price_history`, bukan hasil karangan |
| FR-14 | Owner membuka dashboard, terdapat 12 transaksi dengan pendapatan Rp 850.000 dan laba Rp 320.000 | Teks ringkasan muncul otomatis di atas dashboard menggunakan template string yang terisi data akurat — tidak memanggil LLM API |
| FR-15 | Stok gula tersisa 150g, rata-rata konsumsi 7 hari = 200g/hari (sisa 0,75 hari) | Gula muncul di daftar restock dengan urutan teratas; bahan baku dengan stok > 2 hari tidak muncul dalam daftar |
| FR-16 | Harga tepung naik dari Rp12.000 menjadi Rp17.000/kg dalam 7 hari (naik 41%) | Notifikasi peringatan muncul untuk tepung, menampilkan persentase kenaikan dan daftar menu yang HPP-nya terdampak |

---

## 11. Non-Goals (Out of Scope)

Fitur-fitur berikut **tidak termasuk** dalam cakupan MVP ini dan tidak akan dikerjakan:

- Integrasi dengan *Payment Gateway* (GoPay, OVO, QRIS otomatis).
- Laporan keuangan akuntansi lengkap (neraca, arus kas, laporan multi-periode).
- Fitur *loyalty point* dan manajemen *membership* pelanggan.
- Aplikasi *mobile native* (Android/iOS) — digantikan oleh PWA.
- Manajemen multi-outlet atau sistem *franchise*.
- Integrasi pencetakan struk fisik (*hardware printer* kasir).
- Alur registrasi dan autentikasi *multi-user* (MVP hanya menggunakan 1 akun *pilot project*).

---

## 12. LLM Integration Recommendations

### Mengapa Perlu LLM?

LLM pada SIPI bukan fitur inti, melainkan **lapisan nilai tambah** pasca-MVP untuk membantu Owner UMKM yang tidak terbiasa membaca laporan tabel menganalisis bisnisnya dengan pertanyaan natural seperti: *"Kenapa laba bulan ini turun?"* atau *"Bahan baku apa yang perlu segera dibeli?"*

### Use Cases yang Direkomendasikan

| # | Use Case | Nilai Bisnis | Kesulitan Implementasi |
|---|----------|-------------|----------------------|
| UC-LLM-1 | **AI Business Q&A** — Owner bertanya dalam bahasa natural, LLM menjawab berdasarkan data transaksi & stok terkini | Tinggi | Sedang |

> **Catatan:** Fitur ringkasan dashboard (UC-LLM-2), rekomendasi restock (UC-LLM-3), dan peringatan harga (UC-LLM-4) **tidak menggunakan LLM** — ketiganya diimplementasikan sebagai logika backend deterministik (query SQL + template string) karena outputnya terstruktur dan dapat dihitung langsung dari data. Lihat FR-14, FR-15, FR-16.

### Arsitektur Implementasi yang Direkomendasikan: RAG Sederhana

Jangan kirim seluruh database ke LLM. Gunakan pola **RAG (Retrieval-Augmented Generation)** ringan:

1. Saat Owner mengajukan pertanyaan, backend **query database** untuk mengambil data relevan (misalnya: data transaksi 7 hari terakhir, stok saat ini, riwayat harga).
2. Data tersebut dijadikan **konteks terstruktur** dalam bentuk teks ringkas.
3. Konteks + pertanyaan dikirim ke **LLM API**.
4. Jawaban LLM ditampilkan ke Owner.

```
Owner → Pertanyaan → Backend SIPI
                          ↓
                    Query DB (data relevan)
                          ↓
                    Susun prompt + konteks
                          ↓
                    LLM API (Claude Haiku / Gemini Flash)
                          ↓
                    Jawaban → Owner
```

### Perbandingan Provider LLM

| Provider | Model Budget | Harga Input | Harga Output | Keunggulan untuk SIPI |
|----------|-------------|------------|-------------|----------------------|
| **Anthropic Claude** | Haiku 4.5 | ~$1.00/M token | ~$5.00/M token | Instruksi bahasa Indonesia akurat, cache prompt 90% lebih murah |
| **Google Gemini** | Gemini Flash | ~$0.10/M token | ~$0.40/M token | Paling murah, gratis tier tersedia, cocok untuk volume tinggi |
| **OpenAI** | GPT-5 Mini | ~$0.25/M token | ~$2.00/M token | Ekosistem SDK terlengkap |

### Rekomendasi untuk SIPI

**Pilihan utama: Google Gemini Flash**

Untuk konteks UMKM dengan budget terbatas, Gemini Flash adalah pilihan paling hemat. Token yang dibutuhkan per query kecil (konteks data bisnis ringkas + pertanyaan ≈ 500–2.000 token), sehingga biaya bulanan bisa sangat rendah. Gemini juga memiliki *free tier* yang cukup untuk tahap pilot project.

**Pilihan alternatif: Claude Haiku 4.5**

Jika akurasi pemahaman instruksi berbahasa Indonesia menjadi prioritas utama dan tim sudah familiar dengan Anthropic API, Claude Haiku 4.5 adalah alternatif yang solid dengan fitur *prompt caching* yang dapat memangkas biaya secara signifikan pada konteks sistem yang berulang.

### Contoh Prompt Sistem (System Prompt)

```
Kamu adalah asisten bisnis SIPI untuk [Nama UMKM].
Tugasmu membantu Owner memahami performa bisnisnya berdasarkan data berikut:

=== DATA HARI INI ({tanggal}) ===
Total Pendapatan: Rp {pendapatan}
Total Transaksi: {jumlah} transaksi
Estimasi Laba Kotor: Rp {laba}

=== 5 MENU TERLARIS ===
{daftar menu}

=== STOK KRITIS ===
{daftar bahan baku di bawah batas minimum}

=== MENU MARGIN KRITIS ===
{daftar menu dengan HPP > 80% harga jual}

Jawab pertanyaan Owner dengan singkat, jelas, dan dalam Bahasa Indonesia.
Fokus pada informasi yang actionable. Jangan mengarang data di luar konteks di atas.
```

### Catatan Implementasi

- **Jangan kirim data sensitif** (password, detail pelanggan) ke LLM API eksternal.
- **Batasi panjang konteks** yang dikirim — cukup data agregat, bukan raw transaction rows.
- **Tambahkan disclaimer** di UI bahwa jawaban AI bersifat estimasi dan perlu diverifikasi.
- Fitur ini bersifat **opsional dan dapat dinonaktifkan** tanpa mempengaruhi fungsi inti SIPI.

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
| OQ-3 ✅ | Dashboard MVP hanya menampilkan data **hari ini** | Tidak ada filter tanggal untuk MVP. Filter minggu/bulan dipertimbangkan pasca-MVP. |
| OQ-4 ✅ | Harga jual menu **dapat diubah langsung dari sistem** oleh Owner/Admin | Dibutuhkan halaman manajemen menu dengan form edit nama, harga jual, kategori, dan komposisi resep. |
| OQ-5 ✅ | Fitur AI Assistant **tidak diaktifkan di MVP** — murni pasca-MVP | LLM API key tidak perlu disiapkan untuk MVP. FR-12 dan FR-13 tidak dibangun di fase ini. |
| OQ-6 ✅ | MVP menggunakan **1 akun hardcoded** yang dapat mengakses semua modul | Tidak ada pemisahan peran di level autentikasi untuk MVP. Semua halaman (POS, Inventaris, Dashboard) dapat diakses dari 1 login. |
| OQ-7 ✅ | Navigasi antar modul menggunakan **bottom navigation bar** | 4 tab: POS, Inventaris, Restock, Dashboard. Setiap tab adalah halaman terpisah. |
| OQ-8 ✅ | Kasir **dapat mengubah qty** item yang sudah ada di keranjang | Tombol `+` dan `−` tersedia di setiap baris item keranjang. Qty tidak bisa di bawah 1 (gunakan tombol hapus untuk menghapus item). |
| OQ-9 ✅ | Tampilan menu POS menggunakan **grid dengan filter kategori** sekaligus **fitur pencarian** | Default tampil semua menu dalam grid. Tab kategori (Semua / Minuman / Makanan / Snack / dll.) di atas grid untuk filter. Search bar di bagian atas untuk pencarian nama. Kategori dikelola di halaman manajemen menu. |
| OQ-10 ✅ | Metode pembayaran **Tunai dan Non-tunai dicatat manual** | Kasir memilih metode (Tunai / Non-tunai) sebelum konfirmasi bayar. Tidak ada integrasi payment gateway. Pilihan ini disimpan di kolom `payment_method` pada tabel `transactions`. |
| OQ-11 ✅ | Fitur Market Price Tracker diakses secara visual | Ditampilkan lewat ikon grafik 📈 pada harga bahan baku di halaman Inventaris yang membuka modal linimasa (timeline) riwayat harga harian. |
| OQ-12 ✅ | Antarmuka menyetel komposisi resep menu | Diintegrasikan di halaman **Gudang & Inventaris** menggunakan sub-tab toggle **"Menu & Resep"** di bagian atas untuk mempertahankan batasan navigasi 4 tab. |
| OQ-13 ✅ | Rekomendasi penyesuaian harga jual baru | Ditampilkan otomatis di kartu Margin Kritis Dashboard Owner dan di bawah input harga jual modal editor resep (terhitung dinamis/interaktif). Menggunakan target HPP 50% dibulatkan ke kelipatan Rp1.000 terdekat. |

### Implikasi ke Skema Database

Berdasarkan OQ-10, tambahkan kolom berikut ke tabel `transactions`:

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `payment_method` | ENUM(`cash`, `non_cash`) | Dipilih Kasir sebelum konfirmasi transaksi |

Berdasarkan OQ-9, tambahkan kolom berikut ke tabel `menus`:

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `category` | VARCHAR(50) | Kategori menu (misal: `Minuman`, `Makanan`, `Snack`) untuk filter di POS |
