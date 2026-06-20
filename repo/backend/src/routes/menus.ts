import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
import { getMenusWithAvailability, recalculateMenuHpp } from '../lib/inventory-helpers';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    return res.json(await getMenusWithAvailability());
  } catch (e: any) { return res.status(500).json({ error: 'Gagal mengambil data menu.' }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, category, sellingPrice, recipe } = req.body;
    if (!name || !category || sellingPrice === undefined)
      return res.status(400).json({ error: 'Nama, kategori, dan harga jual wajib diisi.' });
    const menu = await prisma.menu.create({ data: { name, category, sellingPrice: Number(sellingPrice), hpp: 0 } });
    if (recipe && Array.isArray(recipe)) {
      for (const r of recipe) {
        if (!r.ingredientId || !r.qtyUsed) continue;
        await prisma.recipeItem.create({ data: { menuId: menu.id, ingredientId: r.ingredientId, qtyUsed: Number(r.qtyUsed) } });
      }
    }
    const hpp = await recalculateMenuHpp(menu.id);
    return res.status(201).json({ success: true, menu: { ...menu, hpp } });
  } catch (e: any) { return res.status(500).json({ error: 'Gagal membuat menu baru.' }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, category, sellingPrice } = req.body;
    if (!name || !category || sellingPrice === undefined)
      return res.status(400).json({ error: 'Nama, kategori, dan harga jual wajib diisi.' });
    const updated = await prisma.menu.update({ where: { id: req.params.id }, data: { name, category, sellingPrice: Number(sellingPrice) } });
    const hpp = await recalculateMenuHpp(req.params.id);
    return res.json({ success: true, menu: { ...updated, hpp } });
  } catch (e: any) { return res.status(500).json({ error: 'Gagal memperbarui menu.' }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.menu.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (e: any) { return res.status(500).json({ error: 'Gagal menghapus menu.' }); }
});

router.get('/:id/recipe', async (req: Request, res: Response) => {
  try {
    const recipes = await prisma.recipeItem.findMany({ where: { menuId: req.params.id }, include: { ingredient: true } });
    return res.json(recipes.map(r => ({ id: r.id, ingredientId: r.ingredientId, ingredientName: r.ingredient.name, unit: r.ingredient.unit, qtyUsed: Number(r.qtyUsed) })));
  } catch (e: any) { return res.status(500).json({ error: 'Gagal mengambil resep menu.' }); }
});

router.put('/:id/recipe', async (req: Request, res: Response) => {
  try {
    const { recipe } = req.body;
    if (!recipe || !Array.isArray(recipe)) return res.status(400).json({ error: 'Format resep salah.' });
    await prisma.$transaction(async (tx) => {
      await tx.recipeItem.deleteMany({ where: { menuId: req.params.id } });
      for (const item of recipe) {
        if (!item.ingredientId || item.qtyUsed === undefined || Number(item.qtyUsed) <= 0) continue;
        await tx.recipeItem.create({ data: { menuId: req.params.id, ingredientId: item.ingredientId, qtyUsed: Number(item.qtyUsed) } });
      }
    });
    const hpp = await recalculateMenuHpp(req.params.id);
    return res.json({ success: true, hpp });
  } catch (e: any) { return res.status(500).json({ error: 'Gagal memperbarui resep menu.' }); }
});

export default router;
