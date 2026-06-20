import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteParams = { params: Promise<{ id: string }> };

// PUT update ingredient
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { name, unit, minStockQty } = await request.json();

    if (!name || !unit || minStockQty === undefined) {
      return NextResponse.json(
        { error: 'Nama, satuan, dan stok minimal wajib diisi.' },
        { status: 400 }
      );
    }

    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        name,
        unit,
        minStockQty: Number(minStockQty),
      },
    });

    return NextResponse.json({
      success: true,
      ingredient: {
        ...updated,
        stockQty: Number(updated.stockQty),
        minStockQty: Number(updated.minStockQty),
        latestPrice: Number(updated.latestPrice),
      },
    });
  } catch (error: any) {
    console.error('Error updating ingredient:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui data bahan baku.' },
      { status: 500 }
    );
  }
}
