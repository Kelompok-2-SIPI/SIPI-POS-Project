import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
import { recalculateAllHppsForIngredient } from '../lib/inventory-helpers';
import { TypeMovement } from '@prisma/client';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const ings = await prisma.ingredient.findMany({ orderBy: { name: 'asc' } });
    return res.json(ings.map(i => ({ id: i.id, name: i.name, unit: i.unit, stockQty: Number(i.stockQty), minStockQty: Number(i.minStockQty), latestPrice: Number(i.latestPrice), createdAt: i.createdAt })));
  } catch (e: any) { return res.status(500).json({ error: 'Gagal mengambil data bahan baku.' }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, unit, stockQty, minStockQty, latestPrice } = req.body;
    if (!name || !unit || stockQty === undefined || minStockQty === undefined || latestPrice === undefined)
      return res.status(400).json({ error: 'Nama, satuan, stok awal, stok minimal, dan harga beli wajib diisi.' });
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) return res.status(500).json({ error: 'User tidak ditemukan.' });
    const ingredient = await prisma.$transaction(async (tx) => {
      const ing = await tx.ingredient.create({ data: { name, unit, stockQty: Number(stockQty), minStockQty: Number(minStockQty), latestPrice: Number(latestPrice) } });
      await tx.ingredientPriceHistory.create({ data: { ingredientId: ing.id, price: Number(latestPrice), recordedAt: new Date(), recordedBy: defaultUser.id } });
      await tx.stockMovement.create({ data: { ingredientId: ing.id, type: TypeMovement.restock, qtyChange: Number(stockQty), note: 'Stok awal pendaftaran bahan baku', createdBy: defaultUser.id } });
      return ing;
    });
    return res.status(201).json({ success: true, ingredient: { ...ingredient, stockQty: Number(ingredient.stockQty), minStockQty: Number(ingredient.minStockQty), latestPrice: Number(ingredient.latestPrice) } });
  } catch (e: any) { return res.status(500).json({ error: 'Gagal menambahkan bahan baku baru.' }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, unit, minStockQty } = req.body;
    if (!name || !unit || minStockQty === undefined)
      return res.status(400).json({ error: 'Nama, satuan, dan stok minimal wajib diisi.' });
    const updated = await prisma.ingredient.update({ where: { id: req.params.id }, data: { name, unit, minStockQty: Number(minStockQty) } });
    return res.json({ success: true, ingredient: { ...updated, stockQty: Number(updated.stockQty), minStockQty: Number(updated.minStockQty), latestPrice: Number(updated.latestPrice) } });
  } catch (e: any) { return res.status(500).json({ error: 'Gagal memperbarui data bahan baku.' }); }
});

router.post('/:id/restock', async (req: Request, res: Response) => {
  try {
    const { qtyChange, note } = req.body;
    if (qtyChange === undefined || Number(qtyChange) <= 0)
      return res.status(400).json({ error: 'Kuantitas tambahan harus berupa angka positif.' });
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) return res.status(500).json({ error: 'User tidak ditemukan.' });
    const updated = await prisma.$transaction(async (tx) => {
      const ing = await tx.ingredient.findUnique({ where: { id: req.params.id } });
      if (!ing) throw new Error('Bahan baku tidak ditemukan.');
      const updatedIng = await tx.ingredient.update({ where: { id: req.params.id }, data: { stockQty: Number(ing.stockQty) + Number(qtyChange) } });
      await tx.stockMovement.create({ data: { ingredientId: req.params.id, type: TypeMovement.restock, qtyChange: Number(qtyChange), note: note || 'Restok barang', createdBy: defaultUser.id } });
      return updatedIng;
    });
    return res.json({ success: true, stockQty: Number(updated.stockQty) });
  } catch (e: any) { return res.status(500).json({ error: e.message || 'Gagal melakukan restok bahan baku.' }); }
});

router.get('/:id/price-history', async (req: Request, res: Response) => {
  try {
    const history = await prisma.ingredientPriceHistory.findMany({ where: { ingredientId: req.params.id }, orderBy: { recordedAt: 'desc' }, include: { user: { select: { name: true } } } });
    return res.json(history.map(h => ({ id: h.id, price: Number(h.price), recordedAt: h.recordedAt, recordedBy: h.user.name })));
  } catch (e: any) { return res.status(500).json({ error: 'Gagal mengambil riwayat harga.' }); }
});

router.post('/:id/price-history', async (req: Request, res: Response) => {
  try {
    const { price, recordedAt } = req.body;
    if (price === undefined || Number(price) <= 0) return res.status(400).json({ error: 'Harga harus berupa angka positif.' });
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) return res.status(500).json({ error: 'User tidak ditemukan.' });
    await prisma.$transaction(async (tx) => {
      const ing = await tx.ingredient.findUnique({ where: { id: req.params.id } });
      if (!ing) throw new Error('Bahan baku tidak ditemukan.');
      await tx.ingredient.update({ where: { id: req.params.id }, data: { latestPrice: Number(price) } });
      await tx.ingredientPriceHistory.create({ data: { ingredientId: req.params.id, price: Number(price), recordedAt: recordedAt ? new Date(recordedAt) : new Date(), recordedBy: defaultUser.id } });
    });
    await recalculateAllHppsForIngredient(req.params.id);
    return res.json({ success: true, latestPrice: Number(price) });
  } catch (e: any) { return res.status(500).json({ error: e.message || 'Gagal mencatat harga beli baru.' }); }
});

export default router;
