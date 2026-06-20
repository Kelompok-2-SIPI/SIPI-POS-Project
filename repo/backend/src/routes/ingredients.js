const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/ingredients
router.get('/', async (req, res, next) => {
  try {
    const ingredients = await prisma.ingredient.findMany({ orderBy: { name: 'asc' } });
    res.json(ingredients);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/ingredients
router.post('/', async (req, res, next) => {
  try {
    const { name, unit, stock_qty, min_stock_qty, latest_price } = req.body;
    const ingredient = await prisma.ingredient.create({
      data: { name, unit, stock_qty: stock_qty || 0, min_stock_qty: min_stock_qty || 0, latest_price: latest_price || 0 },
    });
    res.status(201).json(ingredient);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/ingredients/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, unit, min_stock_qty } = req.body;
    const ingredient = await prisma.ingredient.update({
      where: { id: req.params.id },
      data: { name, unit, min_stock_qty },
    });
    res.json(ingredient);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/ingredients/:id/restock
router.post('/:id/restock', async (req, res, next) => {
  try {
    const { qty, note, created_by } = req.body;
    if (!qty || qty <= 0) return res.status(400).json({ error: 'qty harus positif' });

    const [ingredient, movement] = await prisma.$transaction([
      prisma.ingredient.update({
        where: { id: req.params.id },
        data: { stock_qty: { increment: qty } },
      }),
      prisma.stockMovement.create({
        data: {
          ingredient_id: req.params.id,
          type: 'restock',
          qty_change: qty,
          note: note || null,
          created_by,
        },
      }),
    ]);
    res.json({ ingredient, movement });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/ingredients/:id/price-history
router.get('/:id/price-history', async (req, res, next) => {
  try {
    const history = await prisma.ingredientPriceHistory.findMany({
      where: { ingredient_id: req.params.id },
      orderBy: { recorded_at: 'desc' },
    });
    res.json(history);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/ingredients/:id/price-history
router.post('/:id/price-history', async (req, res, next) => {
  try {
    const { price, recorded_at, recorded_by } = req.body;
    const [entry] = await prisma.$transaction([
      prisma.ingredientPriceHistory.create({
        data: {
          ingredient_id: req.params.id,
          price,
          recorded_at: new Date(recorded_at),
          recorded_by,
        },
      }),
      prisma.ingredient.update({
        where: { id: req.params.id },
        data: { latest_price: price },
      }),
    ]);
    // Hitung ulang HPP semua menu yang menggunakan bahan ini
    await recalculateAffectedMenus(req.params.id);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

async function recalculateAffectedMenus(ingredientId) {
  const affectedMenuIds = await prisma.recipeItem.findMany({
    where: { ingredient_id: ingredientId },
    select: { menu_id: true },
    distinct: ['menu_id'],
  });

  for (const { menu_id } of affectedMenuIds) {
    const items = await prisma.recipeItem.findMany({
      where: { menu_id },
      include: { ingredient: true },
    });
    const hpp = items.reduce(
      (sum, item) => sum + Number(item.qty_used) * Number(item.ingredient.latest_price),
      0
    );
    await prisma.menu.update({ where: { id: menu_id }, data: { hpp } });
  }
}

module.exports = router;
