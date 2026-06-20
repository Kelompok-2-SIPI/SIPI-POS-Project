import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { recalculateAllHppsForIngredient } from '@/lib/inventory-helpers';

type RouteParams = { params: Promise<{ id: string }> };

// GET price history
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const history = await prisma.ingredientPriceHistory.findMany({
      where: { ingredientId: id },
      orderBy: { recordedAt: 'desc' },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(
      history.map((h) => ({
        id: h.id,
        price: Number(h.price),
        recordedAt: h.recordedAt,
        recordedBy: h.user.name,
      }))
    );
  } catch (error: any) {
    console.error('Error fetching price history:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil riwayat harga.' },
      { status: 500 }
    );
  }
}

// POST log new daily price
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { price, recordedAt } = await request.json();

    if (price === undefined || Number(price) <= 0) {
      return NextResponse.json(
        { error: 'Harga harus berupa angka positif.' },
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

    const priceDate = recordedAt ? new Date(recordedAt) : new Date();

    // Run in transaction to update latestPrice and insert price history
    await prisma.$transaction(async (tx) => {
      // 1. Check if ingredient exists
      const ing = await tx.ingredient.findUnique({ where: { id } });
      if (!ing) throw new Error('Bahan baku tidak ditemukan.');

      // 2. Update latestPrice
      await tx.ingredient.update({
        where: { id },
        data: { latestPrice: Number(price) },
      });

      // 3. Create price history entry
      await tx.ingredientPriceHistory.create({
        data: {
          ingredientId: id,
          price: Number(price),
          recordedAt: priceDate,
          recordedBy: defaultUser.id,
        },
      });
    });

    // Recalculate HPP for all menus using this ingredient
    await recalculateAllHppsForIngredient(id);

    return NextResponse.json({
      success: true,
      latestPrice: Number(price),
    });
  } catch (error: any) {
    console.error('Error logging daily price:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mencatat harga beli baru.' },
      { status: 500 }
    );
  }
}
