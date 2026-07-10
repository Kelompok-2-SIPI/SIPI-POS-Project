import { Response } from 'express';
import { prisma } from '../lib/db';
import { TypeMovement, TransactionStatus, Ingredient, Menu } from '@prisma/client';
import { recalculateAllHppsForIngredient, recalculateMenuHpp } from '../lib/inventory-helpers';
import { getMonthlySales, getMonthlyProfitTrend, getVisitPatternByDay, getVisitPatternByHour, predictTopMenuTomorrow, getMenuBundleRecommendation, DAY_NAMES } from '../lib/dashboard-insights';
import { generateResponse } from '../lib/gemini';
import { AuthRequest } from '../middleware/auth';

interface ParsedItem {
  name: string;
  qty: number;            // dalam satuan dasar (gram/ml/pcs)
  unit: string;
  price_per_unit: number;
}

interface ParsedRecipeIngredientInput {
  name: string;
  qty: number;
  unit: string;
}

interface ParsedRecipeInput {
  menu_name: string;
  ingredients: ParsedRecipeIngredientInput[];
}

interface ResolvedRecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  qtyUsed: number;
  unit: string;
}

type PendingAction =
  | { type: 'restock'; items: ParsedItem[]; expiresAt: number }
  | { type: 'recipe'; menuId: string; menuName: string; ingredients: ResolvedRecipeIngredient[]; expiresAt: number };

const pendingActions = new Map<string, PendingAction>();

function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '');
    cleaned = cleaned.replace(/\n```$/, '');
  }
  return cleaned.trim();
}

// Cocokkan nama yang disebut Owner ke entity yang ada di DB — exact match dulu, baru "contains"
// dua arah. TIDAK PERNAH menebak: kalau hasilnya ambigu (>1 kandidat) atau kosong, caller wajib
// minta klarifikasi, bukan lanjut jalan (lihat PRD §12 "Catatan Implementasi").
function matchByName<T extends { name: string }>(query: string, candidates: T[]): { match: T | null; candidates: T[] } {
  const q = query.trim().toLowerCase();
  const exact = candidates.find((c) => c.name.trim().toLowerCase() === q);
  if (exact) return { match: exact, candidates: [exact] };

  const partial = candidates.filter((c) => {
    const name = c.name.trim().toLowerCase();
    return name.includes(q) || q.includes(name);
  });
  if (partial.length === 1) return { match: partial[0], candidates: partial };
  return { match: null, candidates: partial };
}

// Konversi satuan yang "cocok secara fisik" saja (gram<->kg, ml<->liter, atau satuan identik
// seperti pcs/potong). Kalau satuan yang disebut Owner tidak sepadan dengan satuan asli bahan
// baku di DB (mis. Owner sebut "gram" padahal bahan itu dilacak per "potong"), kembalikan null
// supaya caller minta klarifikasi — jangan menebak konversi yang tidak masuk akal.
function convertQtyToUnit(qty: number, fromUnit: string, toUnit: string): number | null {
  const f = fromUnit.trim().toLowerCase();
  const t = toUnit.trim().toLowerCase();
  if (f === t) return qty;

  const gramLike = ['g', 'gr', 'gram'];
  const kgLike = ['kg', 'kilogram'];
  const mlLike = ['ml', 'mililiter'];
  const literLike = ['l', 'liter', 'ltr'];

  if (gramLike.includes(f) && kgLike.includes(t)) return qty / 1000;
  if (kgLike.includes(f) && gramLike.includes(t)) return qty * 1000;
  if (mlLike.includes(f) && literLike.includes(t)) return qty / 1000;
  if (literLike.includes(f) && mlLike.includes(t)) return qty * 1000;

  return null;
}

// Resolusi & validasi aksi "set resep menu" dari hasil parsing Gemini, SEBELUM konfirmasi
// ditampilkan ke Owner — beda dengan restock (yang divalidasi setelah "Ya"), karena mengganti
// resep berdampak ke semua transaksi menu itu ke depannya, jadi harus benar dari awal.
async function resolveRecipeAction(
  parsedRecipe: ParsedRecipeInput | undefined,
  menus: Menu[],
  ingredients: Ingredient[]
): Promise<{ ok: true; menu: Menu; ingredients: ResolvedRecipeIngredient[] } | { ok: false; clarification: string }> {
  if (!parsedRecipe || !parsedRecipe.menu_name || !Array.isArray(parsedRecipe.ingredients) || parsedRecipe.ingredients.length === 0) {
    return { ok: false, clarification: 'Saya tidak bisa memahami resep yang dimaksud. Tolong sebutkan nama menu dan daftar bahan baku + kuantitasnya dengan lebih jelas.' };
  }

  const menuMatch = matchByName(parsedRecipe.menu_name, menus);
  if (!menuMatch.match) {
    if (menuMatch.candidates.length > 1) {
      return { ok: false, clarification: `Menu "${parsedRecipe.menu_name}" cocok dengan beberapa menu: ${menuMatch.candidates.map((m) => m.name).join(', ')}. Menu yang mana yang dimaksud?` };
    }
    return { ok: false, clarification: `Menu "${parsedRecipe.menu_name}" tidak ditemukan di sistem. Tolong sebutkan nama menu yang persis sesuai data (cek halaman Menu).` };
  }

  const resolved: ResolvedRecipeIngredient[] = [];
  for (const item of parsedRecipe.ingredients) {
    const ingMatch = matchByName(item.name, ingredients);
    if (!ingMatch.match) {
      if (ingMatch.candidates.length > 1) {
        return { ok: false, clarification: `Bahan baku "${item.name}" cocok dengan beberapa bahan: ${ingMatch.candidates.map((i) => i.name).join(', ')}. Yang mana yang dimaksud?` };
      }
      return { ok: false, clarification: `Bahan baku "${item.name}" tidak ditemukan di sistem. Tolong sebutkan nama bahan baku yang persis sesuai data (cek halaman Inventaris), atau tambahkan bahan itu dulu sebelum mengatur resep.` };
    }

    const qtyInDbUnit = convertQtyToUnit(Number(item.qty), item.unit, ingMatch.match.unit);
    if (qtyInDbUnit === null || !(qtyInDbUnit > 0)) {
      return { ok: false, clarification: `Satuan "${item.unit}" untuk bahan "${ingMatch.match.name}" tidak sesuai dengan satuan di sistem (${ingMatch.match.unit}). Tolong sebutkan kuantitasnya dalam satuan ${ingMatch.match.unit}.` };
    }

    resolved.push({ ingredientId: ingMatch.match.id, ingredientName: ingMatch.match.name, qtyUsed: qtyInDbUnit, unit: ingMatch.match.unit });
  }

  return { ok: true, menu: menuMatch.match, ingredients: resolved };
}

export async function handleChat(req: AuthRequest, res: Response) {
  if (process.env.ENABLE_AI_CHAT !== 'true') {
    return res.status(503).json({ error: 'Fitur AI tidak aktif' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
  }

  // Get current authenticated user
  const userId = req.user?.id;
  const businessId = req.businessId;
  if (!userId || !businessId) {
    return res.status(401).json({ error: 'User tidak terautentikasi' });
  }

  try {
    // 1. Get today's local date (GMT+7)
    const now = new Date();
    const gmt7 = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60 * 1000);
    const dateStr = gmt7.toISOString().split('T')[0];
    // Gemini tidak selalu bisa menghitung sendiri hari-dalam-minggu dengan benar dari
    // sebuah tanggal (rawan salah/halusinasi) — sebutkan eksplisit di prompt supaya
    // jawaban soal "besok"/"hari ini" konsisten dengan data prediksi di bawah.
    const todayDayName = DAY_NAMES[(gmt7.getUTCDay() + 6) % 7];

    const start = new Date(`${dateStr}T00:00:00+07:00`);
    const end = new Date(`${dateStr}T23:59:59.999+07:00`);

    // 2. Query today's completed transactions (business ini saja — konteks AI TIDAK boleh
    // membocorkan data bisnis lain dalam jawabannya)
    const txs = await prisma.transaction.findMany({
      where: {
        businessId,
        status: TransactionStatus.completed,
        completedAt: { gte: start, lte: end }
      }
    });

    let pendapatan = 0;
    let totalHpp = 0;
    for (const tx of txs) {
      pendapatan += Number(tx.totalPrice);
      totalHpp += Number(tx.totalHpp);
    }
    const laba = pendapatan - totalHpp;
    const jumlah = txs.length;

    // 3. Query ingredients
    const ingredients = await prisma.ingredient.findMany({
      where: { businessId },
      orderBy: { name: 'asc' }
    });

    // 4. Query menus for critical margins
    const menus = await prisma.menu.findMany({
      where: { businessId },
      orderBy: { name: 'asc' }
    });

    // 5. Construct stock list
    const stockList = ingredients.map(ing => {
      return `${ing.name}: ${Number(ing.stockQty)}${ing.unit}, harga terkini Rp${Number(ing.latestPrice)}/${ing.unit}`;
    }).join('\n');

    // 6. Construct critical stock list
    const criticalStockList = ingredients
      .filter(ing => Number(ing.stockQty) <= Number(ing.minStockQty))
      .map(ing => `- ${ing.name} (sisa ${Number(ing.stockQty)} ${ing.unit})`)
      .join('\n');
    const criticalStockText = criticalStockList || 'Tidak ada';

    // 7. Construct critical margin menus list
    const criticalMarginList = menus
      .filter(m => Number(m.sellingPrice) > 0 && Number(m.hpp) > Number(m.sellingPrice) * 0.8)
      .map(m => `- ${m.name} (HPP: Rp ${Number(m.hpp)} | Jual: Rp ${Number(m.sellingPrice)})`)
      .join('\n');
    const criticalMarginText = criticalMarginList || 'Tidak ada';

    // 7b. Reuse service yang sama dipakai dashboard (MonthlySalesChart, Pola Pengunjung Mingguan, Jam Tersibuk,
    // Estimasi Laba Kotor bulanan, Prediksi Menu Besok, Rekomendasi Bundling) — supaya chatbot bisa menjawab
    // pertanyaan seputar SEMUA data yang sudah dihitung di Dashboard, bukan cuma data hari ini. Data historis
    // margin kritis (critical-margins-range) SENGAJA tidak disertakan: endpoint itu butuh rentang tanggal
    // pilihan Owner sendiri (tidak punya window default yang masuk akal buat konteks tetap), dan kondisi
    // margin kritis SAAT INI sudah tercakup di bagian "MENU MARGIN KRITIS" di bawah.
    const fmtRp = new Intl.NumberFormat('id-ID');
    const [monthlySales, monthlyProfit, visitByDay, visitByHour, tomorrowPrediction, bundleRecommendation] = await Promise.all([
      getMonthlySales(businessId, 6),
      getMonthlyProfitTrend(businessId, 6),
      getVisitPatternByDay(businessId, 4),
      getVisitPatternByHour(businessId, 4),
      predictTopMenuTomorrow(businessId, 4),
      getMenuBundleRecommendation(businessId, 8),
    ]);

    const monthlySalesText = monthlySales
      .map(m => `- ${m.label}: Rp ${fmtRp.format(m.totalRevenue)} (${m.transactionsCount} transaksi)`)
      .join('\n');
    const busiestMonth = monthlySales.reduce((max, m) => (m.totalRevenue > max.totalRevenue ? m : max), monthlySales[0]);
    const monthlySalesSummary = monthlySales.length > 0
      ? `Bulan paling tinggi pendapatannya: ${busiestMonth.label} (Rp ${fmtRp.format(busiestMonth.totalRevenue)}).`
      : 'Belum ada data.';

    const monthlyProfitText = monthlyProfit
      .map(m => `- ${m.label}: Rp ${fmtRp.format(m.grossProfit)} (pendapatan Rp ${fmtRp.format(m.totalRevenue)} - HPP Rp ${fmtRp.format(m.totalHpp)})`)
      .join('\n');
    const mostProfitableMonth = monthlyProfit.reduce((max, m) => (m.grossProfit > max.grossProfit ? m : max), monthlyProfit[0]);
    const monthlyProfitSummary = monthlyProfit.length > 0
      ? `Bulan paling tinggi labanya: ${mostProfitableMonth.label} (Rp ${fmtRp.format(mostProfitableMonth.grossProfit)}).`
      : 'Belum ada data.';

    const visitByDayText = visitByDay.data
      .map(d => `- ${d.day}: rata-rata ${d.avgTransactions} transaksi/hari`)
      .join('\n');

    const visitByHourActive = visitByHour.data.filter(h => h.totalTransactions > 0);
    const visitByHourText = visitByHourActive
      .map(h => `- Jam ${String(h.hour).padStart(2, '0')}:00: ${h.totalTransactions} transaksi`)
      .join('\n');

    const tomorrowPredictionText = tomorrowPrediction.topMenu
      ? `${tomorrowPrediction.topMenu.name} (rata-rata ${tomorrowPrediction.topMenu.avgQtySold} porsi terjual tiap hari ${tomorrowPrediction.targetDayName} dalam ${tomorrowPrediction.weeksAnalyzed} minggu terakhir)`
      : 'Belum cukup data historis untuk hari ini.';

    const bundleRec = bundleRecommendation.recommendation;
    const bundleRecommendationText = bundleRec
      ? `${bundleRec.menus[0].name} + ${bundleRec.menus[1].name} — muncul bersama di ${bundleRec.coOccurrenceCount} dari ${bundleRecommendation.transactionsAnalyzed} transaksi (${bundleRec.coOccurrencePercent}%) dalam ${bundleRecommendation.weeksAnalyzed} minggu terakhir. Estimasi harga bundle Rp ${fmtRp.format(bundleRec.suggestedBundlePrice)} (diskon ${bundleRec.discountPercent}% dari Rp ${fmtRp.format(bundleRec.individualPriceSum)}), estimasi margin Rp ${fmtRp.format(Math.round(bundleRec.estimatedMargin))} (${bundleRec.estimatedMarginPercent}%).`
      : 'Belum cukup data transaksi untuk membuat rekomendasi bundling.';

    // 8. Susun system prompt
    const menuNamesList = menus.map((m) => m.name).join(', ');
    const systemPrompt = `Kamu adalah asisten bisnis SIPI untuk UMKM F&B ini.
Kamu punya TIGA kemampuan:
1. MENJAWAB PERTANYAAN bisnis berdasarkan data di bawah.
2. MEMPROSES LAPORAN BELANJA — jika Owner menyebut nama bahan baku + kuantitas + harga,
   ekstrak dan kembalikan sebagai JSON dengan intent "action", action_type "restock".
3. MENGATUR RESEP MENU — jika Owner minta set/ubah/ganti resep suatu menu (menyebut nama
   menu + daftar bahan baku dengan kuantitasnya), ekstrak dan kembalikan sebagai JSON
   dengan intent "action", action_type "recipe". INGAT: ini akan MENGGANTI SELURUH resep
   lama menu itu (bukan menambah), jadi pastikan Owner benar-benar menyebutkan resep
   LENGKAP, dan sebutkan nama bahan baku PERSIS seperti yang tertulis di daftar stok
   bahan baku di bawah (jangan cocok-cocokkan sendiri, biar backend yang validasi).
   Nama menu yang tersedia: ${menuNamesList}

=== DATA BISNIS HARI INI (${dateStr}, hari ${todayDayName}) ===
Pendapatan: Rp ${pendapatan} | Transaksi: ${jumlah} | Estimasi Laba: Rp ${laba}

=== STOK BAHAN BAKU ===
${stockList}

=== STOK KRITIS ===
${criticalStockText}

=== MENU MARGIN KRITIS ===
${criticalMarginText}

=== TREN PENJUALAN 6 BULAN TERAKHIR ===
${monthlySalesText}
${monthlySalesSummary}

=== TREN ESTIMASI LABA KOTOR 6 BULAN TERAKHIR (pendapatan - HPP transaksi selesai) ===
${monthlyProfitText}
${monthlyProfitSummary}

=== POLA PENGUNJUNG MINGGUAN (rata-rata 4 minggu terakhir, proxy jumlah transaksi selesai) ===
${visitByDayText}
Hari paling ramai: ${visitByDay.busiestDay.day} (rata-rata ${visitByDay.busiestDay.avgTransactions} transaksi/hari).

=== JAM TERSIBUK (total 4 minggu terakhir, jam operasional saja, proxy jumlah transaksi selesai) ===
${visitByHourText}
Jam paling sibuk: ${String(visitByHour.busiestHour.hour).padStart(2, '0')}:00 WIB (${visitByHour.busiestHour.totalTransactions} transaksi).

=== PREDIKSI MENU TERLARIS BESOK (berdasarkan pola historis hari-dalam-minggu, BUKAN AI/machine learning) ===
${tomorrowPredictionText}

=== REKOMENDASI BUNDLING MENU (co-occurrence 8 minggu terakhir, insight saja — belum jadi menu Paket) ===
${bundleRecommendationText}

FORMAT OUTPUT — selalu kembalikan JSON valid:
{
  "intent": "qa" atau "action",
  "action_type": "restock" atau "recipe",
  "response": "teks balasan Bahasa Indonesia",
  "parsed_items": [
    { "name": "gula", "qty": 2000, "unit": "g", "price_per_unit": 9000 }
  ],
  "parsed_recipe": {
    "menu_name": "Ayam Geprek Dada",
    "ingredients": [
      { "name": "Ayam Potong (Dada)", "qty": 200, "unit": "gram" },
      { "name": "Tepung Terigu", "qty": 50, "unit": "gram" }
    ]
  }
}

"parsed_items" hanya diisi kalau action_type "restock". "parsed_recipe" hanya diisi kalau
action_type "recipe". Untuk intent "qa", kedua field itu boleh dikosongkan/dihapus.

ATURAN:
- Konversi ke satuan dasar DB (kg → g × 1000, dst.)
- Harga per unit = total harga ÷ kuantitas
- Jangan mengarang data di luar konteks di atas
- Untuk resep, salin nama bahan baku persis dari daftar stok bahan baku — jangan singkat/ubah
- Jika ambigu, set intent "qa" dan minta klarifikasi`;

    // 9. Call Gemini SDK
    let aiResponseText = '';
    try {
      aiResponseText = await generateResponse(systemPrompt, message);
    } catch (apiErr: any) {
      console.error('[Gemini API Error]', apiErr);
      return res.status(502).json({ error: 'Layanan AI sementara tidak tersedia' });
    }

    // 10. Parse output Gemini
    let result: any;
    try {
      const cleaned = cleanJsonResponse(aiResponseText);
      result = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn('[Gemini Response Parse Failed, falling back to QA]', parseErr, aiResponseText);
      result = {
        intent: 'qa',
        response: aiResponseText
      };
    }

    if (result.intent === 'action' && result.action_type === 'recipe') {
      const resolution = await resolveRecipeAction(result.parsed_recipe, menus, ingredients);
      if (!resolution.ok) {
        return res.json({ type: 'answer', message: resolution.clarification });
      }

      const existingRecipe = await prisma.recipeItem.findMany({
        where: { menuId: resolution.menu.id, businessId },
        include: { ingredient: true },
      });
      const oldRecipeText = existingRecipe.length > 0
        ? existingRecipe.map((r) => `${Number(r.qtyUsed)}${r.ingredient.unit} ${r.ingredient.name}`).join(', ')
        : null;
      const newRecipeText = resolution.ingredients.map((i) => `${i.qtyUsed}${i.unit} ${i.ingredientName}`).join(', ');

      const confirmationMessage = oldRecipeText
        ? `Saya akan MENGGANTI resep menu "${resolution.menu.name}" dari: ${oldRecipeText} — menjadi: ${newRecipeText}. Lanjutkan?`
        : `Menu "${resolution.menu.name}" belum punya resep. Saya akan mengatur resepnya menjadi: ${newRecipeText}. Lanjutkan?`;

      pendingActions.set(userId, {
        type: 'recipe',
        menuId: resolution.menu.id,
        menuName: resolution.menu.name,
        ingredients: resolution.ingredients,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      return res.json({
        type: 'confirmation',
        message: confirmationMessage,
        parsed_recipe: { menu_name: resolution.menu.name, ingredients: resolution.ingredients },
      });
    } else if (result.intent === 'action') {
      const items = result.parsed_items || [];
      pendingActions.set(userId, {
        type: 'restock',
        items,
        expiresAt: Date.now() + 5 * 60 * 1000
      });
      return res.json({
        type: 'confirmation',
        message: result.response,
        parsed_items: items
      });
    } else {
      return res.json({
        type: 'answer',
        message: result.response || aiResponseText
      });
    }
  } catch (err: any) {
    console.error('[handleChat Error]', err);
    return res.status(500).json({ error: 'Terjadi kesalahan internal server' });
  }
}

export async function confirmAction(req: AuthRequest, res: Response) {
  if (process.env.ENABLE_AI_CHAT !== 'true') {
    return res.status(503).json({ error: 'Fitur AI tidak aktif' });
  }

  const { confirmed } = req.body;
  if (confirmed === undefined) {
    return res.status(400).json({ error: 'Parameter confirmed wajib diisi' });
  }

  const userId = req.user?.id;
  const businessId = req.businessId;
  if (!userId || !businessId) {
    return res.status(401).json({ error: 'User tidak terautentikasi' });
  }

  try {
    if (confirmed === false) {
      pendingActions.delete(userId);
      return res.json({ success: false, message: 'Dibatalkan' });
    }

    // confirmed === true
    const action = pendingActions.get(userId);
    if (!action || Date.now() > action.expiresAt) {
      pendingActions.delete(userId);
      return res.status(400).json({ error: 'Tidak ada aksi pending. Mulai ulang dari chat.' });
    }

    if (action.type === 'recipe') {
      await prisma.$transaction(async (tx) => {
        await tx.recipeItem.deleteMany({ where: { menuId: action.menuId, businessId } });
        for (const ing of action.ingredients) {
          await tx.recipeItem.create({ data: { businessId, menuId: action.menuId, ingredientId: ing.ingredientId, qtyUsed: ing.qtyUsed } });
        }
      });

      const hpp = await recalculateMenuHpp(action.menuId, businessId);
      pendingActions.delete(userId);

      return res.json({
        success: true,
        menu: action.menuName,
        hpp,
        recipe: action.ingredients.map((i) => ({ name: i.ingredientName, qty: i.qtyUsed, unit: i.unit })),
      });
    }

    // Validasi semua bahan baku dulu
    const matchedIngredients: { item: ParsedItem; ing: Ingredient }[] = [];
    for (const item of action.items) {
      const ing = await prisma.ingredient.findFirst({
        where: { businessId, name: { contains: item.name, mode: 'insensitive' } }
      });
      if (!ing) {
        return res.status(400).json({ error: `Bahan baku '${item.name}' tidak dikenali` });
      }
      matchedIngredients.push({ item, ing });
    }

    // Jalankan DB updates
    const updatedResults: any[] = [];
    await prisma.$transaction(async (tx) => {
      for (const { item, ing } of matchedIngredients) {
        const newStock = Number(ing.stockQty) + Number(item.qty);
        const newPrice = Number(item.price_per_unit);

        await tx.ingredient.update({
          where: { id: ing.id, businessId },
          data: {
            stockQty: newStock,
            latestPrice: newPrice
          }
        });

        await tx.stockMovement.create({
          data: {
            businessId,
            ingredientId: ing.id,
            type: TypeMovement.restock,
            qtyChange: Number(item.qty),
            note: 'Restok otomatis via AI Chatbot',
            createdBy: userId
          }
        });

        await tx.ingredientPriceHistory.create({
          data: {
            businessId,
            ingredientId: ing.id,
            price: newPrice,
            recordedAt: new Date(),
            recordedBy: userId
          }
        });

        updatedResults.push({
          name: ing.name,
          qty_added: Number(item.qty),
          new_price: newPrice
        });
      }
    });

    // Hitung ulang HPP semua menu yang terpengaruh
    for (const { ing } of matchedIngredients) {
      await recalculateAllHppsForIngredient(ing.id, businessId);
    }

    // Hapus cache
    pendingActions.delete(userId);

    return res.json({
      success: true,
      updated: updatedResults
    });
  } catch (err: any) {
    console.error('[confirmAction Error]', err);
    return res.status(500).json({ error: 'Terjadi kesalahan internal server' });
  }
}
