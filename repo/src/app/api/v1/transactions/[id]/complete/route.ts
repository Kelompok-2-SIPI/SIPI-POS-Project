import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { completeTransactionInTx } from '@/lib/transaction-helpers';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      return await completeTransactionInTx(id, tx);
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: result.id,
        status: result.status,
        totalPrice: Number(result.totalPrice),
        completedAt: result.completedAt,
      },
    });
  } catch (error: any) {
    console.error('Error completing transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menyelesaikan transaksi.' },
      { status: 500 }
    );
  }
}
