import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TransactionStatus } from '@prisma/client';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (transaction.status === TransactionStatus.completed) {
      return NextResponse.json(
        { error: 'Transaksi yang sudah selesai tidak bisa dibatalkan.' },
        { status: 400 }
      );
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        status: TransactionStatus.cancelled,
      },
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: updated.id,
        status: updated.status,
      },
    });
  } catch (error: any) {
    console.error('Error cancelling transaction:', error);
    return NextResponse.json(
      { error: 'Gagal membatalkan transaksi.' },
      { status: 500 }
    );
  }
}
