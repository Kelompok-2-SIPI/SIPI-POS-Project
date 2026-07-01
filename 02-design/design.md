# Design System — SIPI POS

**Untuk:** Revisi UI menyeluruh, multi-modul, multi-UMKM kuliner (kafe, resto, warmindo, dll)
**Prinsip dasar:** Ini alat kerja operasional (dipakai kasir sambil ada antrian, dipegang staff dapur, dilihat owner buat data bisnis) — bukan halaman marketing. Kecepatan baca & tap lebih penting dari dekorasi. Setiap toko yang pakai SIPI harus bisa "menempelkan" identitasnya sendiri tanpa app-nya terasa generik atau kosong.

---

## 0. Signature element

**Motif "kertas struk thermal"** — garis putus-putus (dashed) khas sobekan kertas struk, dipakai konsisten sebagai pemisah section, bukan cuma di halaman struk. Ini elemen yang secara langsung merujuk ke dunia kasir/POS (bukan hiasan generik), dan jadi benang merah visual di semua modul: divider di card laporan, di ringkasan checkout, di detail pesanan. Kecil, konsisten, dan bermakna — bukan dekorasi kosong.

---

## 1. Warna

**Masalah yang diselesaikan:** UI lama (`Warm Bistro` — terracotta/amber) ngunci ke satu tema. Sekarang app dipakai lintas UMKM (Gacoan pakai warna Gacoan, warmindo pinggir jalan pakai warna sendiri), jadi warna dipecah jadi 2 lapis:

### Lapis 1 — Base netral (fixed, sama untuk semua toko) — ✅ DIKUNCI setelah eksplorasi visual
| Token | Hex | Fungsi |
|---|---|---|
| `--bg` | `#FFFFFF` | Background halaman — putih bersih |
| `--surface` | `#FAF9F7` | Card, sheet, modal — "greige" (abu bercampur hangat), beda tipis dari `--bg` biar card kebaca sebagai objek terpisah tanpa perlu shadow berat |
| `--surface-fallback` | `#E3E2E9` | Dudukan foto/ikon fallback (lavender-gray netral, dipakai HANYA saat menu belum ada foto — bukan warna brand). Untuk fallback bernuansa brand (mis. avatar toko), pakai `--brand-tint` (`#E6EFEC`) |
| `--surface-sunken` | `#F3F2EE` | Input field |
| `--border` | `#ECEAE5` | Border tipis card (opsional, dipakai saat kontras `--surface` vs `--bg` kurang jelas) |
| `--ink` | `#1A1917` | Teks utama |
| `--ink-soft` | `#68675F` | Teks sekunder |
| `--ink-faint` | `#9B9A90` | Teks tersier / placeholder |

**Gaya kartu:** clean — border tipis, TANPA shadow berat/glassmorphism. Shadow lembut (`--shadow-sm`) hanya dipakai di elemen yang benar-benar butuh "mengambang" di atas konten lain: CTA utama (misal tombol Bayar/Checkout), floating cart bar, bottom nav — bukan di semua card.

**Foto produk (Menu, Kasir):** kalau menu punya foto, foto langsung mengisi area gambar (rounded), TIDAK pakai `--surface-fallback`. `--surface-fallback` + inisial cuma muncul kalau menu belum ada foto.

### Lapis 2 — Brand accent (dinamis, dari pengaturan Toko) — ✅ DIKUNCI FINAL
| Token | Default (demo) | Fungsi |
|---|---|---|
| `--brand` | `#396330` (Forest green muted) | Aksen toko: tombol primer, chip aktif, harga, link "Lihat Semua", nav aktif (icon + circle solid) |
| `--brand-hover` | `#2E4F26` (auto -8% lightness) | Hover state |
| `--brand-tint` | `#E6EFEC` (mint lembut) | Dudukan ikon fallback, banner promo/highlight, badge terkait brand |

> **Kenapa bukan hijau cerah kayak Gojek (`#00AA13`)?** Warna itu sangat identik dengan brand Gojek di mata orang Indonesia — dipakai di presentasi akademik/expo berisiko dianggap niru, bukan orisinal. `#396330` tetap dalam keluarga hijau (fresh, cocok F&B) tapi lebih muted/gelap, cukup beda supaya nggak langsung diasosiasikan ke satu brand tertentu.

> **Prinsip pemakaian (penting, jangan dilanggar):** brand color dipakai SEDIKIT dan SPESIFIK — teks link, tombol utama, state aktif, badge kecil. JANGAN jadi warna fill besar di card/section secara default. Card & section pakai netral (putih/greige), biar brand color tetap terasa "istimewa" saat muncul, bukan warna yang di mana-mana.

### Warna status tambahan dari referensi (di luar brand, tetap fixed universal)
| Token | Hex | Fungsi |
|---|---|---|
| `--rating` | `#F5A623` (amber/kuning) | Rating bintang |
| `--favorite` | `#E63946` (merah) | Ikon suka/favorit — beda dari `--danger` supaya nggak rancu sama alert stok kritis |

### Status colors (FIXED — tidak berubah oleh brand, ini bahasa universal aplikasi, sesuai keputusan governance lama)
| Token | Hex | Arti |
|---|---|---|
| `--danger` | `#DC2626` | Stok kritis / habis |
| `--danger-tint` | `#FEF2F2` | |
| `--warning` | `#D97706` | Margin kritis |
| `--warning-tint` | `#FFFBEB` | |
| `--info` | `#2563EB` | Info harga / notifikasi netral |
| `--info-tint` | `#EFF6FF` | |
| `--success` | `#059669` | Transaksi sukses, status selesai |
| `--success-tint` | `#ECFDF5` | |

**Aturan:** brand accent TIDAK PERNAH dipakai untuk status (jangan sampai toko pilih warna merah sebagai brand-nya terus alert stok kritis jadi ketutup/rancu). Kalau brand color owner ternyata bentrok kontras dengan status color, status color menang — konsistensi lintas-toko lebih penting daripada personalisasi.

---

## 2. Tipografi

| Peran | Font | Alasan |
|---|---|---|
| Display (judul, harga besar, angka dashboard) | **Space Grotesk** (600/700) | Geometris, tegas, enak buat angka besar (harga, total, statistik) — beda dari Outfit yang dipakai kompetitor kebanyakan |
| Body / UI (label, teks, tombol) | **Plus Jakarta Sans** (400/500/600) | Tetap dipakai dari versi lama — legible di layar kecil, mendukung karakter Indonesia dengan baik, nggak perlu ganti (biar transisi lebih murah) |

**Skala:**
```
--text-xs:   11px   (meta/caption, timestamp)
--text-sm:   13px   (label, teks sekunder)
--text-base: 14px   (body, minimum sesuai governance)
--text-md:   16px   (harga, angka penting — minimum sesuai governance)
--text-lg:   20px   (judul card/section)
--text-xl:   28px   (judul halaman, total checkout)
--text-2xl:  36px   (angka besar dashboard/BI)
```

---

## 3. Layout & Navigasi (adaptif per device)

```
Mobile (<768px)                 Tablet/Laptop (≥768px)
┌─────────────────┐             ┌───┬─────────────────────┐
│     Header       │             │ S │       Header         │
├─────────────────┤             │ i ├─────────────────────┤
│                   │             │ d │                       │
│      Konten       │             │ e │       Konten          │
│                   │             │ b │                       │
├─────────────────┤             │ a │                       │
│  Bottom Nav (5)   │             │ r │                       │
│  Kasir Pesanan    │             └───┴─────────────────────┘
│  Laporan Menu ⋯   │             Sidebar collapsible, isi semua
└─────────────────┘             9+ modul dikelompokkan
```

- **Mobile:** bottom nav 5 slot tetap: **Kasir, Pesanan, Laporan, Menu, ⋯ Lainnya** (Lainnya = bottom sheet berisi BI, Karyawan, Promo, QR Meja, Toko)
- **Tablet/Laptop (≥768px):** sidebar kiri, semua modul tampil sebagai list dengan grouping:
  - **Operasional:** Kasir, Pesanan
  - **Data:** Laporan, Business Intelligence
  - **Kelola:** Menu, Karyawan, Promo, QR Meja
  - **Pengaturan:** Toko, Admin Fee, Printer
- Breakpoint tambahan di 1024px untuk layout 2-3 kolom di halaman data-heavy (Laporan, BI)
- Konten TIDAK lagi dipaksa max-width 480px di desktop (masalah UI lama) — pakai max-width 1280px dengan grid yang benar-benar memanfaatkan ruang tablet/laptop

---

## 4. Komponen inti (reuse pattern lama yang sudah bagus)

| Token | Nilai |
|---|---|
| `--radius-sm` | 8px |
| `--radius-md` | 14px |
| `--radius-lg` | 24px |
| `--shadow-sm/md/lg` | dipertahankan dari versi lama (sudah proporsional) |
| Tap target minimum | 44×44px (semua tombol, item grid, nav) sesuai governance |

**Pola komponen wajib konsisten di semua modul baru:**
- `.card` — dasar semua kontainer
- `.badge-{status}` — pill kecil pakai warna status (danger/warning/info/success), dipakai buat: stok kritis, margin kritis, status pesanan (Pending/Diproses/Selesai)
- `.empty-state` — ikon + 1 kalimat aksi ("Belum ada pesanan masuk hari ini") — wajib di semua list/tabel, sesuai governance
- `.divider-ticket` — garis putus-putus (signature element), dipakai di ringkasan, laporan, detail pesanan

---

## 5. Yang TIDAK berubah dari sistem lama (biar hemat waktu, sudah baik)
- Sistem shadow & radius
- Font body (Plus Jakarta Sans)
- Struktur token CSS variable (tinggal ganti isinya)
- Aturan aksesibilitas dari governance-notes (kontras, ukuran font minimum, tap target)

## 6. Yang berubah total
- Palet warna → base netral + brand accent dinamis
- Font display → Space Grotesk
- Navigasi → adaptif (bottom nav ringkas / sidebar), bukan 3-tab statis
- Layout desktop → benar-benar responsive, bukan kolom mobile yang dilebarin
