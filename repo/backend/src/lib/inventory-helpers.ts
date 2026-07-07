import { prisma } from './db';

/**
 * Recalculate HPP for a single menu.
 * HPP = sum(recipeItem.qtyUsed * ingredient.latestPrice)
 */
export async function recalculateMenuHpp(menuId: string, businessId: string): Promise<number> {
  const recipes = await prisma.recipeItem.findMany({
    where: { menuId, businessId },
    include: {
      ingredient: true,
    },
  });

  let totalHpp = 0;
  for (const item of recipes) {
    const qty = Number(item.qtyUsed);
    const price = Number(item.ingredient.latestPrice);
    totalHpp += qty * price;
  }

  const updated = await prisma.menu.update({
    where: { id: menuId, businessId },
    data: { hpp: totalHpp },
  });

  await prisma.menuHppHistory.create({
    data: { businessId, menuId, hpp: totalHpp, sellingPrice: updated.sellingPrice },
  });

  return totalHpp;
}

/**
 * Recalculate HPP for all menus that use a specific ingredient.
 */
export async function recalculateAllHppsForIngredient(ingredientId: string, businessId: string): Promise<void> {
  const recipes = await prisma.recipeItem.findMany({
    where: { ingredientId, businessId },
    select: { menuId: true },
  });

  const uniqueMenuIds = Array.from(new Set(recipes.map((r) => r.menuId)));

  for (const menuId of uniqueMenuIds) {
    await recalculateMenuHpp(menuId, businessId);
  }
}

/**
 * Dynamic calculation of whether a menu is available based on current stock.
 * A menu is available if stockQty >= qtyUsed for all its recipe items.
 */
export async function isMenuAvailable(menuId: string, businessId: string): Promise<boolean> {
  const recipes = await prisma.recipeItem.findMany({
    where: { menuId, businessId },
    include: {
      ingredient: true,
    },
  });

  if (recipes.length === 0) return true; // Menus without recipes are always available

  for (const item of recipes) {
    const stock = Number(item.ingredient.stockQty);
    const required = Number(item.qtyUsed);
    if (stock < required) {
      return false;
    }
  }

  return true;
}

/**
 * Fetch all menus with their dynamic availability state computed.
 */
export async function getMenusWithAvailability(businessId: string) {
  const menus = await prisma.menu.findMany({
    where: { businessId },
    include: {
      recipes: {
        include: {
          ingredient: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return menus.map((menu) => {
    // Dynamic availability check
    let isAvailable = true;
    for (const recipe of menu.recipes) {
      const stock = Number(recipe.ingredient.stockQty);
      const required = Number(recipe.qtyUsed);
      if (stock < required) {
        isAvailable = false;
        break;
      }
    }

    return {
      id: menu.id,
      name: menu.name,
      category: menu.category,
      sellingPrice: Number(menu.sellingPrice),
      hpp: Number(menu.hpp),
      imageUrl: menu.imageUrl,
      isAvailable, // Dynamically computed
      createdAt: menu.createdAt,
    };
  });
}
