import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: transaction.id,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      totalPrice: Number(transaction.totalPrice),
      totalHpp: Number(transaction.totalHpp),
      createdAt: transaction.createdAt,
      completedAt: transaction.completedAt,
      items: transaction.items.map((i) => ({
        id: i.id,
        menuId: i.menuId,
        menuName: i.menuName,
        qty: i.qty,
        unitPrice: Number(i.unitPrice),
        unitHpp: Number(i.unitHpp),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching transaction details:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil detail transaksi.' },
      { status: 500 }
    );
  }
}
