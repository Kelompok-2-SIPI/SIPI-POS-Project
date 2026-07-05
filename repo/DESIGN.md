# DESIGN.md — Sistem Desain SIPI POS (Versi Janu)

**Pemilik dokumen:** Janu (berdasarkan eksplorasi Google Stitch)
**Status:** v1.0 — Draf final, menggantikan eksplorasi Stitch versi Raihan
**Menggantikan:** PRD §6 (Design Considerations) untuk seluruh keputusan visual yang ditandai `[REKOMENDASI]`

---

## 0. Cara Membaca Dokumen Ini

Dokumen ini adalah **satu-satunya sumber kebenaran (source of truth)** untuk semua keputusan UI/UX di proyek SIPI POS, menggantikan draf `DESIGN.md` sebelumnya. Redesign total dilakukan di atas fondasi teknis yang **tidak berubah**: Next.js App Router, struktur folder (`app/pos`, `app/inventory`, `app/dashboard`, `app/login`), state management, dan seluruh logic pemanggilan API (`lib/api.ts`).

**Yang WAJIB dipatuhi tanpa kompromi** (dari PRD v4.7 §6, tidak berubah walau redesign total):
1. **WCAG 2.1 Level AA** — kontras teks minimum sesuai standar AA, dan **tidak boleh mengandalkan warna saja** untuk makna alert/status (harus disertai ikon dan/atau teks).
2. **PWA Installable** — `manifest.json` + Service Worker tetap berfungsi.
3. **Offline Capability** — halaman POS tetap bisa dipakai saat koneksi terputus.
4. **Performa** — Lighthouse Score ≥ 80 di HP kelas menengah. Hindari animasi berat/gambar tidak terkompresi.
5. **OQ-20** — konfirmasi eksplisit (Ya/Batal) sebelum AI Chatbot mengeksekusi aksi apa pun ke database.

**Semua hal lain di dokumen ini bebas diubah** oleh Janu kapan saja — ini bukan kontrak yang mengikat seperti PRD, melainkan keputusan desain yang bisa direvisi seiring proyek berjalan. Kalau merevisi, cukup update versi dokumen ini di bagian atas.

> **Catatan koordinasi tim:** Dokumen ini menggantikan `DESIGN.md` versi Raihan (branch `redesign/uiux-fullweb`) karena tim sepakat arah desain sebelumnya masih perlu perbaikan. Nama arahan ("Modern Merchant") dan warna primary (`#0064E0`) tetap sama — jadi ini lebih ke penyempurnaan arah yang sudah disepakati bareng, bukan mengganti total arahnya.

---

## 1. Filosofi Desain

**Nama arahan:** "SIPI Modern Merchant" — profesional, high-utility, photography-first, dirancang khusus untuk kebutuhan UMKM F&B Indonesia: cepat dipakai di dapur yang sibuk, tapi tetap terasa premium untuk Owner yang mengecek laporan dari desktop.

**Prinsip:**
- **Photography-First:** gambar menu/produk berkualitas tinggi dalam container radius besar untuk kesan "menggugah selera" sekaligus modern.
- **Utilitarian Elegance:** setiap elemen punya fungsi jelas; whitespace generous dan tipografi tegas untuk mengurangi beban kognitif saat jam sibuk.
- **Contextual Alerting:** warna semantik saturasi tinggi untuk menandai kesehatan bisnis tanpa membuat UI berantakan — SELALU disertai ikon, tidak pernah warna saja (wajib WCAG AA).
- **Ergonomic Precision:** tap target besar (≥44×44px) dan geometri membulat supaya nyaman dipakai sambil multitasking.
- **Navigasi menyesuaikan konteks pemakaian:** Kasir/Admin pegang HP di dapur → bottom navigation. Owner cek laporan di komputer → sidebar navigasi yang lebih kaya informasi.

---

## 2. Design Tokens

### 2.1 Warna

| Token | Hex | Penggunaan |
|---|---|---|
| `--color-primary` (Commerce Cobalt) | `#0064E0` | Tombol utama, "Selesaikan Transaksi", nav aktif, link aktif |
| `--color-primary-deep` | `#004DB0` | Hover/pressed state tombol primary |
| `--color-secondary` | `#0058BD` | Aksen sekunder, elemen interaktif pendukung |
| `--color-canvas` | `#FFFFFF` | Background utama, kartu |
| `--color-surface-soft` | `#F1F4F7` | Background thumbnail produk, search bar, pembeda dari canvas |
| `--color-ink-deep` | `#0A1317` | Judul, headline utama |
| `--color-ink` | `#1C1E21` | Teks body standar |
| `--color-outline` / hairline | `#CED0D4` | Border kartu, divider |

**Warna semantik alert** (WAJIB disertai ikon — tidak boleh warna polos):

| Jenis Alert | Warna | Ikon wajib | Pemicu |
|---|---|---|---|
| Stok Kritis | Merah `#E41E3F` | ⚠️ segitiga | `stock_qty ≤ min_stock_qty` |
| Margin Kritis | Oranye `#F2A918` | 🔺 panah naik | HPP > 80% harga jual |
| Info Kenaikan Harga | Biru info `#1876F2` | 📈 grafik | Kenaikan harga > 20% dalam 7 hari |
| Sukses / Stabil | Hijau `#31A24C` | ✓ | Transaksi sukses, tren stabil |

### 2.2 Tipografi

**Font tunggal: Plus Jakarta Sans** (dipakai untuk headline maupun body — 1 font family untuk performa loading lebih ringan di HP kelas menengah, dan konsisten dengan dokumen desain Raihan).

| Token | Ukuran | Weight | Penggunaan |
|---|---|---|---|
| `--font-display-lg` | 48px (desktop) / 32px (mobile) | 600–700 | Judul halaman besar, hero |
| `--font-headline` | 28–32px | 600 | Judul section, angka besar (Rp, jumlah) |
| `--font-title` | 20px | 600 | Judul kartu, sub-section |
| `--font-body` | 16px | 400–500 | Teks paragraf, deskripsi, label form |
| `--font-body-sm` | 14px | 400 | Body sekunder, metadata (minimum size — jangan lebih kecil) |
| `--font-label` | 12–14px | 600 | Label badge, caption, tombol |

> **Catatan wajib dari PRD:** teks body tidak boleh di bawah 14px agar tetap terbaca di lingkungan dapur.

### 2.3 Komponen Dasar

| Komponen | Varian | Catatan |
|---|---|---|
| Button | Primary (solid cobalt, pill), Secondary (outline/ghost), Destructive (merah, hanya untuk aksi merusak) | Semua tombol **pill-shaped** (radius penuh), tap target ≥44×44px |
| Card — Utility (Inventaris, list item) | Radius 16px | Untuk data-heavy content |
| Card — Feature (Dashboard alert, promo) | Radius 32px | Untuk highlight & foto |
| Input Field | Radius 8–12px, border hairline 1px → 2px cobalt saat fokus | Trigger keyboard numerik untuk stok/harga |
| Badge/Status Pill | Radius penuh, warna semantik + ikon wajib | Lihat §2.1 |
| Search Bar | Radius penuh, ikon kaca pembesar kiri | Konsisten di semua modul |
| Bottom Sheet | Slide-up, drag handle, maks 90% tinggi layar | Struk digital, konfirmasi AI, form cepat |
| FAB (AI Assistant) | Lingkaran 56×56px, kanan bawah | Trigger bottom sheet chatbot |
| Empty State | Ilustrasi/ikon + teks + CTA | Bentuk final per halaman saat implementasi |

---

## 3. Struktur Navigasi (Keputusan Final — Berbeda per Breakpoint)

**Mobile (< 768px) — Bottom Navigation, tinggi 64px:**

| # | Label | Catatan |
|---|---|---|
| 1 | POS | Entry point transaksi |
| 2 | Inventaris | Sub-tab: Stok / Restock / Menu & Resep |
| 3 | Dashboard | Termasuk section "Laporan" di dalamnya |
| 4 | Lainnya | Slot fitur mendatang (Settings, dll) |

**Desktop (≥ 1024px) — Sidebar kiri, lebar 280px:**
- Sidebar persisten berisi navigasi utama + workspace/user info, mengikuti pola dari mockup Stitch (`pos_kasir_desktop`, dst).
- Di bawah 1024px, sidebar collapse jadi hamburger/icon rail agar ruang kanvas tidak habis (breakpoint tablet).

> **Keputusan eksplisit:** navigasi berbeda sengaja dipilih karena konteks pemakaian berbeda drastis — Kasir/Admin Gudang pegang HP di dapur (bottom nav lebih ergonomis untuk jempol), sementara Owner mengecek Dashboard/Laporan dari desktop (sidebar lebih cocok untuk navigasi cepat antar banyak section + menampilkan lebih banyak konteks sekaligus).

---

## 4. Resolusi Inkonsistensi dari Draf Stitch

Beberapa perbedaan muncul antara draf mobile dan desktop hasil eksplorasi Stitch. Berikut keputusan final:

1. **Font: Plus Jakarta Sans untuk semua breakpoint** (draf awal desktop pakai Plus Jakarta Sans, draf mobile pakai Montserrat+Inter — dipilih Plus Jakarta Sans karena 1 font family lebih ringan untuk performa & konsisten dengan dokumen tim).
2. **Radius kartu: 16px untuk utility card, 32px untuk feature/promo card** di semua breakpoint (draf desktop sempat pakai 32px seragam — diseragamkan mengikuti prinsip "Utility vs Feature" dari draf mobile agar hierarki visual tetap jelas).
3. **Shadow: flat + hairline border sebagai default**, shadow lembut (`rgba(0,0,0,0.08)`) hanya untuk elemen sticky/floating (bottom bar, FAB, sticky header) — bukan dipakai luas di semua card seperti draf desktop awal, supaya tetap ringan secara performa dan konsisten dengan gaya "flat, contemporary" yang jadi filosofi utama.
4. **Navigasi: tetap berbeda per breakpoint** (bottom nav mobile, sidebar desktop) — lihat §3. Ini BUKAN inkonsistensi yang perlu diresolusi, melainkan keputusan sadar sesuai konteks device.

---

## 5. Yang Belum Ada di Draf Stitch — Perlu Didesain Saat Implementasi

- [ ] Konfirmasi Ya/Batal sebelum AI eksekusi aksi (**WAJIB — OQ-20**, prioritas tinggi)
- [ ] Modal linimasa riwayat harga bahan baku (FR-08a)
- [ ] Indikator status offline/sinkronisasi di header POS
- [ ] Empty state untuk tiap halaman berdata
- [ ] Bottom sheet chatbot AI penuh (bubble chat Owner vs AI, input teks)
- [ ] Grafik tren harga 7 hari per bahan baku (FR-16a) — satu line chart per bahan baku, bukan gabungan multi-line

---

## 6. Catatan untuk Antigravity CLI (AI Eksekutor)

Screenshot/kode HTML dari Stitch (folder `02-design/stitch-janu/`) adalah **referensi arah** (layout, hierarki, pola komponen) — **bukan** spesifikasi piksel-demi-piksel yang harus ditiru persis. Abaikan file `design_meta.md` di dalam folder ekspor — itu adalah analisis design system pihak ketiga (meta.com) yang tidak relevan dengan SIPI, hanya kebawa sebagai referensi gaya oleh Stitch dan tidak boleh dijadikan acuan token/komponen.

Instruksi detail dan batasan teknis (guardrail, urutan pengerjaan per tahap) mengikuti `AGENTS-UIUX.md` yang sudah ada — tidak perlu ditulis ulang, hanya rujuk `DESIGN.md` versi ini sebagai source of truth pengganti.

---

## Changelog

### v1.0 (5 Juli 2026)
- Menggantikan draf `DESIGN.md` Raihan berdasarkan hasil eksplorasi Stitch versi Janu (6 screen × 2 breakpoint).
- Menetapkan Plus Jakarta Sans sebagai font tunggal (resolusi dari 2 font berbeda di draf mobile/desktop).
- Menetapkan navigasi berbeda sengaja per breakpoint: bottom nav (mobile) vs sidebar 280px (desktop).
- Meresolusi inkonsistensi radius kartu dan shadow antara draf mobile & desktop.
- Menandai `design_meta.md` sebagai referensi tidak relevan (analisis meta.com, bukan SIPI).
