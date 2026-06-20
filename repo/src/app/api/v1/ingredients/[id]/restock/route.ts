import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TypeMovement } from '@prisma/client';

type RouteParams = { params: Promise<{ id: string }> };

// POST restock ingredient
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { qtyChange, note } = await request.json();

    if (qtyChange === undefined || Number(qtyChange) <= 0) {
      return NextResponse.json(
        { error: 'Kuantitas tambahan harus berupa angka positif.' },
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

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Get current stock
      const ing = await tx.ingredient.findUnique({ where: { id } });
      if (!ing) throw new Error('Bahan baku tidak ditemukan.');

      const newQty = Number(ing.stockQty) + Number(qtyChange);

      // 2. Update stockQty
      const updatedIng = await tx.ingredient.update({
        where: { id },
        data: { stockQty: newQty },
      });

      // 3. Create stock movement
      await tx.stockMovement.create({
        data: {
          ingredientId: id,
          type: TypeMovement.restock,
          qtyChange: Number(qtyChange),
          note: note || 'Restok barang',
          createdBy: defaultUser.id,
        },
      });

      return updatedIng;
    });

    return NextResponse.json({
      success: true,
      stockQty: Number(updated.stockQty),
    });
  } catch (error: any) {
    console.error('Error restocking ingredient:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal melakukan restok bahan baku.' },
      { status: 500 }
    );
  }
}
