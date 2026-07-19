# Catatan Deployment Production — SIPI POS

**Dokumen ini:** Dokumentasi resmi konfigurasi deployment production SIPI POS.
**Terakhir diperbarui:** 10 Juli 2026
**Dikelola oleh:** Favian (Lead / Integrator)

---

## Arsitektur Deployment

SIPI POS menggunakan arsitektur *split deployment* antara dua platform cloud yang berbeda:

```
┌──────────────────────┐        ┌────────────────────────────────┐
│    VERCEL            │        │    RAILWAY                     │
│  (Frontend)          │◄──────►│  (Backend + Database)          │
│                      │  HTTPS │                                │
│  Next.js (PWA)       │        │  Express API    PostgreSQL      │
│  Port: 443 (HTTPS)   │        │  Port: 4000     Port: 5432     │
└──────────────────────┘        └────────────────────────────────┘
                                          │
                                          ▼
                                ┌─────────────────┐
                                │   CLOUDINARY    │
                                │ (Foto Menu)     │
                                └─────────────────┘
```

---

## Platform & Layanan

| Komponen | Platform | Catatan |
|----------|----------|---------|
| **Frontend** | [Vercel](https://vercel.com) | Auto-deploy dari branch `main` |
| **Backend (Express API)** | [Railway](https://railway.app) | Service Node.js terpisah |
| **Database (PostgreSQL)** | [Railway](https://railway.app) | Plugin PostgreSQL bawaan Railway |
| **Penyimpanan Foto Menu** | [Cloudinary](https://cloudinary.com) | Dipakai karena Railway menggunakan *ephemeral disk* |

---

## Environment Variables

### Backend — Railway

Semua variabel berikut **wajib** di-set di dashboard Railway > Variables:

| Variabel | Contoh Nilai | Keterangan |
|----------|-------------|------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | Otomatis tersedia jika pakai plugin PostgreSQL Railway |
| `JWT_SECRET` | `random_string_min_32_karakter` | Generate dengan: `openssl rand -base64 48` |
| `PORT` | `4000` | Port backend Express |
| `NODE_ENV` | `production` | Wajib `production` di Railway |
| `FRONTEND_URL` | `https://sipi-pos.vercel.app` | URL Vercel — dipakai untuk konfigurasi CORS |
| `GEMINI_API_KEY` | `AIza...` | API key Google Gemini (AI Chatbot) |
| `ENABLE_AI_CHAT` | `true` | Aktifkan fitur chatbot AI |
| `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | Dari dashboard Cloudinary > Account Details |
| `CLOUDINARY_API_KEY` | `123456789...` | Dari dashboard Cloudinary > API Keys |
| `CLOUDINARY_API_SECRET` | `abc123...` | Dari dashboard Cloudinary > API Keys |

> **Catatan:** `DATABASE_URL` biasanya sudah otomatis di-inject oleh Railway jika backend dan PostgreSQL berada dalam satu project Railway yang sama.

### Frontend — Vercel

| Variabel | Contoh Nilai | Keterangan |
|----------|-------------|------------|
| `NEXT_PUBLIC_API_URL` | `https://sipi-backend-production.up.railway.app/api/v1` | URL backend Railway — **wajib** diisi agar frontend bisa memanggil API |

> **Penting:** Prefix `NEXT_PUBLIC_` diperlukan agar variabel dapat diakses dari sisi *client-side* Next.js. Tanpa ini, semua panggilan API akan gagal di browser.

---

## Alur Deployment

### Frontend (Vercel)
1. Push ke branch `main` di GitHub
2. Vercel mendeteksi perubahan dan memulai build Next.js secara otomatis
3. Hasil build di-deploy ke CDN global Vercel
4. URL production tersedia setelah build selesai

### Backend & Database (Railway)
1. Push ke branch `main` di GitHub
2. Railway mendeteksi perubahan dan memulai build Node.js secara otomatis
3. Backend ter-deploy sebagai service di Railway
4. Database PostgreSQL tetap berjalan di service terpisah dalam project yang sama

> **Catatan:** Karena Railway menggunakan *ephemeral disk*, file yang diupload ke disk lokal (seperti foto menu) **akan hilang** setiap kali redeploy. Itulah alasan foto menu dimigrasikan ke **Cloudinary** (lihat FR-27, Sprint 8).

---

## Catatan Penting Production

- **CORS:** Backend dikonfigurasi untuk hanya menerima request dari `FRONTEND_URL`. Pastikan nilai ini diisi dengan URL Vercel yang tepat (dengan `https://`).
- **Database Migration:** Setelah deploy pertama atau setelah ada perubahan skema Prisma, jalankan `npx prisma migrate deploy` di Railway shell.
- **PWA:** Service Worker dan manifest PWA berjalan langsung dari Vercel (static assets). Pastikan HTTPS aktif (default di Vercel) karena Service Worker hanya bisa diregistrasi di koneksi aman.
- **Foto Lama:** Foto menu yang diupload sebelum migrasi Cloudinary (Sprint 8) mungkin tidak lagi tersedia di production jika disk Railway sudah di-reset. Foto baru yang diupload setelah migrasi tersimpan permanen di Cloudinary.

---

## Referensi

- [PRD v4.8 — §7 Technical Considerations](./prd-sipi-pos-inventory-v4.8.md)
- [Sprint 8 — Migrasi Cloudinary (FR-27)](../00-koordinasi/sprint-8-advanced-insights-polish.md)
- [`.env.example` Backend](../repo/backend/.env.example)
- [`.env.example` Frontend](../repo/frontend/.env.example)
