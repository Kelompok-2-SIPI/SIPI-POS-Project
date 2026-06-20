# Task Assignment — SIPI POS

**Terakhir diperbarui:** 20 Juni 2026 (rev. 2 — Rinda & Ibnu jadi QA, Design ke Raihan)

---

## Pembagian Peran Tim

| Nama | Peran | Tanggung Jawab | Folder Utama |
|------|-------|----------------|--------------|
| Favian | Lead / Integrator | Setup infra, review PR, keputusan arsitektur | semua |
| Janu | Backend Developer | API endpoints, business logic, Prisma | `repo/backend/` |
| Raihan | Frontend Developer + Design | Halaman Next.js, komponen UI, mockup | `repo/frontend/`, `02-design/` |
| Rinda | QA / Tester | Uji manual fitur, laporan bug | `03-output-review/` |
| Ibnu | QA / Tester | Uji manual fitur, laporan bug | `03-output-review/` |

---

## Aturan Koordinasi

- Semua output (kode, desain, laporan QA) masuk ke `03-output-review/` dulu sebelum dianggap final.
- Keputusan yang mengubah scope PRD harus dikonfirmasi ke Favian terlebih dahulu.
- Perubahan di `01-dokumentasi/prd-sipi-pos-inventory-v4.2.md` **hanya dilakukan oleh Favian** setelah diskusi tim.
- Janu tidak menyentuh `repo/frontend/` atau folder koordinasi.
- Raihan tidak menyentuh `repo/backend/`.
- Rinda dan Ibnu tidak menyentuh `repo/` — hanya baca dan tulis laporan di `03-output-review/`.

---

## Matriks Task Sprint 1

| Task | Favian | Janu | Raihan | Rinda | Ibnu |
|------|:------:|:----:|:------:|:-----:|:----:|
| T-01 s/d T-04 (Infra/Setup) | ✅ | — | — | — | — |
| T-05 s/d T-09 (Backend API) | — | ✅ | — | — | — |
| T-10 s/d T-16 (Frontend POS) | — | — | ✅ | — | — |
| D-01 s/d D-04 (Mockup POS) | — | — | ✅ | — | — |
| T-17 (QA & Testing) | — | — | — | ✅ | ✅ |
| Sprint Board & Tracking | Monitor | — | — | — | — |
