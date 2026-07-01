# Review Sprint 5 — Backend AI Chatbot

Fitur backend untuk chatbot bisnis berbasis LLM (Gemini 1.5 Flash) telah selesai diimplementasikan sesuai dengan instruksi `PROMPT_1.MD` (S5-01 s/d S5-06) dan panduan arsitektur `AGENTS.md`.

---

## Ringkasan Perubahan

### 1. Environment & Dependencies
* Menginstall `@google/generative-ai` versi terbaru pada package dependency backend.
* Menambahkan variabel berikut pada [backend/.env.example](file:///Users/djanuuf/Documents/Kuliah%20Informatika%20Semester%204/Pengembangan%20SIstem%20Informasi/SIPI-POS-Project/repo/backend/.env.example) dan `.env` lokal:
  * `GEMINI_API_KEY`: API Key untuk mengakses Google Generative AI (Gemini 1.5 Flash).
  * `ENABLE_AI_CHAT`: Flag boolean (`true`/`false`) untuk mengontrol status aktif chatbot.

### 2. File Baru yang Diimplementasikan
* **Helper Gemini:** [backend/src/lib/gemini.ts](file:///Users/djanuuf/Documents/Kuliah%20Informatika%20Semester%204/Pengembangan%20SIstem%20Informasi/SIPI-POS-Project/repo/backend/src/lib/gemini.ts)
  * Berisi fungsi `generateResponse()` yang menginisialisasi model `gemini-1.5-flash` dengan system prompt dinamis dan mengembalikan respons teks hasil pemrosesan model.
* **Middleware Auth:** [backend/src/middleware/auth.ts](file:///Users/djanuuf/Documents/Kuliah%20Informatika%20Semester%204/Pengembangan%20SIstem%20Informasi/SIPI-POS-Project/repo/backend/src/middleware/auth.ts)
  * Middleware JWT `authenticate` untuk memvalidasi token authorization Bearer, mengekstrak informasi user (id, role), serta menambahkannya ke request context (`(req as any).user`).
* **AI Controller:** [backend/src/controllers/aiController.ts](file:///Users/djanuuf/Documents/Kuliah%20Informatika%20Semester%204/Pengembangan%20SIstem%20Informasi/SIPI-POS-Project/repo/backend/src/controllers/aiController.ts)
  * `handleChat`: Mengumpulkan data bisnis dari DB (total pendapatan, total transaksi, total laba bersih hari ini, status stok bahan baku, stok kritis, dan menu dengan margin kritis), menyusun system prompt, mengirimkan query user ke Gemini API, dan mem-parsing hasilnya (intent `qa` atau `action`).
  * `confirmAction`: Menangani persetujuan aksi belanja. Jika dikonfirmasi (`confirmed: true`), data belanja dari cache diproses menggunakan prisma transaction (melakukan restok bahan baku, mencatat history harga baru, dan menghitung ulang HPP untuk semua menu yang terpengaruh).
* **AI Router:** [backend/src/routes/ai.ts](file:///Users/djanuuf/Documents/Kuliah%20Informatika%20Semester%204/Pengembangan%20SIstem%20Informasi/SIPI-POS-Project/repo/backend/src/routes/ai.ts)
  * Menghubungkan router Express ke controller `/chat` dan `/confirm-action` dengan pengamanan via `authenticate`.

### 3. Modifikasi File Eksisting
* **Pendaftaran Router:** [backend/src/index.ts](file:///Users/djanuuf/Documents/Kuliah%20Informatika%20Semester%204/Pengembangan%20SIstem%20Informasi/SIPI-POS-Project/repo/backend/src/index.ts)
  * Mendaftarkan routing endpoint `/api/v1/ai` menggunakan `aiRouter`.
* **TypeScript Config:** [backend/tsconfig.json](file:///Users/djanuuf/Documents/Kuliah%20Informatika%20Semester%204/Pengembangan%20SIstem%20Informasi/SIPI-POS-Project/repo/backend/tsconfig.json)
  * Mengecualikan file `prisma/seed.ts` dari compiler `tsc` (`"exclude": ["node_modules", "dist", "prisma/seed.ts"]`) untuk mengatasi error TS6059 sehingga build server backend berjalan mulus (`npm run build` sukses 100%).

---

## Skenario Pengujian Endpoint (Manual Testing via Curl)

Pastikan service backend telah dijalankan (misal dengan `npm run dev` atau via Docker Compose).

### 1. Login untuk Mendapatkan Token
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"name":"admin","password":"sipi123"}'
```
> [!NOTE]
> Ambil nilai `token` dari response JSON untuk digunakan sebagai Bearer Token pada request berikutnya.

### 2. Uji Q&A Chatbot
```bash
curl -X POST http://localhost:4000/api/v1/ai/chat \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message":"Menu apa yang margin-nya kritis hari ini?"}'
```
* **Expected Response:** `{ "type": "answer", "message": "..." }`

### 3. Uji Pendeteksian Laporan Belanja (Action Intent)
```bash
curl -X POST http://localhost:4000/api/v1/ai/chat \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message":"tadi beli gula 2kg Rp18000"}'
```
* **Expected Response:**
  ```json
  {
    "type": "confirmation",
    "message": "Saya akan menambahkan gula sebanyak 2000 g dengan harga beli Rp 9000/g. Apakah ini benar?",
    "parsed_items": [
      {
        "name": "gula",
        "qty": 2000,
        "unit": "g",
        "price_per_unit": 9000
      }
    ]
  }
  ```

### 4. Eksekusi Konfirmasi Aksi Belanja (Action Execution)
```bash
curl -X POST http://localhost:4000/api/v1/ai/confirm-action \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"confirmed":true}'
```
* **Expected Response:**
  ```json
  {
    "success": true,
    "updated": [
      {
        "name": "Gula Pasir",
        "qty_added": 2000,
        "new_price": 9000
      }
    ]
  }
  ```

### 5. Membatalkan Aksi Belanja (Action Cancellation)
```bash
curl -X POST http://localhost:4000/api/v1/ai/confirm-action \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"confirmed":false}'
```
* **Expected Response:** `{ "success": false, "message": "Dibatalkan" }`
