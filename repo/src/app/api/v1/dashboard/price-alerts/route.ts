import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      include: {
        recipes: {
          include: {
            menu: true,
          },
        },
      },
    });

    const alerts = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const ing of ingredients) {
      const currentPrice = Number(ing.latestPrice);
      if (currentPrice <= 0) continue;

      // 1. Get baseline price from 7 days ago or earliest
      let baselineEntry = await prisma.ingredientPriceHistory.findFirst({
        where: {
          ingredientId: ing.id,
          recordedAt: {
            lte: sevenDaysAgo,
          },
        },
        orderBy: { recordedAt: 'desc' },
      });

      // If no price entry before 7 days ago, find the earliest entry in history
      if (!baselineEntry) {
        baselineEntry = await prisma.ingredientPriceHistory.findFirst({
          where: { ingredientId: ing.id },
          orderBy: { recordedAt: 'asc' },
        });
      }

      if (!baselineEntry) continue;

      const baselinePrice = Number(baselineEntry.price);
      if (baselinePrice <= 0) continue;

      const increaseRatio = (currentPrice - baselinePrice) / baselinePrice;

      if (increaseRatio > 0.20) {
        // Find menus affected
        const affectedMenus = ing.recipes.map((r) => ({
          menuId: r.menu.id,
          menuName: r.menu.name,
          currentHpp: Number(r.menu.hpp),
        }));

        alerts.push({
          ingredientId: ing.id,
          ingredientName: ing.name,
          baselinePrice,
          currentPrice,
          increasePercent: increaseRatio * 100,
          affectedMenus,
        });
      }
    }

    return NextResponse.json(alerts);
  } catch (error: any) {
    console.error('Error fetching price alerts:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data peringatan harga.' },
      { status: 500 }
    );
  }
}
