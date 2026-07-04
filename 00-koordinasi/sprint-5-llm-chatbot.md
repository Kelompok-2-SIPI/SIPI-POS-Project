# Sprint 5 — AI Chatbot Bidirectional

**Sprint Goal:** Implementasi LLM chatbot bidirectional (FR-12, FR-13, FR-17, FR-18) — backend API + frontend UI — sehingga Owner dapat bertanya performa bisnis dan melaporkan belanja bahan baku via chat natural language.

**Status Sprint:** 🔵 Berjalan
**Tanggal Mulai:** 28 Juni 2026
**Target Selesai:** —
**Branch:** `feat/llm-chatbot`
**Berjalan paralel dengan:** Sprint 6 (Mobile Testing)

---

## Pembagian Tugas

| # | Task | PIC | Status | Catatan |
|---|------|-----|--------|---------|
| S5-01 | Setup Gemini SDK di backend, env var `GEMINI_API_KEY` + `ENABLE_AI_CHAT` | Janu | ✅ Done | Install `@google/generative-ai`, tambah ke `.env.example` |
| S5-02 | Buat `backend/src/lib/gemini.ts` — helper `generateResponse()` | Janu | ✅ Done | Model: `gemini-1.5-flash` |
| S5-03 | Buat `backend/src/controllers/aiController.ts` — fungsi `handleChat()` | Janu | ✅ Done | Deteksi intent Q&A vs Action, susun system prompt dengan data DB |
| S5-04 | Buat `backend/src/controllers/aiController.ts` — fungsi `confirmAction()` | Janu | ✅ Done | Eksekusi restock + catat harga ke DB, validasi nama bahan baku |
| S5-05 | Buat `backend/src/routes/ai.ts` + daftarkan di `index.ts` | Janu | ✅ Done | `POST /api/v1/ai/chat`, `POST /api/v1/ai/confirm-action` |
| S5-06 | Testing manual endpoint via curl/REST client | Janu | ✅ Done | Uji Q&A + Action flow, pastikan parsing akurat |
| S5-07 | Core: Floating 💬 button di halaman Dashboard + Inventaris | Favian | ⬜ To Do | OQ-19: floating button, buka bottom sheet. Favian implementasi core dulu, Raihan polish (S5-16) |
| S5-08 | Core: Komponen bottom sheet chatbot UI | Favian | ⬜ To Do | Input teks, tampilkan pesan, bubble chat Owner vs AI |
| S5-09 | Core: Tampilkan konfirmasi parsing + tombol "Ya, Lanjutkan" / "Batal" | Favian | ⬜ To Do | Terhubung ke `POST /ai/confirm-action` |
| S5-10 | Core: Tampilkan ringkasan hasil setelah konfirmasi dieksekusi | Favian | ⬜ To Do | "✅ Stok diperbarui: Gula +2.000g …" |
| S5-16 | Polish: styling bubble/bottom sheet, animasi, aksesibilitas warna, sembunyikan tombol kalau `ENABLE_AI_CHAT=false` | Raihan | ⬜ To Do | Setelah S5-07–S5-10 selesai |
| S5-11 | Uji manual Sprint 5 terhadap Acceptance Criteria | Rinda, Ibnu | ⬜ To Do | Setelah S5-07–S5-10 & S5-16 selesai |

---

## Acceptance Criteria

| FR | Skenario | Kriteria Lulus |
|----|----------|----------------|
| FR-12 | Owner ketik "Kenapa laba hari ini turun?" di chatbot | LLM balas < 5 detik, jawaban berbasis data aktual DB, Bahasa Indonesia |
| FR-13 | Owner ketik "Bahan baku apa yang harganya paling naik bulan ini?" | LLM menyebut nama bahan baku yang benar sesuai `ingredient_price_history` |
| FR-17 | Owner ketik "tadi beli gula 2kg Rp18.000 dan tepung 1kg Rp12.500" | Sistem tampilkan konfirmasi parsing yang akurat sebelum eksekusi |
| FR-18 | Owner tekan "Ya, Lanjutkan" | Stok gula +2.000g, stok tepung +1.000g, harga tercatat di `ingredient_price_history`, HPP dihitung ulang otomatis |
| OQ-19 | Buka halaman Dashboard atau Inventaris | Floating 💬 button tersedia dan membuka bottom sheet |

---

## Catatan Implementasi

- **Provider:** Google Gemini Flash (gratis via AI Studio — https://aistudio.google.com)
- **Guard:** Fitur dapat dimatikan via `ENABLE_AI_CHAT=false` tanpa mempengaruhi fitur lain
- **Cache in-memory:** `parsed_items` disimpan sementara di Map (key = userId, TTL 5 menit) — tidak perlu schema baru
- **Jangan ubah `schema.prisma`** — gunakan endpoint restock dan price-history yang sudah ada
- **Jangan kirim data sensitif** (password, raw transaction rows) ke Gemini API

---

## Log Progres

| Tanggal | Update | Oleh |
|---------|--------|------|
| 28 Jun 2026 | Sprint 5 dibuat | Claude Cowork |
