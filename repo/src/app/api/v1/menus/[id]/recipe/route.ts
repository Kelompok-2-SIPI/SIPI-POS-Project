import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { recalculateMenuHpp } from '@/lib/inventory-helpers';

type RouteParams = { params: Promise<{ id: string }> };

// GET menu recipe
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const recipes = await prisma.recipeItem.findMany({
      where: { menuId: id },
      include: {
        ingredient: true,
      },
    });

    return NextResponse.json(
      recipes.map((r) => ({
        id: r.id,
        ingredientId: r.ingredientId,
        ingredientName: r.ingredient.name,
        unit: r.ingredient.unit,
        qtyUsed: Number(r.qtyUsed),
      }))
    );
  } catch (error: any) {
    console.error('Error fetching menu recipe:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil resep menu.' },
      { status: 500 }
    );
  }
}

// PUT replace menu recipe
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { recipe } = await request.json();

    if (!recipe || !Array.isArray(recipe)) {
      return NextResponse.json(
        { error: 'Format resep salah.' },
        { status: 400 }
      );
    }

    // Wrap in a transaction to replace all recipe items
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing recipe items
      await tx.recipeItem.deleteMany({
        where: { menuId: id },
      });

      // 2. Insert new ones
      for (const item of recipe) {
        if (!item.ingredientId || item.qtyUsed === undefined || Number(item.qtyUsed) <= 0) continue;
        await tx.recipeItem.create({
          data: {
            menuId: id,
            ingredientId: item.ingredientId,
            qtyUsed: Number(item.qtyUsed),
          },
        });
      }
    });

    // Recalculate HPP for the menu
    const hpp = await recalculateMenuHpp(id);

    return NextResponse.json({
      success: true,
      hpp,
    });
  } catch (error: any) {
    console.error('Error updating menu recipe:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui resep menu.' },
      { status: 500 }
    );
  }
}
