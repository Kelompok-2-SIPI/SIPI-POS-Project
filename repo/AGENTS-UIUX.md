# AGENTS-UIUX: Instruksi Eksekusi Redesign UI/UX

Dokumen ini adalah aturan main (SOP) khusus bagi AI / Antigravity CLI dalam mengeksekusi perombakan antarmuka pengguna (UI/UX) pada repositori SIPI-POS-Project.

---

## 1. MANDATORY PRE-FLIGHT (Wajib Dibaca Sebelum Eksekusi)
Sebelum menulis, mengubah, atau menghapus baris kode UI apa pun, agen **WAJIB**:
1. Membaca dan memahami **`repo/DESIGN.md`** sebagai *Single Source of Truth* keputusan desain, hierarki navigasi, dan tata letak visual.
2. Membaca file halaman/komponen yang SUDAH ADA secara utuh sebelum mengubahnya — untuk memahami logic yang harus dipertahankan (lihat §2).
3. Mematuhi batasan *Guardrails* pada poin 2 di bawah ini.

---

## 2. STRICT GUARDRAILS (Batasan & Larangan)
Pekerjaan ini murni **Redesign UI/UX (Frontend Presentational Layer)**. Agen dilarang keras merusak logika bisnis yang sudah berjalan:
* **JANGAN SENTUH:** File `lib/api.ts`, *endpoint* API backend, konfigurasi database, atau struktur skema data.
* **JANGAN UBAH STATE LOGIC:** Semua `useState`, `useEffect`, `useRouter`, pemanggilan `apiFetch`/`fetch`, dan event handler (`onClick`, `onChange`, `onSubmit`) yang sudah ada di suatu halaman **HARUS tetap ada dan terpasang di elemen yang benar** setelah redesign. Alur kalkulasi keranjang POS, manajemen status *login/auth* (termasuk fallback offline hardcoded di halaman login), logika *checkout*, dan manajemen stok harus tetap berfungsi 100% seperti semula.
* **JANGAN UBAH STRUKTUR ROUTING UTAMA:** Jangan mengubah rute dasar halaman (misal: `/login`, `/dashboard`, `/pos`, `/inventory`) kecuali diinstruksikan secara eksplisit untuk penyesuaian navigasi di `DESIGN.md`.
* **JANGAN COPY-PASTE HTML STITCH MENTAH-MENTAH.** Kode di `02-design/stitch-janu/*/code.html` berisi dummy/static data. Setiap elemen yang menampilkan data (harga, stok, nama menu, dll) harus di-bind ulang ke state/props asli dari komponen React yang sudah ada, bukan teks statis dari mockup.

---

## 3. STACK STYLING PROYEK (PENTING — Bukan Tailwind)

Proyek ini **TIDAK menggunakan Tailwind CSS**. Jangan install atau memakai class Tailwind (`bg-primary`, `flex`, dst — style Stitch) secara langsung.

Stack styling yang dipakai proyek ini:
- **CSS Custom Properties** di `frontend/src/app/globals.css` (`:root { --primary: ...; }`) — semua design token warna/radius/shadow didefinisikan di sini.
- **`styled-jsx`** (`<style jsx>{...}</style>`) di dalam tiap komponen/page untuk styling spesifik komponen tersebut.

**Cara menerjemahkan referensi Stitch (yang pakai Tailwind) ke stack proyek:**
1. Ambil nilai visual dari class Tailwind di `code.html` Stitch (misal `bg-primary-container rounded-full px-4 py-2` → ambil warna, radius, padding-nya).
2. Update token di `globals.css` `:root` sesuai palet baru dari `DESIGN.md` (ganti tema "Premium Warm Bistro" yang sekarang ke "SIPI Modern Merchant" — cobalt blue `#0064E0`, dst — lihat §2.1 DESIGN.md).
3. Tulis ulang `<style jsx>` di tiap komponen memakai token CSS variable itu (`var(--primary)`, `var(--radius-lg)`, dst), BUKAN hardcode hex/px baru di banyak tempat.

---

## 4. PENANGANAN REFERENSI DESAIN (Stitch / Mockup)
* Referensi visual dari Stitch di folder `02-design/stitch-janu/` berfungsi sebagai **referensi arah gaya visual (layout, hierarki, vibe, token warna/tipografi)** — bukan aturan *pixel-perfect* atau kode yang ditiru langsung (lihat §3 soal Tailwind vs CSS variables proyek).
* Abaikan file `design_meta.md` jika ada di dalam folder ekspor — itu referensi desain pihak ketiga (meta.com) yang tidak relevan dengan SIPI.
* Pertahankan konsistensi desain responsif (Desktop vs Mobile) sesuai panduan navigasi di `DESIGN.md`: **Bottom Navigation di mobile (< 768px)**, **Sidebar 280px di desktop (≥ 1024px)**.

---

## 5. URUTAN PENGERJAAN (Execution Roadmap)
Eksekusi perombakan UI harus dilakukan secara bertahap per modul untuk mencegah kerusakan sistem (*regression*):

1. **Tahap 0: Design Tokens Global**
   * Update `frontend/src/app/globals.css` — ganti seluruh token warna/tipografi/radius/shadow ke nilai dari `DESIGN.md` §2. Ini fondasi untuk semua tahap berikutnya.
2. **Tahap 1: Login & Auth Pages**
   * Fokus: Tampilan form login, *feedback* error visual, dan responsivitas layar. Referensi: `02-design/stitch-janu/login_sipi_mobile*/`, `login_sipi_merchant_portal_centered/`.
   * WAJIB pertahankan: logic `handleSubmit`, fallback offline hardcoded (`admin`/`sipi123`), `localStorage` token/session handling.
3. **Tahap 2: Dashboard Layout & Shell Navigation**
   * Fokus: Bottom Navigation (mobile) + Sidebar 280px (desktop), termasuk integrasi section "Laporan" ke dalam Dashboard.
4. **Tahap 3: Inventaris (Inventory Management)**
   * Fokus: Tabel/grid produk, performa *scannability* data, filter/pencarian, modal tambah/edit barang.
5. **Tahap 4: Kasir (POS - Point of Sale)**
   * Fokus: *Ergonomics* kasir (cepat diklik), area keranjang belanja (*cart*), tombol *checkout*, dan responsivitas saat mode tablet/mobile.

---

## 6. FORMAT OUTPUT & COMMIT
Setiap kali menyelesaikan satu tahap atau satu komponen halaman, agen harus:
* Menjalankan `npm run dev` (atau build) dan memastikan tidak ada *runtime error* atau *layout break*.
* Verifikasi manual: data asli (bukan dummy Stitch) tetap tampil benar, dan semua interaksi (tombol, form, navigasi) tetap berfungsi.
* Membuat pesan commit yang jelas dengan format konvensi:
  `style(ui): [nama-modul] deskripsi singkat perubahan UI/UX`
  *Contoh: `style(ui): [login] redesign form login sesuai DESIGN.md Modern Merchant`*

## Changelog

### v1.1 (5 Juli 2026) — Update Janu
- Menambahkan §3 (Stack Styling Proyek) — klarifikasi proyek TIDAK pakai Tailwind, pakai CSS custom properties + styled-jsx.
- Memperbarui referensi folder Stitch ke `02-design/stitch-janu/` (hasil eksplorasi Janu, menggantikan draf sebelumnya).
- Menambahkan Tahap 0 (Design Tokens Global) di roadmap eksekusi — prasyarat sebelum tahap halaman lain dikerjakan.
- Menegaskan guardrail: dilarang copy-paste HTML Stitch mentah karena berisi dummy data.
