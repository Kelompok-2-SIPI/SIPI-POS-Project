import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { TypeMovement, TransactionStatus, Ingredient } from '@prisma/client';
import { recalculateAllHppsForIngredient } from '../lib/inventory-helpers';
import { getMonthlySales, getVisitPatternByDay, getVisitPatternByHour } from '../lib/dashboard-insights';
import { generateResponse } from '../lib/gemini';

interface ParsedItem {
  name: string;
  qty: number;            // dalam satuan dasar (gram/ml/pcs)
  unit: string;
  price_per_unit: number;
}

const pendingActions = new Map<string, { items: ParsedItem[]; expiresAt: number }>();

function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '');
    cleaned = cleaned.replace(/\n```$/, '');
  }
  return cleaned.trim();
}

export async function handleChat(req: Request, res: Response) {
  if (process.env.ENABLE_AI_CHAT !== 'true') {
    return res.status(503).json({ error: 'Fitur AI tidak aktif' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
  }

  // Get current authenticated user
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'User tidak terautentikasi' });
  }

  try {
    // 1. Get today's local date (GMT+7)
    const now = new Date();
    const gmt7 = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60 * 1000);
    const dateStr = gmt7.toISOString().split('T')[0];

    const start = new Date(`${dateStr}T00:00:00+07:00`);
    const end = new Date(`${dateStr}T23:59:59.999+07:00`);

    // 2. Query today's completed transactions
    const txs = await prisma.transaction.findMany({
      where: {
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
      orderBy: { name: 'asc' }
    });

    // 4. Query menus for critical margins
    const menus = await prisma.menu.findMany({
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

    // 7b. Reuse service yang sama dipakai dashboard (MonthlySalesChart, Pola Pengunjung Mingguan, Jam Tersibuk)
    const fmtRp = new Intl.NumberFormat('id-ID');
    const [monthlySales, visitByDay, visitByHour] = await Promise.all([
      getMonthlySales(6),
      getVisitPatternByDay(4),
      getVisitPatternByHour(4),
    ]);

    const monthlySalesText = monthlySales
      .map(m => `- ${m.label}: Rp ${fmtRp.format(m.totalRevenue)} (${m.transactionsCount} transaksi)`)
      .join('\n');
    const busiestMonth = monthlySales.reduce((max, m) => (m.totalRevenue > max.totalRevenue ? m : max), monthlySales[0]);
    const monthlySalesSummary = monthlySales.length > 0
      ? `Bulan paling tinggi pendapatannya: ${busiestMonth.label} (Rp ${fmtRp.format(busiestMonth.totalRevenue)}).`
      : 'Belum ada data.';

    const visitByDayText = visitByDay.data
      .map(d => `- ${d.day}: rata-rata ${d.avgTransactions} transaksi/hari`)
      .join('\n');

    const visitByHourActive = visitByHour.data.filter(h => h.totalTransactions > 0);
    const visitByHourText = visitByHourActive
      .map(h => `- Jam ${String(h.hour).padStart(2, '0')}:00: ${h.totalTransactions} transaksi`)
      .join('\n');

    // 8. Susun system prompt
    const systemPrompt = `Kamu adalah asisten bisnis SIPI untuk UMKM F&B ini.
Kamu punya DUA kemampuan:
1. MENJAWAB PERTANYAAN bisnis berdasarkan data di bawah.
2. MEMPROSES LAPORAN BELANJA — jika Owner menyebut nama bahan baku + kuantitas + harga,
   ekstrak dan kembalikan sebagai JSON dengan intent "action".

=== DATA BISNIS HARI INI (${dateStr}) ===
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

=== POLA PENGUNJUNG MINGGUAN (rata-rata 4 minggu terakhir, proxy jumlah transaksi selesai) ===
${visitByDayText}
Hari paling ramai: ${visitByDay.busiestDay.day} (rata-rata ${visitByDay.busiestDay.avgTransactions} transaksi/hari).

=== JAM TERSIBUK (total 4 minggu terakhir, jam operasional saja, proxy jumlah transaksi selesai) ===
${visitByHourText}
Jam paling sibuk: ${String(visitByHour.busiestHour.hour).padStart(2, '0')}:00 WIB (${visitByHour.busiestHour.totalTransactions} transaksi).

FORMAT OUTPUT — selalu kembalikan JSON valid:
{
  "intent": "qa" atau "action",
  "response": "teks balasan Bahasa Indonesia",
  "parsed_items": [
    { "name": "gula", "qty": 2000, "unit": "g", "price_per_unit": 9000 }
  ]
}

ATURAN:
- Konversi ke satuan dasar DB (kg → g × 1000, dst.)
- Harga per unit = total harga ÷ kuantitas
- Jangan mengarang data di luar konteks di atas
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

    if (result.intent === 'action') {
      const items = result.parsed_items || [];
      pendingActions.set(userId, {
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

export async function confirmAction(req: Request, res: Response) {
  if (process.env.ENABLE_AI_CHAT !== 'true') {
    return res.status(503).json({ error: 'Fitur AI tidak aktif' });
  }

  const { confirmed } = req.body;
  if (confirmed === undefined) {
    return res.status(400).json({ error: 'Parameter confirmed wajib diisi' });
  }

  const userId = (req as any).user?.id;
  if (!userId) {
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

    // Validasi semua bahan baku dulu
    const matchedIngredients: { item: ParsedItem; ing: Ingredient }[] = [];
    for (const item of action.items) {
      const ing = await prisma.ingredient.findFirst({
        where: { name: { contains: item.name, mode: 'insensitive' } }
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
          where: { id: ing.id },
          data: {
            stockQty: newStock,
            latestPrice: newPrice
          }
        });

        await tx.stockMovement.create({
          data: {
            ingredientId: ing.id,
            type: TypeMovement.restock,
            qtyChange: Number(item.qty),
            note: 'Restok otomatis via AI Chatbot',
            createdBy: userId
          }
        });

        await tx.ingredientPriceHistory.create({
          data: {
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
      await recalculateAllHppsForIngredient(ing.id);
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
