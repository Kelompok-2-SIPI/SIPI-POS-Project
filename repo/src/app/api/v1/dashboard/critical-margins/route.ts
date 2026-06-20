import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      orderBy: { name: 'asc' },
    });

    const criticalMenus = menus
      .map((menu) => {
        const sellingPrice = Number(menu.sellingPrice);
        const hpp = Number(menu.hpp);
        const marginRatio = sellingPrice > 0 ? hpp / sellingPrice : 0;

        return {
          id: menu.id,
          name: menu.name,
          category: menu.category,
          sellingPrice,
          hpp,
          marginRatio,
          isCritical: marginRatio > 0.8,
        };
      })
      .filter((menu) => menu.isCritical);

    return NextResponse.json(criticalMenus);
  } catch (error: any) {
    console.error('Error fetching critical margins:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data margin kritis.' },
      { status: 500 }
    );
  }
}
