# Template Prompt untuk SIPI POS

Dokumen ini untuk anggota tim **yang tidak punya akses Claude**. Isi template di bawah sesuai kebutuhanmu, simpan di folder `00-koordinasi/prompt-queue/`, lalu serahkan ke anggota yang punya akses Claude untuk dijalankan. Hasilnya akan masuk ke `03-output-review/` untuk direview bersama.

---

## Format Standar (CTCO)

Setiap permintaan ke Claude — apa pun perannya (Code/Design/Cowork) — isi 4 bagian ini:

```
### Context (konteks)
[Apa yang sedang dikerjakan, screen/modul apa, kondisi saat ini]

### Task (tugas)
[Apa yang harus dilakukan Claude, spesifik dan terukur]

### Constraint (batasan)
[Aturan yang wajib diikuti — rujuk PRD, jangan ubah skema X, dll]

### Output Format (format hasil)
[Bentuk hasil yang diharapkan — kode, dokumen, gambar, list, dll]
```

---

## Template per Peran

### 🔧 Untuk Claude Code (Software Engineer)

```
### Context
Modul: [nama modul, misal: POS/Kasir]
File terkait: [path file kalau tahu, misal: backend/src/transactions/]
Referensi PRD: [nomor FR, misal: FR-03, FR-04]

### Task
[Tindakan spesifik, misal: "Implementasikan logic pengurangan stok bahan baku otomatis saat transaksi completed, sesuai FR-03"]

### Constraint
- Rujuk @prd-sipi-pos-inventory-v4.2.md sebagai source of truth
- Jangan ubah skema tabel `transactions` tanpa konfirmasi
- Ikuti arsitektur containerized (Frontend/Backend/DB terpisah) di §7

### Output Format
- Kode lengkap dengan penjelasan singkat per fungsi
- Sebutkan file mana yang diubah/dibuat
```

### 🎨 Untuk Claude Design / Stitch (UI/UX Designer)

```
### Context
Screen: [nama screen, misal: Dashboard Owner]
Referensi PRD: [section §6 Design Considerations, FR terkait]

### Task
[Misal: "Desain ulang Dashboard Owner dengan summary cards untuk pendapatan, transaksi, laba, dan ranking 5 menu terlaris"]

### Constraint
- Mobile-first, target layar 360-430px
- Tap target minimal 44x44px
- Gunakan sistem warna alert: Merah=Stok Kritis, Oranye=Margin Kritis, Biru=Info Harga (lihat OQ-14)
- Kontras tinggi, font minimum 14px body / 16px untuk angka harga

### Output Format
- Mockup/wireframe screen tersebut
- Catatan komponen apa saja yang dipakai (card, badge, dll)
```

### 📋 Untuk Claude Cowork (Project Coordinator)

```
### Context
Sprint: [nomor sprint, tanggal]
Status terkini: [progress modul apa, blocker apa]

### Task
[Misal: "Breakdown modul Inventaris jadi task-task kecil untuk Sprint 2, estimasi waktu masing-masing"]

### Constraint
- Selaras dengan Screen Inventory & Sprint Board yang sudah ada di 00-koordinasi/
- Update status, jangan duplikat task yang sudah ada

### Output Format
- Tabel task (Task | Tipe | Estimasi | PIC | Status)
- Ringkasan progres sprint dalam 2-3 kalimat
```

---

## Contoh Terisi (untuk anggota yang belum familiar)

```
### Context
Modul: Struk Digital
File terkait: belum ada, fitur baru

### Task
Buat komponen bottom sheet modal untuk menampilkan struk digital setelah transaksi selesai, sesuai FR-02 dan keputusan OQ-1 (struk tetap tampil sampai tombol "Transaksi Baru" ditekan manual)

### Constraint
- Rujuk @prd-sipi-pos-inventory-v4.2.md bagian Struk Digital (§7)
- Tidak ada auto-dismiss/countdown
- Tombol "Transaksi Baru" harus jelas terlihat di bawah struk

### Output Format
Kode komponen frontend (Next.js) + penjelasan cara pakainya
```

---

## Cara Pakai Alur Ini

1. Anggota tanpa akses Claude isi template di atas → simpan sebagai file `.md` di `00-koordinasi/prompt-queue/`.
2. Anggota dengan akses Claude ambil file itu, jalankan di Claude Code/Design/Cowork sesuai perannya.
3. Hasilnya disimpan di `03-output-review/` dengan nama yang sama (misal `struk-digital-bottomsheet.md`) supaya mudah ditrack siapa minta apa dan hasilnya apa.
4. Review bersama sebelum di-merge ke `repo/` atau dipakai sebagai keputusan final desain/sprint.
