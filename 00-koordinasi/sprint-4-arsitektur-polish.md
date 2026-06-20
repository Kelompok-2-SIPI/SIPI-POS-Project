# Sprint 4 — Arsitektur & Polish

**Sprint Goal:** Refactor ke arsitektur 3 container sesuai PRD v4.2, perbaiki navigasi sesuai OQ-7, dan tutup semua gap antara MVP dan PRD.

**Status Sprint:** 🔵 Berjalan
**Tanggal Mulai:** 20 Juni 2026
**Target Selesai:** —
**Dikerjakan oleh:** Favian + Raihan (via Gemini Antigravity IDE)

---

## Latar Belakang

MVP (v1.3.0) dibangun sebagai monolith Next.js dengan arsitektur 2 container (web + database). PRD v4.2 menetapkan arsitektur 3 container terpisah (frontend, backend, database). Sprint ini menutup gap tersebut dan memperbaiki penyimpangan navigasi dari keputusan OQ-7.

---

## Task Breakdown

| # | Task | PIC | Status | Catatan |
|---|------|-----|--------|---------|
| S4-01 | Refactor 3 container (frontend:3000, backend:4000, database:5432) | Favian | 🟢 Done | docker-compose.yml ditulis ulang, API Routes dipindah ke Express backend |
| S4-02 | Fix error Docker build (`npm ci` → `npm install`) | Favian | 🟢 Done | Error: package-lock.json tidak ada di build context |
| S4-03 | Verifikasi FR-14 — cek auto text summary pakai template string atau LLM | Favian | 🟢 Done | Tidak ada network request ke LLM — murni template string ✅ |
| S4-04 | Fix navigasi: 4 tab → 3 tab (Restock masuk sub-tab Inventaris) | Raihan | ⬜ To Do | OQ-7 PRD v4.1; halaman /restock digabung ke /inventory |
| S4-05 | Verifikasi docker-compose up --build berjalan bersih | Favian | 🟢 Done | Ketiga container naik, login berhasil |
| S4-06 | Update README.md di repo/ sesuai port dan cara run terbaru | Favian | ⬜ To Do | Port berubah: 3080 → 3000 |
| S4-07 | Update CHANGELOG.md dengan entri v2.0.0 untuk refactor arsitektur | Favian | ⬜ To Do | Dokumentasikan perubahan containerization |

---

## Perubahan Arsitektur (S4-01 — Done)

**Sebelum (MVP monolith):**
```
sipi_web (Next.js + API Routes) :3080
sipi_db (PostgreSQL 15)         :5433
```

**Sesudah (PRD v4.2):**
```
sipi_frontend (Next.js)         :3000
sipi_backend  (Express + Prisma):4000
sipi_database (PostgreSQL 16)   :5432
```

Perubahan teknis yang dilakukan:
- Semua `src/app/api/v1/` (Next.js API Routes) dipindah ke `backend/src/`
- Frontend menggunakan `apiFetch()` helper dengan JWT Bearer auto-attach
- `prisma/` dipindah ke `backend/prisma/`
- Dockerfile terpisah untuk frontend dan backend
- Named volume `sipi_postgres_data` untuk persistensi data

---

## Acceptance Criteria Sprint 4

| Task | Lulus Jika |
|------|------------|
| S4-02 | `docker-compose up --build` selesai tanpa error di kedua service |
| S4-03 | Teks ringkasan di dashboard muncul tanpa network request ke LLM API eksternal |
| S4-04 | Halaman inventaris memiliki 3 sub-tab: Stok / Restock / Menu & Resep — halaman /restock tidak lagi ada sebagai halaman terpisah |
| S4-05 | Ketiga container (frontend, backend, database) up dan saling terhubung |
| S4-06 | README.md di repo/ menampilkan instruksi yang akurat (port 3000, cara seed, dll.) |

---

## Log Progres

| Tanggal | Update | Oleh |
|---------|--------|------|
| 20 Jun 2026 | Sprint 4 dibuat | Claude Cowork |
| 20 Jun 2026 | S4-01 selesai — refactor 3 container oleh Claude Code | Favian |
| 20 Jun 2026 | S4-02 selesai — Docker build error fixed via Gemini Antigravity | Favian |
| 20 Jun 2026 | S4-05 selesai — ketiga container naik, login berhasil | Favian |
