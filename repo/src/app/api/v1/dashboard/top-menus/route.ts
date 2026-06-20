import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TransactionStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    let dateStr = url.searchParams.get('date');
    const limitStr = url.searchParams.get('limit') || '5';
    const limit = parseInt(limitStr, 10);

    if (!dateStr) {
      const now = new Date();
      const gmt7Time = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60 * 1000);
      dateStr = gmt7Time.toISOString().split('T')[0];
    }

    const start = new Date(`${dateStr}T00:00:00+07:00`);
    const end = new Date(`${dateStr}T23:59:59.999+07:00`);

    const items = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          status: TransactionStatus.completed,
          completedAt: {
            gte: start,
            lte: end,
          },
        },
      },
      select: {
        menuId: true,
        menuName: true,
        qty: true,
        unitPrice: true,
      },
    });

    // Aggregate items
    const aggregation: Record<string, { menuName: string; qty: number; totalSales: number }> = {};
    for (const item of items) {
      const id = item.menuId;
      if (!aggregation[id]) {
        aggregation[id] = {
          menuName: item.menuName,
          qty: 0,
          totalSales: 0,
        };
      }
      aggregation[id].qty += item.qty;
      aggregation[id].totalSales += Number(item.unitPrice) * item.qty;
    }

    // Sort and limit
    const sorted = Object.entries(aggregation)
      .map(([id, data]) => ({
        id,
        name: data.menuName,
        quantitySold: data.qty,
        totalSales: data.totalSales,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, limit);

    return NextResponse.json(sorted);
  } catch (error: any) {
    console.error('Error fetching top menus:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil menu terlaris.' },
      { status: 500 }
    );
  }
}
