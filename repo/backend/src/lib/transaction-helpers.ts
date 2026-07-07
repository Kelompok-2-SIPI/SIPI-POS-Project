import { prisma } from './db';
import { TypeMovement, TransactionStatus } from '@prisma/client';

/**
 * Deducts ingredient stocks and completes a transaction.
 * Runs inside a Prisma transaction block.
 */
export async function completeTransactionInTx(transactionId: string, tx: any, businessId: string) {
  // 1. Fetch transaction with its items
  const transaction = await tx.transaction.findUnique({
    where: { id: transactionId, businessId },
    include: {
      items: {
        include: {
          menu: {
            include: {
              recipes: {
                include: {
                  ingredient: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!transaction) {
    throw new Error('Transaksi tidak ditemukan.');
  }

  if (transaction.status === TransactionStatus.completed) {
    return transaction;
  }

  if (transaction.status === TransactionStatus.cancelled) {
    throw new Error('Transaksi yang sudah dibatalkan tidak bisa diselesaikan.');
  }

  // 2. Aggregate all ingredients usage
  const ingredientUsage: Record<string, {
    ingredientName: string;
    qtyToDeduct: number;
  }> = {};

  for (const item of transaction.items) {
    for (const recipe of item.menu.recipes) {
      const ingredientId = recipe.ingredientId;
      const needed = Number(recipe.qtyUsed) * item.qty;

      if (!ingredientUsage[ingredientId]) {
        ingredientUsage[ingredientId] = {
          ingredientName: recipe.ingredient.name,
          qtyToDeduct: 0,
        };
      }
      ingredientUsage[ingredientId].qtyToDeduct += needed;
    }
  }

  // 3+4. Kurangi stok secara ATOMIK per bahan baku: `updateMany` dengan guard
  // `stockQty >= qtyToDeduct` di WHERE membuat database sendiri yang menjamin
  // cek-lalu-kurangi terjadi dalam satu statement (row lock Postgres), bukan
  // read-then-write di level aplikasi yang rentan lost update saat 2 transaksi
  // menyelesaikan bahan baku yang sama secara bersamaan.
  for (const ingredientId in ingredientUsage) {
    const usage = ingredientUsage[ingredientId];

    const result = await tx.ingredient.updateMany({
      where: { id: ingredientId, businessId, stockQty: { gte: usage.qtyToDeduct } },
      data: { stockQty: { decrement: usage.qtyToDeduct } },
    });

    if (result.count === 0) {
      // Re-fetch buat pesan error yang informatif (stok terkini, bukan nilai basi)
      const current = await tx.ingredient.findUnique({ where: { id: ingredientId, businessId } });
      const available = current ? Number(current.stockQty) : 0;
      throw new Error(`Stok bahan baku '${usage.ingredientName}' tidak mencukupi. Dibutuhkan: ${usage.qtyToDeduct.toFixed(2)}, Tersedia: ${available.toFixed(2)}`);
    }

    // Create StockMovement
    await tx.stockMovement.create({
      data: {
        businessId,
        ingredientId,
        type: TypeMovement.usage,
        qtyChange: -usage.qtyToDeduct,
        note: `Penggunaan resep untuk transaksi #${transaction.id.slice(0, 8)}`,
        createdBy: transaction.cashierId,
      },
    });
  }

  // 5. Update transaction status
  const updatedTransaction = await tx.transaction.update({
    where: { id: transactionId, businessId },
    data: {
      status: TransactionStatus.completed,
      completedAt: new Date(),
    },
    include: {
      items: true,
    },
  });

  return updatedTransaction;
}
