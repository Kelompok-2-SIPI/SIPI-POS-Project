import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TransactionStatus, PaymentMethod, TypeMovement } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { transactions } = await request.json();

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada transaksi untuk disinkronisasi.' },
        { status: 400 }
      );
    }

    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      return NextResponse.json(
        { error: 'User tidak ditemukan.' },
        { status: 500 }
      );
    }

    const syncedResults = [];
    const errors = [];

    for (const offlineTx of transactions) {
      try {
        const { items, paymentMethod, createdAt, id: offlineId } = offlineTx;

        if (!items || items.length === 0 || !paymentMethod) {
          throw new Error('Data transaksi tidak lengkap.');
        }

        // Process inside database transaction
        const result = await prisma.$transaction(async (tx) => {
          // 1. Gather all menus to calculate total price & total HPP
          const menuIds = items.map((i: any) => i.menuId);
          const menus = await tx.menu.findMany({
            where: { id: { in: menuIds } },
          });

          let totalPrice = 0;
          let totalHpp = 0;

          const itemDataList = [];
          for (const item of items) {
            const menu = menus.find((m) => m.id === item.menuId);
            if (!menu) {
              throw new Error(`Menu dengan ID ${item.menuId} tidak ditemukan.`);
            }

            const qty = Number(item.qty);
            const sellingPrice = Number(menu.sellingPrice);
            const hpp = Number(menu.hpp);

            totalPrice += sellingPrice * qty;
            totalHpp += hpp * qty;

            itemDataList.push({
              menuId: menu.id,
              menuName: menu.name,
              qty,
              unitPrice: sellingPrice,
              unitHpp: hpp,
            });
          }

          const txDate = createdAt ? new Date(createdAt) : new Date();

          // 2. Create the transaction as completed
          const transaction = await tx.transaction.create({
            data: {
              status: TransactionStatus.completed,
              paymentMethod: paymentMethod as PaymentMethod,
              totalPrice,
              totalHpp,
              cashierId: defaultUser.id,
              createdAt: txDate,
              completedAt: txDate,
              items: {
                create: itemDataList,
              },
            },
            include: {
              items: true,
            },
          });

          // 3. Deduct stock. Since this transaction physically happened,
          // we force-deduct stock even if it goes below 0.
          for (const item of transaction.items) {
            const menu = menus.find((m) => m.id === item.menuId);
            if (!menu) continue;

            const recipes = await tx.recipeItem.findMany({
              where: { menuId: item.menuId },
              include: { ingredient: true },
            });

            for (const recipe of recipes) {
              const needed = Number(recipe.qtyUsed) * item.qty;
              const currentStock = Number(recipe.ingredient.stockQty);
              const newStock = currentStock - needed;

              // Update stockQty
              await tx.ingredient.update({
                where: { id: recipe.ingredientId },
                data: { stockQty: newStock },
              });

              // Create StockMovement
              await tx.stockMovement.create({
                data: {
                  ingredientId: recipe.ingredientId,
                  type: TypeMovement.usage,
                  qtyChange: -needed,
                  note: `Penggunaan resep untuk transaksi offline #${transaction.id.slice(0, 8)}`,
                  createdBy: defaultUser.id,
                  createdAt: txDate,
                },
              });
            }
          }

          return transaction;
        });

        syncedResults.push({
          offlineId,
          onlineId: result.id,
          success: true,
        });
      } catch (err: any) {
        console.error('Failed to sync offline transaction:', err);
        errors.push({
          offlineId: offlineTx.id,
          error: err.message || 'Gagal sinkronisasi.',
        });
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: syncedResults.length,
      syncedResults,
      errors,
    });
  } catch (error: any) {
    console.error('Error in sync endpoint:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses sinkronisasi.' },
      { status: 500 }
    );
  }
}
