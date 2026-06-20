const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/menus — semua menu + status ketersediaan
router.get('/', async (req, res, next) => {
  try {
    const menus = await prisma.menu.findMany({
      include: {
        recipe_items: {
          include: { ingredient: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(menus);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/menus
router.post('/', async (req, res, next) => {
  try {
    const { name, category, selling_price, image_url } = req.body;
    const menu = await prisma.menu.create({
      data: { name, category, selling_price, hpp: 0, is_available: true, image_url },
    });
    res.status(201).json(menu);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/menus/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, category, selling_price, image_url, is_available } = req.body;
    const menu = await prisma.menu.update({
      where: { id: req.params.id },
      data: { name, category, selling_price, image_url, is_available },
    });
    res.json(menu);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/menus/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.menu.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/menus/:id/recipe
router.get('/:id/recipe', async (req, res, next) => {
  try {
    const items = await prisma.recipeItem.findMany({
      where: { menu_id: req.params.id },
      include: { ingredient: true },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/menus/:id/recipe — replace all recipe items
router.put('/:id/recipe', async (req, res, next) => {
  try {
    const { items } = req.body; // [{ ingredient_id, qty_used }]
    await prisma.$transaction([
      prisma.recipeItem.deleteMany({ where: { menu_id: req.params.id } }),
      prisma.recipeItem.createMany({
        data: items.map((i) => ({
          menu_id: req.params.id,
          ingredient_id: i.ingredient_id,
          qty_used: i.qty_used,
        })),
      }),
    ]);
    // Hitung ulang HPP setelah resep berubah
    await recalculateHpp(req.params.id);
    const updated = await prisma.recipeItem.findMany({
      where: { menu_id: req.params.id },
      include: { ingredient: true },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

async function recalculateHpp(menuId) {
  const items = await prisma.recipeItem.findMany({
    where: { menu_id: menuId },
    include: { ingredient: true },
  });
  const hpp = items.reduce(
    (sum, item) => sum + Number(item.qty_used) * Number(item.ingredient.latest_price),
    0
  );
  await prisma.menu.update({ where: { id: menuId }, data: { hpp } });
}

module.exports = router;
