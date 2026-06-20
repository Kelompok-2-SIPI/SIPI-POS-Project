import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TransactionStatus, PaymentMethod } from '@prisma/client';
import { completeTransactionInTx } from '@/lib/transaction-helpers';

// GET recent transactions
export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        items: true,
      },
    });

    return NextResponse.json(
      transactions.map((t) => ({
        id: t.id,
        status: t.status,
        paymentMethod: t.paymentMethod,
        totalPrice: Number(t.totalPrice),
        totalHpp: Number(t.totalHpp),
        createdAt: t.createdAt,
        completedAt: t.completedAt,
        itemsCount: t.items.length,
      }))
    );
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data transaksi.' },
      { status: 500 }
    );
  }
}

// POST create transaction
export async function POST(request: Request) {
  try {
    const { items, paymentMethod, status = TransactionStatus.completed } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0 || !paymentMethod) {
      return NextResponse.json(
        { error: 'Items dan metode pembayaran wajib diisi.' },
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

    // Run creation in transaction block
    const result = await prisma.$transaction(async (tx) => {
      // 1. Gather all menus to calculate total price & total HPP
      const menuIds = items.map((i) => i.menuId);
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

      // 2. Create the transaction (initially pending to run checks safely)
      const transaction = await tx.transaction.create({
        data: {
          status: TransactionStatus.pending, // temporarily pending
          paymentMethod: paymentMethod as PaymentMethod,
          totalPrice,
          totalHpp,
          cashierId: defaultUser.id,
          items: {
            create: itemDataList,
          },
        },
      });

      // 3. If requested status is completed, complete it (checking and deducting stock)
      if (status === TransactionStatus.completed) {
        return await completeTransactionInTx(transaction.id, tx);
      }

      // If pending, just return it
      return await tx.transaction.findUnique({
        where: { id: transaction.id },
        include: { items: true },
      });
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: result.id,
        status: result.status,
        paymentMethod: result.paymentMethod,
        totalPrice: Number(result.totalPrice),
        totalHpp: Number(result.totalHpp),
        createdAt: result.createdAt,
        completedAt: result.completedAt,
        items: result.items.map((i: any) => ({
          menuId: i.menuId,
          menuName: i.menuName,
          qty: i.qty,
          unitPrice: Number(i.unitPrice),
          unitHpp: Number(i.unitHpp),
        })),
      },
    });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses transaksi.' },
      { status: 500 }
    );
  }
}
