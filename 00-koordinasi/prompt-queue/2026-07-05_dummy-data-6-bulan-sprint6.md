# Permintaan: Dummy Data Simulasi 6 Bulan (Sprint 6 - Mobile Testing)
**Dari:** Favian (Lead/Integrator)
**Tanggal:** 2026-07-05
**Untuk dieksekusi oleh:** Favian sendiri, via Claude Code / Gemini Antigravity IDE di `repo/backend`

---

## Isi Permintaan (format CTCO — untuk Claude Code/Software Engineer)

### Context
Modul: Backend — database seeding (Prisma + PostgreSQL)
File terkait: `repo/backend/prisma/schema.prisma` (source schema), `repo/backend/prisma/seed.ts` (seed dasar yang sudah ada — jangan diubah)
Tujuan: Sprint 6 (Mobile Testing & PWA Polish) butuh data yang terlihat seperti bisnis F&B UMKM yang sudah berjalan lama, supaya Dashboard, Laporan, Inventaris, dan AI Chatbot (Sprint 5) bisa diuji dengan kondisi realistis — bukan database kosong.

Skema yang relevan (dari `schema.prisma`):
- `User` (role: kasir, admin_gudang, owner)
- `Menu` (sellingPrice, hpp, category)
- `Ingredient` (stockQty, minStockQty, latestPrice)
- `RecipeItem` (relasi Menu ↔ Ingredient)
- `IngredientPriceHistory` (price, recordedAt, recordedBy)
- `StockMovement` (type: restock/usage/adjustment, qtyChange)
- `Transaction` (status, paymentMethod, totalPrice, totalHpp, cashierId, createdAt, completedAt)
- `TransactionItem` (qty, unitPrice, unitHpp)
- `MenuHppHistory` (hpp, sellingPrice, recordedAt)

### Task
Buat script seeder baru **terpisah** dari `seed.ts` (misal `repo/backend/prisma/seed-dummy.ts`, dijalankan manual via `tsx prisma/seed-dummy.ts`, jangan dimasukkan ke `prisma.seed` default di `package.json`), yang menghasilkan data dummy 6 bulan ke belakang dari tanggal hari ini (2026-01-05 s.d. 2026-07-05), dengan detail berikut:

**1. User tambahan**
- Pastikan ada minimal 2-3 kasir (`role: kasir`) selain `admin` yang sudah ada di `seed.ts`, supaya `cashierId` bervariasi.

**2. Ingredient & price history**
- Gunakan ingredient yang sudah ada dari `seed.ts` (jangan duplikat, cek `findFirst` dulu).
- Generate `IngredientPriceHistory` mingguan (±26 entri per ingredient) selama 6 bulan, dengan fluktuasi harga realistis (±5-15% per minggu, arah acak).
- Selipkan **2-3 momen kenaikan harga tajam (>20% dalam 7 hari)** di beberapa ingredient pada waktu acak, supaya FR-16 (notifikasi kenaikan harga bahan baku) punya data untuk diuji.
- Update `Ingredient.latestPrice` ke harga terakhir setelah loop selesai.

**3. Stock movements**
- Generate `restock` berkala (mis. tiap 5-10 hari sekali per ingredient) dengan qty yang masuk akal.
- Generate `usage` yang **konsisten dengan transaksi** yang dibuat di poin 4 (setiap transaksi completed harus mengurangi stok sesuai resep menu yang terjual — jangan buat angka acak yang tidak nyambung ke transaksi).
- Selipkan 1-2 momen stok menipis (di bawah `minStockQty`) di ingredient tertentu menjelang akhir periode, supaya FR-07 (label stok kritis) dan FR-15 (rekomendasi restock) punya kondisi untuk diuji.

**4. Transaksi & item transaksi — pola fluktuatif**
- Rentang: setiap hari dari 2026-01-05 sampai 2026-07-05 harus punya transaksi (jangan ada hari kosong, supaya grafik tren tidak putus).
- Volume per hari **fluktuatif**, campuran:
  - Hari sepi: ~10-30 transaksi
  - Hari sedang: ~30-60 transaksi
  - Hari ramai: ~60-100 transaksi
  - Distribusi: sebagian besar hari "sedang", akhir pekan (Sabtu-Minggu) cenderung lebih ke "ramai", tanggal tua/awal bulan (misal tanggal 25-31) cenderung lebih ke "sepi" — buat pola ini eksplisit di kode (bukan murni random), supaya kelihatan seperti pola bisnis nyata.
  - Boleh tambahkan 3-5 hari "spike" acak (mis. weekend gajian, event) dengan transaksi jauh di atas normal, dan 2-3 hari "sangat sepi" (mis. libur/hujan) untuk variasi.
  - Jam transaksi disebar mengikuti jam operasional realistis (puncak makan siang & sore/malam), bukan merata 24 jam.
- Tiap transaksi:
  - 1-4 `TransactionItem` per transaksi, menu dipilih acak dari menu yang tersedia (`isAvailable: true`), qty 1-3.
  - `status` mayoritas `completed`, selipkan sedikit (~3-5%) `cancelled` untuk realisme (dan pastikan transaksi `cancelled` **tidak** memotong stok, sesuai FR-05 — konsisten dengan behavior asli sistem).
  - `unitPrice`/`unitHpp` diambil dari harga menu **pada waktu itu** (pakai `hpp`/`sellingPrice` menu saat ini cukup, tidak perlu snapshot historis kecuali ingin akurasi tinggi).
  - `totalPrice`/`totalHpp` = jumlah dari item-nya.
  - `paymentMethod` campuran cash/non_cash.
  - `createdAt` dan `completedAt` diset manual sesuai tanggal simulasi (bukan `now()` — override default schema).

**5. Menu HPP history**
- Generate snapshot `MenuHppHistory` tiap kali ada perubahan harga ingredient yang signifikan mempengaruhi HPP menu (atau minimal snapshot bulanan per menu), supaya Sprint 7 (Laporan rentang tanggal, FR-21) punya data historis untuk ditampilkan.

**6. Performa & keterulangan (reproducibility)**
- Gunakan `Math.random()` dengan seed tetap (mis. library `seedrandom` atau implementasi PRNG sederhana) supaya hasil generate bisa direproduksi/didebug.
- Gunakan `createMany` (dengan `skipDuplicates` bila perlu) untuk transaksi/item dalam batch, supaya tidak lambat — total transaksi 6 bulan bisa mencapai ~6.000-10.000 baris, hindari insert satu-satu dalam loop tanpa batching.
- Bungkus proses generate harian dalam `prisma.$transaction` per batch (misal per bulan) supaya aman kalau proses terhenti di tengah jalan.
- Cetak progress log per bulan (`console.log`) supaya terlihat sedang berjalan.

### Constraint
- **Jangan ubah `schema.prisma`** — pakai struktur yang sudah ada.
- **Jangan ubah/timpa `seed.ts`** yang sudah ada — buat file baru terpisah agar seed dasar tetap bisa dipakai untuk reset environment bersih.
- Script harus **aman dijalankan di database development/testing**, bukan produksi — tambahkan guard sederhana (mis. cek `NODE_ENV !== 'production'` atau confirm prompt) sebelum insert data dalam jumlah besar.
- Idempotency: jalankan cek dasar (mis. hitung jumlah transaksi yang sudah ada) supaya tidak dobel data dummy kalau script dijalankan dua kali secara tidak sengaja — atau sediakan opsi flag `--reset` yang menghapus data dummy sebelumnya (transaksi, stock movement, price history yang dibuat script ini) sebelum generate ulang.
- Konsisten dengan constraint bisnis yang sudah ada di modul lain (stok tidak boleh negatif, HPP dihitung dari resep, dll — rujuk PRD `01-dokumentasi/prd-sipi-pos-inventory-v4.4.md` §Inventaris & HPP kalau ragu).
- Volume total jangan sampai membuat local Postgres container (docker-compose) kehabisan resource — kalau perlu, beri opsi environment variable untuk mempersempit rentang tanggal saat testing script-nya sendiri (mis. `DUMMY_MONTHS=1` untuk uji cepat sebelum jalankan full 6 bulan).

### Output Format
- File baru: `repo/backend/prisma/seed-dummy.ts`
- Instruksi cara menjalankan (ditambahkan sebagai komentar di atas file, atau section baru singkat di `repo/CHANGELOG.md` / README backend): `npx tsx prisma/seed-dummy.ts`
- Ringkasan singkat di akhir proses (console log): total transaksi dibuat, rentang tanggal, total stock movement, total price history entries.
