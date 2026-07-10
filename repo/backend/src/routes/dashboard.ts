import { Router, Response } from 'express';
import { prisma } from '../lib/db';
import { TransactionStatus } from '@prisma/client';
import { getMonthlySales, getVisitPatternByDay, getVisitPatternByHour, predictTopMenuTomorrow, getMenuBundleRecommendation } from '../lib/dashboard-insights';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    let dateStr = req.query.date as string;
    if (!dateStr) {
      const now = new Date();
      const gmt7 = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60 * 1000);
      dateStr = gmt7.toISOString().split('T')[0];
    }
    const start = new Date(`${dateStr}T00:00:00+07:00`), end = new Date(`${dateStr}T23:59:59.999+07:00`);
    const txs = await prisma.transaction.findMany({ where: { businessId, status: TransactionStatus.completed, completedAt: { gte: start, lte: end } }, include: { items: true } });
    let totalRevenue = 0, totalHpp = 0;
    const menuSales: Record<string, number> = {};
    for (const tx of txs) {
      totalRevenue += Number(tx.totalPrice); totalHpp += Number(tx.totalHpp);
      for (const item of tx.items) menuSales[item.menuName] = (menuSales[item.menuName] || 0) + item.qty;
    }
    const grossProfit = totalRevenue - totalHpp;
    let topMenuName = 'Tidak ada', maxQty = 0;
    for (const name in menuSales) { if (menuSales[name] > maxQty) { maxQty = menuSales[name]; topMenuName = name; } }
    const fmt = new Intl.NumberFormat('id-ID');
    return res.json({ date: dateStr, transactionsCount: txs.length, totalRevenue, totalHpp, grossProfit, topMenu: { name: topMenuName, quantity: maxQty }, summaryText: `Hari ini ${txs.length} transaksi, pendapatan Rp ${fmt.format(totalRevenue)}, estimasi laba Rp ${fmt.format(grossProfit)}. Menu terlaris: ${topMenuName}.` });
  } catch (e: any) { return res.status(500).json({ error: 'Gagal mengambil ringkasan dashboard.' }); }
});

// Tren penjualan bulanan (N bulan terakhir, default 6) — untuk grafik "bulan mana yang ramai" di dashboard
router.get('/monthly-sales', async (req: AuthRequest, res: Response) => {
  try {
    const months = parseInt((req.query.months as string) || '6', 10);
    const results = await getMonthlySales(req.businessId!, months);
    return res.json(results);
  } catch (e: any) {
    console.error('[monthly-sales]', e);
    return res.status(500).json({ error: 'Gagal mengambil data penjualan bulanan.' });
  }
});

// Pola kunjungan per hari (Senin-Minggu), rata-rata dari 4 minggu terakhir — proxy pakai jumlah transaksi selesai
router.get('/visit-pattern-by-day', async (req: AuthRequest, res: Response) => {
  try {
    const result = await getVisitPatternByDay(req.businessId!, 4);
    return res.json(result);
  } catch (e: any) {
    console.error('[visit-pattern-by-day]', e);
    return res.status(500).json({ error: 'Gagal mengambil pola kunjungan per hari.' });
  }
});

// Pola kunjungan per jam (0-23), total dari 4 minggu terakhir — proxy pakai jumlah transaksi selesai
router.get('/visit-pattern-by-hour', async (req: AuthRequest, res: Response) => {
  try {
    const result = await getVisitPatternByHour(req.businessId!, 4);
    return res.json(result);
  } catch (e: any) {
    console.error('[visit-pattern-by-hour]', e);
    return res.status(500).json({ error: 'Gagal mengambil pola kunjungan per jam.' });
  }
});

router.get('/top-menus', async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    let dateStr = req.query.date as string;
    const limit = parseInt((req.query.limit as string) || '5', 10);
    if (!dateStr) {
      const now = new Date();
      const gmt7 = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60 * 1000);
      dateStr = gmt7.toISOString().split('T')[0];
    }
    const start = new Date(`${dateStr}T00:00:00+07:00`), end = new Date(`${dateStr}T23:59:59.999+07:00`);
    const items = await prisma.transactionItem.findMany({ where: { businessId, transaction: { status: TransactionStatus.completed, completedAt: { gte: start, lte: end } } }, select: { menuId: true, menuName: true, qty: true, unitPrice: true, menu: { select: { imageUrl: true } } } });
    const agg: Record<string, { menuName: string; qty: number; totalSales: number; imageUrl: string | null }> = {};
    for (const item of items) {
      if (!agg[item.menuId]) agg[item.menuId] = { menuName: item.menuName, qty: 0, totalSales: 0, imageUrl: item.menu?.imageUrl ?? null };
      agg[item.menuId].qty += item.qty; agg[item.menuId].totalSales += Number(item.unitPrice) * item.qty;
    }
    return res.json(Object.entries(agg).map(([id, d]) => ({ id, name: d.menuName, quantitySold: d.qty, totalSales: d.totalSales, imageUrl: d.imageUrl })).sort((a, b) => b.quantitySold - a.quantitySold).slice(0, limit));
  } catch (e: any) { return res.status(500).json({ error: 'Gagal mengambil menu terlaris.' }); }
});

// Prediksi menu terlaris besok — rata-rata historis per hari-dalam-minggu yang sama
// (4 minggu terakhir), bukan AI/ML. Dipakai di samping card "Menu Terlaris Hari Ini".
router.get('/predict-top-menu-tomorrow', async (req: AuthRequest, res: Response) => {
  try {
    const result = await predictTopMenuTomorrow(req.businessId!, 4);
    return res.json(result);
  } catch (e: any) {
    console.error('[predict-top-menu-tomorrow]', e);
    return res.status(500).json({ error: 'Gagal membuat prediksi menu terlaris besok.' });
  }
});

// Rekomendasi bundling menu (co-occurrence 8 minggu terakhir) — insight murni, tidak
// membuat menu Paket baru secara otomatis.
router.get('/menu-bundle-recommendation', async (req: AuthRequest, res: Response) => {
  try {
    const result = await getMenuBundleRecommendation(req.businessId!, 8);
    return res.json(result);
  } catch (e: any) {
    console.error('[menu-bundle-recommendation]', e);
    return res.status(500).json({ error: 'Gagal membuat rekomendasi bundling menu.' });
  }
});

router.get('/critical-margins', async (req: AuthRequest, res: Response) => {
  try {
    const menus = await prisma.menu.findMany({ where: { businessId: req.businessId! }, orderBy: { name: 'asc' } });
    return res.json(menus.map(m => ({ id: m.id, name: m.name, category: m.category, sellingPrice: Number(m.sellingPrice), hpp: Number(m.hpp), marginRatio: Number(m.sellingPrice) > 0 ? Number(m.hpp) / Number(m.sellingPrice) : 0, isCritical: Number(m.sellingPrice) > 0 && Number(m.hpp) / Number(m.sellingPrice) > 0.8 })).filter(m => m.isCritical));
  } catch (e: any) { return res.status(500).json({ error: 'Gagal mengambil data margin kritis.' }); }
});

router.get('/price-alerts', async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const ings = await prisma.ingredient.findMany({ where: { businessId }, include: { recipes: { include: { menu: true } } } });
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const alerts = [];
    for (const ing of ings) {
      const currentPrice = Number(ing.latestPrice); if (currentPrice <= 0) continue;
      let baseline = await prisma.ingredientPriceHistory.findFirst({ where: { ingredientId: ing.id, businessId, recordedAt: { lte: thirtyDaysAgo } }, orderBy: { recordedAt: 'desc' } });
      if (!baseline) baseline = await prisma.ingredientPriceHistory.findFirst({ where: { ingredientId: ing.id, businessId }, orderBy: { recordedAt: 'asc' } });
      if (!baseline) continue;
      const baselinePrice = Number(baseline.price); if (baselinePrice <= 0) continue;
      const increaseRatio = (currentPrice - baselinePrice) / baselinePrice;
      if (increaseRatio > 0.20) alerts.push({ ingredientId: ing.id, ingredientName: ing.name, baselinePrice, currentPrice, increasePercent: increaseRatio * 100, affectedMenus: ing.recipes.map(r => ({ menuId: r.menu.id, menuName: r.menu.name, currentHpp: Number(r.menu.hpp), sellingPrice: Number(r.menu.sellingPrice) })) });
    }
    return res.json(alerts);
  } catch (e: any) { return res.status(500).json({ error: 'Gagal mengambil data peringatan harga.' }); }
});

router.get('/restock-recommendations', async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const txs = await prisma.transaction.findMany({ where: { businessId, status: TransactionStatus.completed, completedAt: { gte: sevenDaysAgo } }, include: { items: { include: { menu: { include: { recipes: true } } } } } });
    const totalUsage: Record<string, number> = {};
    for (const tx of txs) for (const item of tx.items) for (const r of item.menu.recipes) totalUsage[r.ingredientId] = (totalUsage[r.ingredientId] || 0) + Number(r.qtyUsed) * item.qty;
    const ings = await prisma.ingredient.findMany({ where: { businessId } });
    const recs = ings.map(ing => { const avg = (totalUsage[ing.id] || 0) / 7; const sisaHari = avg > 0 ? Number(ing.stockQty) / avg : 999; return { id: ing.id, name: ing.name, unit: ing.unit, stockQty: Number(ing.stockQty), minStockQty: Number(ing.minStockQty), avgConsumption7d: avg, sisaHari }; }).filter(r => r.sisaHari < 2).sort((a, b) => a.sisaHari - b.sisaHari);
    return res.json(recs);
  } catch (e: any) { return res.status(500).json({ error: 'Gagal mengambil rekomendasi restok.' }); }
});

router.get('/summary-range', async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { startDate, endDate } = req.query as { startDate: string, endDate: string };
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate dan endDate wajib diisi.' });

    const start = new Date(`${startDate}T00:00:00+07:00`);
    const end = new Date(`${endDate}T23:59:59.999+07:00`);

    const txs = await prisma.transaction.findMany({
      where: { businessId, status: TransactionStatus.completed, completedAt: { gte: start, lte: end } },
      include: { items: true }
    });

    let totalRevenue = 0, totalHpp = 0;
    const menuSales: Record<string, number> = {};
    for (const tx of txs) {
      totalRevenue += Number(tx.totalPrice);
      totalHpp += Number(tx.totalHpp);
      for (const item of tx.items) menuSales[item.menuName] = (menuSales[item.menuName] || 0) + item.qty;
    }
    const grossProfit = totalRevenue - totalHpp;
    let topMenuName = 'Tidak ada', maxQty = 0;
    for (const name in menuSales) {
      if (menuSales[name] > maxQty) { maxQty = menuSales[name]; topMenuName = name; }
    }
    const fmt = new Intl.NumberFormat('id-ID');
    return res.json({
      startDate, endDate,
      transactionsCount: txs.length,
      totalRevenue, totalHpp, grossProfit,
      topMenu: { name: topMenuName, quantity: maxQty },
      summaryText: `Periode ini terdapat ${txs.length} transaksi, pendapatan Rp ${fmt.format(totalRevenue)}, estimasi laba Rp ${fmt.format(grossProfit)}. Menu terlaris: ${topMenuName}.`
    });
  } catch (e: any) {
    console.error('[summary-range]', e);
    return res.status(500).json({ error: 'Gagal mengambil ringkasan rentang waktu.' });
  }
});

router.get('/top-menus-range', async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { startDate, endDate } = req.query as { startDate: string, endDate: string };
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate dan endDate wajib diisi.' });

    const limit = parseInt((req.query.limit as string) || '5', 10);
    const start = new Date(`${startDate}T00:00:00+07:00`);
    const end = new Date(`${endDate}T23:59:59.999+07:00`);

    const items = await prisma.transactionItem.findMany({
      where: { businessId, transaction: { status: TransactionStatus.completed, completedAt: { gte: start, lte: end } } },
      select: { menuId: true, menuName: true, qty: true, unitPrice: true }
    });

    const agg: Record<string, { menuName: string; qty: number; totalSales: number }> = {};
    for (const item of items) {
      if (!agg[item.menuId]) agg[item.menuId] = { menuName: item.menuName, qty: 0, totalSales: 0 };
      agg[item.menuId].qty += item.qty;
      agg[item.menuId].totalSales += Number(item.unitPrice) * item.qty;
    }
    return res.json(Object.entries(agg)
      .map(([id, d]) => ({ id, name: d.menuName, quantitySold: d.qty, totalSales: d.totalSales }))
      .sort((a, b) => b.quantitySold - a.quantitySold).slice(0, limit));
  } catch (e: any) {
    console.error('[top-menus-range]', e);
    return res.status(500).json({ error: 'Gagal mengambil menu terlaris dalam rentang waktu.' });
  }
});

router.get('/price-alerts-range', async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { startDate, endDate } = req.query as { startDate: string, endDate: string };
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate dan endDate wajib diisi.' });

    const start = new Date(`${startDate}T23:59:59.999+07:00`); // Actually we just need records on/before start Date as baseline
    const end = new Date(`${endDate}T23:59:59.999+07:00`);

    const ings = await prisma.ingredient.findMany({ where: { businessId }, include: { recipes: { include: { menu: true } } } });
    const alerts = [];

    for (const ing of ings) {
      let baseline = await prisma.ingredientPriceHistory.findFirst({
        where: { ingredientId: ing.id, businessId, recordedAt: { lte: start } },
        orderBy: { recordedAt: 'desc' }
      });
      if (!baseline) {
        baseline = await prisma.ingredientPriceHistory.findFirst({
          where: { ingredientId: ing.id, businessId },
          orderBy: { recordedAt: 'asc' }
        });
      }
      if (!baseline) continue;

      let current = await prisma.ingredientPriceHistory.findFirst({
        where: { ingredientId: ing.id, businessId, recordedAt: { lte: end } },
        orderBy: { recordedAt: 'desc' }
      });
      if (!current || current.id === baseline.id) continue;

      const baselinePrice = Number(baseline.price);
      const currentPrice = Number(current.price);

      if (baselinePrice <= 0 || currentPrice <= 0) continue;

      const increaseRatio = (currentPrice - baselinePrice) / baselinePrice;
      if (increaseRatio > 0.20) {
        alerts.push({
          ingredientId: ing.id,
          ingredientName: ing.name,
          baselinePrice,
          currentPrice,
          increasePercent: increaseRatio * 100,
          affectedMenus: ing.recipes.map(r => ({ menuId: r.menu.id, menuName: r.menu.name, currentHpp: Number(r.menu.hpp) }))
        });
      }
    }
    return res.json(alerts);
  } catch (e: any) {
    console.error('[price-alerts-range]', e);
    return res.status(500).json({ error: 'Gagal mengambil peringatan harga dalam rentang.' });
  }
});

router.get('/critical-margins-range', async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { startDate, endDate } = req.query as { startDate: string, endDate: string };
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate dan endDate wajib diisi.' });

    const thresholdStr = req.query.threshold as string || '80';
    const threshold = parseFloat(thresholdStr) / 100;

    const start = new Date(`${startDate}T00:00:00+07:00`);
    const end = new Date(`${endDate}T23:59:59.999+07:00`);

    const histories = await prisma.menuHppHistory.findMany({
      where: { businessId, recordedAt: { gte: start, lte: end } },
      include: { menu: true },
    });

    const maxMargins: Record<string, any> = {};

    for (const h of histories) {
      const hpp = Number(h.hpp);
      const selling = Number(h.sellingPrice);
      if (selling <= 0) continue;

      const ratio = hpp / selling;
      if (ratio > threshold) {
        if (!maxMargins[h.menuId] || ratio > maxMargins[h.menuId].marginRatio) {
          maxMargins[h.menuId] = {
            id: h.menuId,
            name: h.menu.name,
            category: h.menu.category,
            sellingPrice: selling,
            hpp: hpp,
            marginRatio: ratio,
            recordedAt: h.recordedAt, // Keep track of when this highest ratio occurred
          };
        }
      }
    }
    return res.json(Object.values(maxMargins));
  } catch (e: any) {
    console.error('[critical-margins-range]', e);
    return res.status(500).json({ error: 'Gagal mengambil margin kritis dalam rentang.' });
  }
});

export default router;
