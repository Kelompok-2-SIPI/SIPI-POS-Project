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

  // 2. Create Default Ingredients (Ayam Geprek)
  const ingredientsData = [
    { name: 'Ayam Potong (Dada)', unit: 'potong', minStockQty: 20, stockQty: 100, latestPrice: 13000 },
    { name: 'Ayam Potong (Paha Atas)', unit: 'potong', minStockQty: 20, stockQty: 100, latestPrice: 12500 },
    { name: 'Ayam Potong (Paha Bawah)', unit: 'potong', minStockQty: 20, stockQty: 100, latestPrice: 12000 },
    { name: 'Ayam Potong (Sayap)', unit: 'potong', minStockQty: 20, stockQty: 100, latestPrice: 11000 },
    { name: 'Cabai Rawit', unit: 'gram', minStockQty: 1000, stockQty: 5000, latestPrice: 80 },
    { name: 'Bawang Putih', unit: 'gram', minStockQty: 500, stockQty: 2000, latestPrice: 40 },
    { name: 'Tepung Terigu', unit: 'gram', minStockQty: 5000, stockQty: 20000, latestPrice: 12 },
    { name: 'Minyak Goreng', unit: 'ml', minStockQty: 5000, stockQty: 15000, latestPrice: 18 },
    { name: 'Beras Putih', unit: 'gram', minStockQty: 10000, stockQty: 50000, latestPrice: 15 },
    { name: 'Teh Melati', unit: 'gram', minStockQty: 500, stockQty: 2000, latestPrice: 100 },
    { name: 'Gula Pasir', unit: 'gram', minStockQty: 2000, stockQty: 10000, latestPrice: 18 },
    { name: 'Es Batu', unit: 'pcs', minStockQty: 100, stockQty: 500, latestPrice: 500 },
    { name: 'Air Mineral', unit: 'ml', minStockQty: 5000, stockQty: 20000, latestPrice: 2 },
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

  // 3. Create Default Menus (Ayam Geprek)
  const menusData = [
    {
      name: 'Ayam Geprek (Dada)',
      category: 'Makanan',
      sellingPrice: 25000,
      recipe: [
        { name: 'Ayam Potong (Dada)', qty: 1 },
        { name: 'Cabai Rawit', qty: 20 },
        { name: 'Bawang Putih', qty: 10 },
        { name: 'Tepung Terigu', qty: 50 },
        { name: 'Minyak Goreng', qty: 100 },
      ],
    },
    {
      name: 'Ayam Geprek (Paha Atas)',
      category: 'Makanan',
      sellingPrice: 24000,
      recipe: [
        { name: 'Ayam Potong (Paha Atas)', qty: 1 },
        { name: 'Cabai Rawit', qty: 20 },
        { name: 'Bawang Putih', qty: 10 },
        { name: 'Tepung Terigu', qty: 50 },
        { name: 'Minyak Goreng', qty: 100 },
      ],
    },
    {
      name: 'Ayam Geprek (Paha Bawah)',
      category: 'Makanan',
      sellingPrice: 23000,
      recipe: [
        { name: 'Ayam Potong (Paha Bawah)', qty: 1 },
        { name: 'Cabai Rawit', qty: 20 },
        { name: 'Bawang Putih', qty: 10 },
        { name: 'Tepung Terigu', qty: 50 },
        { name: 'Minyak Goreng', qty: 100 },
      ],
    },
    {
      name: 'Ayam Geprek (Sayap)',
      category: 'Makanan',
      sellingPrice: 22000,
      recipe: [
        { name: 'Ayam Potong (Sayap)', qty: 1 },
        { name: 'Cabai Rawit', qty: 20 },
        { name: 'Bawang Putih', qty: 10 },
        { name: 'Tepung Terigu', qty: 50 },
        { name: 'Minyak Goreng', qty: 100 },
      ],
    },
    {
      name: 'Paket Hemat (Nasi + Sayap)',
      category: 'Paket',
      sellingPrice: 27000,
      recipe: [
        { name: 'Ayam Potong (Sayap)', qty: 1 },
        { name: 'Cabai Rawit', qty: 20 },
        { name: 'Bawang Putih', qty: 10 },
        { name: 'Tepung Terigu', qty: 50 },
        { name: 'Minyak Goreng', qty: 100 },
        { name: 'Beras Putih', qty: 200 },
      ],
    },
    {
      name: 'Paket Hemat (Nasi + Paha Bawah)',
      category: 'Paket',
      sellingPrice: 28000,
      recipe: [
        { name: 'Ayam Potong (Paha Bawah)', qty: 1 },
        { name: 'Cabai Rawit', qty: 20 },
        { name: 'Bawang Putih', qty: 10 },
        { name: 'Tepung Terigu', qty: 50 },
        { name: 'Minyak Goreng', qty: 100 },
        { name: 'Beras Putih', qty: 200 },
      ],
    },
    {
      name: 'Paket Pas (Nasi + Dada)',
      category: 'Paket',
      sellingPrice: 30000,
      recipe: [
        { name: 'Ayam Potong (Dada)', qty: 1 },
        { name: 'Cabai Rawit', qty: 20 },
        { name: 'Bawang Putih', qty: 10 },
        { name: 'Tepung Terigu', qty: 50 },
        { name: 'Minyak Goreng', qty: 100 },
        { name: 'Beras Putih', qty: 200 },
      ],
    },
    {
      name: 'Paket Pas (Nasi + Paha Atas)',
      category: 'Paket',
      sellingPrice: 29000,
      recipe: [
        { name: 'Ayam Potong (Paha Atas)', qty: 1 },
        { name: 'Cabai Rawit', qty: 20 },
        { name: 'Bawang Putih', qty: 10 },
        { name: 'Tepung Terigu', qty: 50 },
        { name: 'Minyak Goreng', qty: 100 },
        { name: 'Beras Putih', qty: 200 },
      ],
    },
    {
      name: 'Es Teh Manis',
      category: 'Minuman',
      sellingPrice: 5000,
      recipe: [
        { name: 'Teh Melati', qty: 5 },
        { name: 'Gula Pasir', qty: 20 },
        { name: 'Air Mineral', qty: 200 },
        { name: 'Es Batu', qty: 2 },
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
