import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMenusWithAvailability, recalculateMenuHpp } from '@/lib/inventory-helpers';

// GET all menus
export async function GET() {
  try {
    const menus = await getMenusWithAvailability();
    return NextResponse.json(menus);
  } catch (error: any) {
    console.error('Error fetching menus:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data menu.' },
      { status: 500 }
    );
  }
}

// POST create a new menu
export async function POST(request: Request) {
  try {
    const { name, category, sellingPrice, recipe } = await request.json();

    if (!name || !category || sellingPrice === undefined) {
      return NextResponse.json(
        { error: 'Nama, kategori, dan harga jual wajib diisi.' },
        { status: 400 }
      );
    }

    // Create the menu
    const menu = await prisma.menu.create({
      data: {
        name,
        category,
        sellingPrice: Number(sellingPrice),
        hpp: 0, // Will recalculate
      },
    });

    // Create recipe items if provided
    if (recipe && Array.isArray(recipe)) {
      for (const r of recipe) {
        if (!r.ingredientId || !r.qtyUsed) continue;
        await prisma.recipeItem.create({
          data: {
            menuId: menu.id,
            ingredientId: r.ingredientId,
            qtyUsed: Number(r.qtyUsed),
          },
        });
      }
    }

    // Recalculate HPP for the menu
    const hpp = await recalculateMenuHpp(menu.id);

    return NextResponse.json({
      success: true,
      menu: { ...menu, hpp },
    });
  } catch (error: any) {
    console.error('Error creating menu:', error);
    return NextResponse.json(
      { error: 'Gagal membuat menu baru.' },
      { status: 500 }
    );
  }
}
