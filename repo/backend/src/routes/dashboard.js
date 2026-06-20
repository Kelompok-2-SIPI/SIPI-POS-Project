const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/dashboard/summary?date=YYYY-MM-DD
router.get('/summary', async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: { status: 'completed', completed_at: { gte: start, lte: end } },
    });

    const totalRevenue = transactions.reduce((s, t) => s + Number(t.total_price), 0);
    const totalHpp = transactions.reduce((s, t) => s + Number(t.total_hpp), 0);
    const estimatedProfit = totalRevenue - totalHpp;
    const count = transactions.length;

    const topMenu = await prisma.transactionItem.groupBy({
      by: ['menu_name'],
      where: {
        transaction: { status: 'completed', completed_at: { gte: start, lte: end } },
      },
      _sum: { qty: true },
      orderBy: { _sum: { qty: 'desc' } },
      take: 1,
    });

    const summaryText = `Hari ini ${count} transaksi, pendapatan Rp ${totalRevenue.toLocaleString('id-ID')}, estimasi laba Rp ${estimatedProfit.toLocaleString('id-ID')}. Menu terlaris: ${topMenu[0]?.menu_name ?? '-'}.`;

    res.json({ count, totalRevenue, totalHpp, estimatedProfit, summaryText });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard/top-menus?date=YYYY-MM-DD&limit=5
router.get('/top-menus', async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const limit = parseInt(req.query.limit) || 5;
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);

    const topMenus = await prisma.transactionItem.groupBy({
      by: ['menu_id', 'menu_name'],
      where: {
        transaction: { status: 'completed', completed_at: { gte: start, lte: end } },
      },
      _sum: { qty: true },
      orderBy: { _sum: { qty: 'desc' } },
      take: limit,
    });

    res.json(topMenus);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard/critical-margins
router.get('/critical-margins', async (req, res, next) => {
  try {
    const menus = await prisma.menu.findMany();
    const critical = menus.filter(
      (m) => Number(m.hpp) / Number(m.selling_price) > 0.8
    ).map((m) => ({
      ...m,
      hpp_ratio: Number(m.hpp) / Number(m.selling_price),
      recommended_price: Math.ceil((Number(m.hpp) / 0.5) / 1000) * 1000,
    }));
    res.json(critical);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard/price-alerts
router.get('/price-alerts', async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const ingredients = await prisma.ingredient.findMany({
      include: {
        price_history: {
          where: { recorded_at: { gte: sevenDaysAgo } },
          orderBy: { recorded_at: 'asc' },
        },
        recipe_items: { include: { menu: true } },
      },
    });

    const alerts = ingredients
      .filter((ing) => ing.price_history.length >= 2)
      .map((ing) => {
        const oldest = Number(ing.price_history[0].price);
        const newest = Number(ing.price_history[ing.price_history.length - 1].price);
        const changePercent = ((newest - oldest) / oldest) * 100;
        return { ingredient: ing, changePercent, affectedMenus: ing.recipe_items.map((ri) => ri.menu) };
      })
      .filter((a) => a.changePercent > 20);

    res.json(alerts);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard/restock-recommendations
router.get('/restock-recommendations', async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const ingredients = await prisma.ingredient.findMany({
      include: {
        stock_movements: {
          where: { type: 'usage', created_at: { gte: sevenDaysAgo } },
        },
      },
    });

    const recommendations = ingredients
      .map((ing) => {
        const totalUsed = ing.stock_movements.reduce(
          (s, m) => s + Math.abs(Number(m.qty_change)), 0
        );
        const avgDailyUsage = totalUsed / 7;
        const daysRemaining = avgDailyUsage > 0 ? Number(ing.stock_qty) / avgDailyUsage : Infinity;
        return { ingredient: ing, avgDailyUsage, daysRemaining };
      })
      .filter((r) => r.daysRemaining < 2)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    res.json(recommendations);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
