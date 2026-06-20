import { PrismaClient, Role, TypeMovement, TransactionStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Hardcoded User
  const existingUser = await prisma.user.findFirst({
    where: { name: 'admin' },
  });

  let userId: string;
  if (!existingUser) {
    const passwordHash = await bcrypt.hash('sipi123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'admin',
        role: Role.owner,
        passwordHash,
      },
    });
    userId = user.id;
    console.log(`Created default user 'admin' with ID: ${userId}`);
  } else {
    userId = existingUser.id;
    console.log(`User 'admin' already exists.`);
  }

  // 2. Create Default Ingredients
  const ingredientsData = [
    { name: 'Kopi Arabika', unit: 'gram', minStockQty: 1000, stockQty: 5000, latestPrice: 150 },
    { name: 'Susu Segar', unit: 'ml', minStockQty: 2000, stockQty: 10000, latestPrice: 25 },
    { name: 'Sirup Karamel', unit: 'ml', minStockQty: 500, stockQty: 2000, latestPrice: 70 },
    { name: 'Air Mineral', unit: 'ml', minStockQty: 5000, stockQty: 20000, latestPrice: 2 },
    { name: 'Gula Cair', unit: 'ml', minStockQty: 1000, stockQty: 3000, latestPrice: 15 },
    { name: 'Teh Melati', unit: 'gram', minStockQty: 200, stockQty: 1000, latestPrice: 100 },
  ];

  const ingredientMap: Record<string, string> = {};

  for (const item of ingredientsData) {
    let ing = await prisma.ingredient.findFirst({
      where: { name: item.name },
    });

    if (!ing) {
      ing = await prisma.ingredient.create({
        data: {
          name: item.name,
          unit: item.unit,
          stockQty: item.stockQty,
          minStockQty: item.minStockQty,
          latestPrice: item.latestPrice,
        },
      });

      // Log initial price history
      await prisma.ingredientPriceHistory.create({
        data: {
          ingredientId: ing.id,
          price: item.latestPrice,
          recordedAt: new Date(),
          recordedBy: userId,
        },
      });

      // Log initial stock movement
      await prisma.stockMovement.create({
        data: {
          ingredientId: ing.id,
          type: TypeMovement.restock,
          qtyChange: item.stockQty,
          note: 'Initial seed stock',
          createdBy: userId,
        },
      });
      
      console.log(`Created ingredient: ${item.name}`);
    } else {
      console.log(`Ingredient ${item.name} already exists.`);
    }
    ingredientMap[item.name] = ing.id;
  }

  // 3. Create Default Menus
  const menusData = [
    {
      name: 'Es Kopi Susu Gula Aren',
      category: 'Minuman',
      sellingPrice: 18000,
      recipe: [
        { name: 'Kopi Arabika', qty: 15 },
        { name: 'Susu Segar', qty: 150 },
        { name: 'Gula Cair', qty: 20 },
        { name: 'Air Mineral', qty: 50 },
      ],
    },
    {
      name: 'Caramel Macchiato',
      category: 'Minuman',
      sellingPrice: 25000,
      recipe: [
        { name: 'Kopi Arabika', qty: 15 },
        { name: 'Susu Segar', qty: 150 },
        { name: 'Sirup Karamel', qty: 20 },
        { name: 'Air Mineral', qty: 50 },
      ],
    },
    {
      name: 'Es Teh Manis',
      category: 'Minuman',
      sellingPrice: 8000,
      recipe: [
        { name: 'Teh Melati', qty: 5 },
        { name: 'Gula Cair', qty: 15 },
        { name: 'Air Mineral', qty: 200 },
      ],
    },
  ];

  for (const item of menusData) {
    let menu = await prisma.menu.findFirst({
      where: { name: item.name },
    });

    if (!menu) {
      // Calculate initial HPP
      let calculatedHpp = 0;
      for (const recipeIng of item.recipe) {
        const ingId = ingredientMap[recipeIng.name];
        const ingData = ingredientsData.find((i) => i.name === recipeIng.name);
        if (ingData) {
          calculatedHpp += recipeIng.qty * ingData.latestPrice;
        }
      }

      menu = await prisma.menu.create({
        data: {
          name: item.name,
          category: item.category,
          sellingPrice: item.sellingPrice,
          hpp: calculatedHpp,
          isAvailable: true,
        },
      });

      // Create recipe items
      for (const recipeIng of item.recipe) {
        await prisma.recipeItem.create({
          data: {
            menuId: menu.id,
            ingredientId: ingredientMap[recipeIng.name],
            qtyUsed: recipeIng.qty,
          },
        });
      }
      console.log(`Created menu: ${item.name} with HPP ${calculatedHpp}`);
    } else {
      console.log(`Menu ${item.name} already exists.`);
    }
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
