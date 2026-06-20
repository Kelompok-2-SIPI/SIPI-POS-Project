import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TransactionStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    let dateStr = url.searchParams.get('date');

    // Default to GMT+7 current date
    if (!dateStr) {
      const now = new Date();
      const gmt7Time = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60 * 1000);
      dateStr = gmt7Time.toISOString().split('T')[0];
    }

    const start = new Date(`${dateStr}T00:00:00+07:00`);
    const end = new Date(`${dateStr}T23:59:59.999+07:00`);

    // 1. Fetch completed transactions for the day
    const transactions = await prisma.transaction.findMany({
      where: {
        status: TransactionStatus.completed,
        completedAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: true,
      },
    });

    let totalRevenue = 0;
    let totalHpp = 0;
    const nTransactions = transactions.length;

    // Aggregate quantities by menuName to find top menu
    const menuSales: Record<string, number> = {};

    for (const tx of transactions) {
      totalRevenue += Number(tx.totalPrice);
      totalHpp += Number(tx.totalHpp);

      for (const item of tx.items) {
        menuSales[item.menuName] = (menuSales[item.menuName] || 0) + item.qty;
      }
    }

    const grossProfit = totalRevenue - totalHpp;

    // Find top menu
    let topMenuName = 'Tidak ada';
    let maxQty = 0;
    for (const name in menuSales) {
      if (menuSales[name] > maxQty) {
        maxQty = menuSales[name];
        topMenuName = name;
      }
    }

    // Format numbers to Indonesian IDR style
    const fmt = new Intl.NumberFormat('id-ID');
    const xRevenueStr = fmt.format(totalRevenue);
    const yProfitStr = fmt.format(grossProfit);

    // Dynamic Summary Text Template (FR-14)
    // Format: "Hari ini {n} transaksi, pendapatan Rp {x}, estimasi laba Rp {y}. Menu terlaris: {menu}."
    const summaryText = `Hari ini ${nTransactions} transaksi, pendapatan Rp ${xRevenueStr}, estimasi laba Rp ${yProfitStr}. Menu terlaris: ${topMenuName}.`;

    return NextResponse.json({
      date: dateStr,
      transactionsCount: nTransactions,
      totalRevenue,
      totalHpp,
      grossProfit,
      topMenu: {
        name: topMenuName,
        quantity: maxQty,
      },
      summaryText,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil ringkasan dashboard.' },
      { status: 500 }
    );
  }
}
