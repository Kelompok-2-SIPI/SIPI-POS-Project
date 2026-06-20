import { prisma } from './db';
import { TypeMovement, TransactionStatus } from '@prisma/client';

/**
 * Deducts ingredient stocks and completes a transaction.
 * Runs inside a Prisma transaction block.
 */
export async function completeTransactionInTx(transactionId: string, tx: any) {
  // 1. Fetch transaction with its items
  const transaction = await tx.transaction.findUnique({
    where: { id: transactionId },
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
    currentStock: number;
  }> = {};

  for (const item of transaction.items) {
    for (const recipe of item.menu.recipes) {
      const ingredientId = recipe.ingredientId;
      const needed = Number(recipe.qtyUsed) * item.qty;

      if (!ingredientUsage[ingredientId]) {
        ingredientUsage[ingredientId] = {
          ingredientName: recipe.ingredient.name,
          qtyToDeduct: 0,
          currentStock: Number(recipe.ingredient.stockQty),
        };
      }
      ingredientUsage[ingredientId].qtyToDeduct += needed;
    }
  }

  // 3. Verify stock availability
  for (const ingredientId in ingredientUsage) {
    const usage = ingredientUsage[ingredientId];
    if (usage.currentStock < usage.qtyToDeduct) {
      throw new Error(`Stok bahan baku '${usage.ingredientName}' tidak mencukupi. Dibutuhkan: ${usage.qtyToDeduct.toFixed(2)}, Tersedia: ${usage.currentStock.toFixed(2)}`);
    }
  }

  // 4. Deduct stock and record stock movements
  for (const ingredientId in ingredientUsage) {
    const usage = ingredientUsage[ingredientId];
    const newStock = usage.currentStock - usage.qtyToDeduct;

    // Update stockQty
    await tx.ingredient.update({
      where: { id: ingredientId },
      data: { stockQty: newStock },
    });

    // Create StockMovement
    await tx.stockMovement.create({
      data: {
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
    where: { id: transactionId },
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
