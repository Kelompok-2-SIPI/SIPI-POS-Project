import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { recalculateMenuHpp } from '@/lib/inventory-helpers';

type RouteParams = { params: Promise<{ id: string }> };

// PUT update menu
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { name, category, sellingPrice } = await request.json();

    if (!name || !category || sellingPrice === undefined) {
      return NextResponse.json(
        { error: 'Nama, kategori, dan harga jual wajib diisi.' },
        { status: 400 }
      );
    }

    const updatedMenu = await prisma.menu.update({
      where: { id },
      data: {
        name,
        category,
        sellingPrice: Number(sellingPrice),
      },
    });

    // Recalculate HPP in case recipe was touched earlier
    const hpp = await recalculateMenuHpp(id);

    return NextResponse.json({
      success: true,
      menu: { ...updatedMenu, hpp },
    });
  } catch (error: any) {
    console.error('Error updating menu:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui menu.' },
      { status: 500 }
    );
  }
}

// DELETE menu
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.menu.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting menu:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus menu.' },
      { status: 500 }
    );
  }
}
