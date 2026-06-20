const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/v1/transactions — buat transaksi baru (status: pending)
router.post('/', async (req, res, next) => {
  try {
    const { cashier_id, payment_method, items } = req.body;
    // items: [{ menu_id, qty }]

    const menuIds = items.map((i) => i.menu_id);
    const menus = await prisma.menu.findMany({
      where: { id: { in: menuIds } },
    });
    const menuMap = Object.fromEntries(menus.map((m) => [m.id, m]));

    const total_price = items.reduce(
      (sum, i) => sum + Number(menuMap[i.menu_id].selling_price) * i.qty,
      0
    );
    const total_hpp = items.reduce(
      (sum, i) => sum + Number(menuMap[i.menu_id].hpp) * i.qty,
      0
    );

    const transaction = await prisma.transaction.create({
      data: {
        cashier_id,
        payment_method,
        status: 'pending',
        total_price,
        total_hpp,
        transaction_items: {
          create: items.map((i) => ({
            menu_id: i.menu_id,
            menu_name: menuMap[i.menu_id].name,
            qty: i.qty,
            unit_price: menuMap[i.menu_id].selling_price,
            unit_hpp: menuMap[i.menu_id].hpp,
          })),
        },
      },
      include: { transaction_items: true },
    });

    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/transactions/:id/complete — selesaikan transaksi & kurangi stok
router.post('/:id/complete', async (req, res, next) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        transaction_items: {
          include: {
            menu: {
              include: { recipe_items: { include: { ingredient: true } } },
            },
          },
        },
      },
    });

    if (!transaction) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: `Transaksi sudah ${transaction.status}` });
    }

    // Hitung total perubahan stok per bahan baku
    const stockChanges = {};
    for (const item of transaction.transaction_items) {
      for (const ri of item.menu.recipe_items) {
        const delta = Number(ri.qty_used) * item.qty;
        stockChanges[ri.ingredient_id] = (stockChanges[ri.ingredient_id] || 0) + delta;
      }
    }

    // Verifikasi stok mencukupi sebelum commit
    for (const [ingId, used] of Object.entries(stockChanges)) {
      const ing = await prisma.ingredient.findUnique({ where: { id: ingId } });
      if (Number(ing.stock_qty) < used) {
        return res.status(422).json({
          error: `Stok ${ing.name} tidak mencukupi (perlu ${used} ${ing.unit}, sisa ${ing.stock_qty})`,
        });
      }
    }

    // Atomic: update transaksi + kurangi stok + catat stock_movements
    const now = new Date();
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: req.params.id },
        data: { status: 'completed', completed_at: now },
      }),
      ...Object.entries(stockChanges).map(([ingId, delta]) =>
        prisma.ingredient.update({
          where: { id: ingId },
          data: { stock_qty: { decrement: delta } },
        })
      ),
      ...Object.entries(stockChanges).map(([ingId, delta]) =>
        prisma.stockMovement.create({
          data: {
            ingredient_id: ingId,
            type: 'usage',
            qty_change: -delta,
            note: `Transaksi #${req.params.id}`,
            created_by: transaction.cashier_id,
          },
        })
      ),
    ]);

    // Update is_available semua menu yang terpengaruh
    await updateMenuAvailability(Object.keys(stockChanges));

    const completed = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: { transaction_items: true },
    });
    res.json(completed);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/transactions/:id/cancel — batalkan tanpa memotong stok
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const transaction = await prisma.transaction.findUnique({ where: { id: req.params.id } });
    if (!transaction) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: `Tidak bisa membatalkan transaksi ${transaction.status}` });
    }
    const updated = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/transactions/:id — detail untuk struk digital
router.get('/:id', async (req, res, next) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: { transaction_items: true, cashier: { select: { name: true } } },
    });
    if (!transaction) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    res.json(transaction);
  } catch (err) {
    next(err);
  }
});

async function updateMenuAvailability(ingredientIds) {
  const affectedMenuIds = await prisma.recipeItem.findMany({
    where: { ingredient_id: { in: ingredientIds } },
    select: { menu_id: true },
    distinct: ['menu_id'],
  });

  for (const { menu_id } of affectedMenuIds) {
    const recipe = await prisma.recipeItem.findMany({
      where: { menu_id },
      include: { ingredient: true },
    });
    const canMake = recipe.every(
      (ri) => Number(ri.ingredient.stock_qty) >= Number(ri.qty_used)
    );
    await prisma.menu.update({ where: { id: menu_id }, data: { is_available: canMake } });
  }
}

module.exports = router;
