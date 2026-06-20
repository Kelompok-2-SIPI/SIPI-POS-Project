import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TypeMovement } from '@prisma/client';

// GET all ingredients
export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(
      ingredients.map((ing) => ({
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        stockQty: Number(ing.stockQty),
        minStockQty: Number(ing.minStockQty),
        latestPrice: Number(ing.latestPrice),
        createdAt: ing.createdAt,
      }))
    );
  } catch (error: any) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data bahan baku.' },
      { status: 500 }
    );
  }
}

// POST create a new ingredient
export async function POST(request: Request) {
  try {
    const { name, unit, stockQty, minStockQty, latestPrice } = await request.json();

    if (!name || !unit || stockQty === undefined || minStockQty === undefined || latestPrice === undefined) {
      return NextResponse.json(
        { error: 'Nama, satuan, stok awal, stok minimal, dan harga beli wajib diisi.' },
        { status: 400 }
      );
    }

    // Get the first user ID (admin) for tracking recordedBy
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      return NextResponse.json(
        { error: 'User tidak ditemukan. Seed database terlebih dahulu.' },
        { status: 500 }
      );
    }

    const ingredient = await prisma.$transaction(async (tx) => {
      const ing = await tx.ingredient.create({
        data: {
          name,
          unit,
          stockQty: Number(stockQty),
          minStockQty: Number(minStockQty),
          latestPrice: Number(latestPrice),
        },
      });

      // Log price history
      await tx.ingredientPriceHistory.create({
        data: {
          ingredientId: ing.id,
          price: Number(latestPrice),
          recordedAt: new Date(),
          recordedBy: defaultUser.id,
        },
      });

      // Log stock movement
      await tx.stockMovement.create({
        data: {
          ingredientId: ing.id,
          type: TypeMovement.restock,
          qtyChange: Number(stockQty),
          note: 'Stok awal pendaftaran bahan baku',
          createdBy: defaultUser.id,
        },
      });

      return ing;
    });

    return NextResponse.json({
      success: true,
      ingredient: {
        ...ingredient,
        stockQty: Number(ingredient.stockQty),
        minStockQty: Number(ingredient.minStockQty),
        latestPrice: Number(ingredient.latestPrice),
      },
    });
  } catch (error: any) {
    console.error('Error creating ingredient:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan bahan baku baru.' },
      { status: 500 }
    );
  }
}
