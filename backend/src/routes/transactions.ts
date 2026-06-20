import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
import { TransactionStatus, PaymentMethod, TypeMovement } from '@prisma/client';
import { completeTransactionInTx } from '../lib/transaction-helpers';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const txs = await prisma.transaction.findMany({ orderBy: { createdAt: 'desc' }, take: 20, include: { items: true } });
    return res.json(txs.map(t => ({ id: t.id, status: t.status, paymentMethod: t.paymentMethod, totalPrice: Number(t.totalPrice), totalHpp: Number(t.totalHpp), createdAt: t.createdAt, completedAt: t.completedAt, itemsCount: t.items.length })));
  } catch (e: any) { return res.status(500).json({ error: 'Gagal mengambil data transaksi.' }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { items, paymentMethod, status = TransactionStatus.completed } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0 || !paymentMethod)
      return res.status(400).json({ error: 'Items dan metode pembayaran wajib diisi.' });
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) return res.status(500).json({ error: 'User tidak ditemukan.' });
    const result = await prisma.$transaction(async (tx) => {
      const menus = await tx.menu.findMany({ where: { id: { in: items.map((i: any) => i.menuId) } } });
      let totalPrice = 0, totalHpp = 0;
      const itemDataList: any[] = [];
      for (const item of items) {
        const menu = menus.find((m) => m.id === item.menuId);
        if (!menu) throw new Error(`Menu dengan ID ${item.menuId} tidak ditemukan.`);
        const qty = Number(item.qty);
        totalPrice += Number(menu.sellingPrice) * qty;
        totalHpp += Number(menu.hpp) * qty;
        itemDataList.push({ menuId: menu.id, menuName: menu.name, qty, unitPrice: menu.sellingPrice, unitHpp: menu.hpp });
      }
      const transaction = await tx.transaction.create({ data: { status: TransactionStatus.pending, paymentMethod: paymentMethod as PaymentMethod, totalPrice, totalHpp, cashierId: defaultUser.id, items: { create: itemDataList } } });
      if (status === TransactionStatus.completed) return await completeTransactionInTx(transaction.id, tx);
      return await tx.transaction.findUnique({ where: { id: transaction.id }, include: { items: true } });
    });
    return res.status(201).json({ success: true, transaction: { id: result!.id, status: result!.status, paymentMethod: result!.paymentMethod, totalPrice: Number(result!.totalPrice), totalHpp: Number(result!.totalHpp), createdAt: result!.createdAt, completedAt: result!.completedAt, items: (result!.items as any[]).map((i: any) => ({ menuId: i.menuId, menuName: i.menuName, qty: i.qty, unitPrice: Number(i.unitPrice), unitHpp: Number(i.unitHpp) })) } });
  } catch (e: any) { return res.status(500).json({ error: e.message || 'Gagal memproses transaksi.' }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const t = await prisma.transaction.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!t) return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
    return res.json({ id: t.id, status: t.status, paymentMethod: t.paymentMethod, totalPrice: Number(t.totalPrice), totalHpp: Number(t.totalHpp), createdAt: t.createdAt, completedAt: t.completedAt, items: t.items.map(i => ({ id: i.id, menuId: i.menuId, menuName: i.menuName, qty: i.qty, unitPrice: Number(i.unitPrice), unitHpp: Number(i.unitHpp) })) });
  } catch (e: any) { return res.status(500).json({ error: 'Gagal mengambil detail transaksi.' }); }
});

router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const result = await prisma.$transaction(async (tx) => completeTransactionInTx(req.params.id, tx));
    return res.json({ success: true, transaction: { id: result.id, status: result.status, totalPrice: Number(result.totalPrice), completedAt: result.completedAt } });
  } catch (e: any) { return res.status(500).json({ error: e.message || 'Gagal menyelesaikan transaksi.' }); }
});

router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const t = await prisma.transaction.findUnique({ where: { id: req.params.id } });
    if (!t) return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
    if (t.status === TransactionStatus.completed) return res.status(400).json({ error: 'Transaksi yang sudah selesai tidak bisa dibatalkan.' });
    const updated = await prisma.transaction.update({ where: { id: req.params.id }, data: { status: TransactionStatus.cancelled } });
    return res.json({ success: true, transaction: { id: updated.id, status: updated.status } });
  } catch (e: any) { return res.status(500).json({ error: 'Gagal membatalkan transaksi.' }); }
});

router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { transactions } = req.body;
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0)
      return res.status(400).json({ error: 'Tidak ada transaksi untuk disinkronisasi.' });
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) return res.status(500).json({ error: 'User tidak ditemukan.' });
    const syncedResults: any[] = [], errors: any[] = [];
    for (const offlineTx of transactions) {
      try {
        const { items, paymentMethod, createdAt, id: offlineId } = offlineTx;
        if (!items || items.length === 0 || !paymentMethod) throw new Error('Data transaksi tidak lengkap.');
        const result = await prisma.$transaction(async (tx) => {
          const menus = await tx.menu.findMany({ where: { id: { in: items.map((i: any) => i.menuId) } } });
          let totalPrice = 0, totalHpp = 0;
          const itemDataList: any[] = [];
          for (const item of items) {
            const menu = menus.find((m) => m.id === item.menuId);
            if (!menu) throw new Error(`Menu ${item.menuId} tidak ditemukan.`);
            const qty = Number(item.qty);
            totalPrice += Number(menu.sellingPrice) * qty;
            totalHpp += Number(menu.hpp) * qty;
            itemDataList.push({ menuId: menu.id, menuName: menu.name, qty, unitPrice: menu.sellingPrice, unitHpp: menu.hpp });
          }
          const txDate = createdAt ? new Date(createdAt) : new Date();
          const transaction = await tx.transaction.create({ data: { status: TransactionStatus.completed, paymentMethod: paymentMethod as PaymentMethod, totalPrice, totalHpp, cashierId: defaultUser.id, createdAt: txDate, completedAt: txDate, items: { create: itemDataList } }, include: { items: true } });
          for (const item of transaction.items) {
            const recipes = await tx.recipeItem.findMany({ where: { menuId: item.menuId }, include: { ingredient: true } });
            for (const recipe of recipes) {
              const needed = Number(recipe.qtyUsed) * item.qty;
              await tx.ingredient.update({ where: { id: recipe.ingredientId }, data: { stockQty: Number(recipe.ingredient.stockQty) - needed } });
              await tx.stockMovement.create({ data: { ingredientId: recipe.ingredientId, type: TypeMovement.usage, qtyChange: -needed, note: `Transaksi offline #${transaction.id.slice(0, 8)}`, createdBy: defaultUser.id, createdAt: txDate } });
            }
          }
          return transaction;
        });
        syncedResults.push({ offlineId, onlineId: result.id, success: true });
      } catch (err: any) { errors.push({ offlineId: offlineTx.id, error: err.message || 'Gagal sinkronisasi.' }); }
    }
    return res.json({ success: true, syncedCount: syncedResults.length, syncedResults, errors });
  } catch (e: any) { return res.status(500).json({ error: 'Terjadi kesalahan saat memproses sinkronisasi.' }); }
});

export default router;
