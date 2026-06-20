import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TransactionStatus } from '@prisma/client';

export async function GET() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Fetch all completed transactions in the last 7 days
    const transactions = await prisma.transaction.findMany({
      where: {
        status: TransactionStatus.completed,
        completedAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        items: {
          include: {
            menu: {
              include: {
                recipes: true,
              },
            },
          },
        },
      },
    });

    // 2. Aggregate consumption for each ingredient
    const totalUsage: Record<string, number> = {};

    for (const tx of transactions) {
      for (const item of tx.items) {
        for (const recipe of item.menu.recipes) {
          const usage = Number(recipe.qtyUsed) * item.qty;
          totalUsage[recipe.ingredientId] = (totalUsage[recipe.ingredientId] || 0) + usage;
        }
      }
    }

    // 3. Fetch all ingredients
    const ingredients = await prisma.ingredient.findMany();

    // 4. Calculate sisa hari for each ingredient
    const recommendations = [];

    for (const ing of ingredients) {
      const stockQty = Number(ing.stockQty);
      const usage7d = totalUsage[ing.id] || 0;
      const avgConsumption = usage7d / 7;

      let sisaHari = 999; // Default representing no urgent consumption

      if (avgConsumption > 0) {
        sisaHari = stockQty / avgConsumption;
      }

      // Check if stock is less than 2 days of consumption
      // Also, if stock is extremely low (<= minStockQty), we can show it as urgent,
      // but let's strictly follow "stock_qty / avg_consumption_7d < 2" formula
      if (sisaHari < 2) {
        recommendations.push({
          id: ing.id,
          name: ing.name,
          unit: ing.unit,
          stockQty,
          minStockQty: Number(ing.minStockQty),
          avgConsumption7d: avgConsumption,
          sisaHari,
        });
      }
    }

    // Sort by sisaHari ascending (most urgent first)
    recommendations.sort((a, b) => a.sisaHari - b.sisaHari);

    return NextResponse.json(recommendations);
  } catch (error: any) {
    console.error('Error fetching restock recommendations:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil rekomendasi restok.' },
      { status: 500 }
    );
  }
}
