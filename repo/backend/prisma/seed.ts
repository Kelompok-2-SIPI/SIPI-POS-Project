import { PrismaClient, Role, TypeMovement, TransactionStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Ayam Geprek Bu Yuli — UMKM F&B Jogja, buka Januari 2026

const DEMO_BUSINESS_NAME = 'Ayam Geprek Bu Yuli';

async function main() {
  console.log('Seeding database...');

  // 0. Resolve (or create) the demo Business — semua data seed ini milik tenant ini.
  let business = await prisma.business.findFirst({ where: { name: DEMO_BUSINESS_NAME } });
  if (!business) {
    business = await prisma.business.create({ data: { name: DEMO_BUSINESS_NAME } });
    console.log(`Created business '${DEMO_BUSINESS_NAME}' with ID: ${business.id}`);
  }
  const businessId = business.id;

  // 1. Create Hardcoded User
  const existingUser = await prisma.user.findFirst({
    where: { name: 'admin', businessId },
  });

  let userId: string;
  if (!existingUser) {
    const passwordHash = await bcrypt.hash('sipi123', 10);
    const user = await prisma.user.create({
      data: {
        businessId,
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

  // 2. Create Default Ingredients (Ayam Geprek Bu Yuli)
  const ingredientsData = [
    { name: 'Ayam Potong (Sayap)', unit: 'potong', minStockQty: 15, stockQty: 30, latestPrice: 4500 },
    { name: 'Ayam Potong (Paha Bawah)', unit: 'potong', minStockQty: 15, stockQty: 30, latestPrice: 6500 },
    { name: 'Ayam Potong (Paha Atas)', unit: 'potong', minStockQty: 15, stockQty: 30, latestPrice: 7500 },
    { name: 'Ayam Potong (Dada)', unit: 'potong', minStockQty: 15, stockQty: 30, latestPrice: 8000 },
    { name: 'Ayam Fillet (Dada Tanpa Tulang)', unit: 'potong', minStockQty: 10, stockQty: 20, latestPrice: 9500 },
    { name: 'Cabai Rawit', unit: 'gram', minStockQty: 800, stockQty: 3000, latestPrice: 70 },
    { name: 'Bawang Putih', unit: 'gram', minStockQty: 400, stockQty: 1500, latestPrice: 40 },
    { name: 'Tepung Terigu', unit: 'gram', minStockQty: 2000, stockQty: 8000, latestPrice: 11 },
    { name: 'Minyak Goreng', unit: 'ml', minStockQty: 1500, stockQty: 6000, latestPrice: 17 },
    { name: 'Beras Putih', unit: 'gram', minStockQty: 4000, stockQty: 15000, latestPrice: 14 },
    { name: 'Tahu', unit: 'potong', minStockQty: 15, stockQty: 40, latestPrice: 800 },
    { name: 'Tempe', unit: 'potong', minStockQty: 15, stockQty: 40, latestPrice: 900 },
    { name: 'Timun', unit: 'gram', minStockQty: 500, stockQty: 2000, latestPrice: 10 },
    { name: 'Kemangi', unit: 'gram', minStockQty: 150, stockQty: 500, latestPrice: 35 },
    { name: 'Kol', unit: 'gram', minStockQty: 400, stockQty: 1500, latestPrice: 8 },
    { name: 'Teh Celup', unit: 'pcs', minStockQty: 30, stockQty: 100, latestPrice: 180 },
    { name: 'Gula Pasir', unit: 'gram', minStockQty: 800, stockQty: 3000, latestPrice: 16 },
    { name: 'Es Batu', unit: 'pcs', minStockQty: 60, stockQty: 200, latestPrice: 500 },
    { name: 'Air Mineral', unit: 'ml', minStockQty: 3000, stockQty: 10000, latestPrice: 3 },
    { name: 'Jeruk Peras', unit: 'pcs', minStockQty: 20, stockQty: 60, latestPrice: 1200 },
    { name: 'Air Mineral Botol', unit: 'pcs', minStockQty: 15, stockQty: 50, latestPrice: 3000 },
  ];

  const ingredientMap: Record<string, string> = {};

  for (const item of ingredientsData) {
    let ing = await prisma.ingredient.findFirst({
      where: { name: item.name, businessId },
    });

    if (!ing) {
      ing = await prisma.ingredient.create({
        data: {
          businessId,
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
          businessId,
          ingredientId: ing.id,
          price: item.latestPrice,
          recordedAt: new Date(),
          recordedBy: userId,
        },
      });

      // Log initial stock movement
      await prisma.stockMovement.create({
        data: {
          businessId,
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

  // 3. Create Default Menus (Ayam Geprek Bu Yuli)
  const menusData = [
    {
      name: 'Ayam Geprek Sayap',
      category: 'Ayam Geprek',
      sellingPrice: 12000,
      recipe: [
        { name: 'Ayam Potong (Sayap)', qty: 1 },
        { name: 'Cabai Rawit', qty: 15 },
        { name: 'Bawang Putih', qty: 6 },
        { name: 'Tepung Terigu', qty: 30 },
        { name: 'Minyak Goreng', qty: 30 },
      ],
    },
    {
      name: 'Ayam Geprek Paha Bawah',
      category: 'Ayam Geprek',
      sellingPrice: 16000,
      recipe: [
        { name: 'Ayam Potong (Paha Bawah)', qty: 1 },
        { name: 'Cabai Rawit', qty: 15 },
        { name: 'Bawang Putih', qty: 6 },
        { name: 'Tepung Terigu', qty: 30 },
        { name: 'Minyak Goreng', qty: 30 },
      ],
    },
    {
      name: 'Ayam Geprek Paha Atas',
      category: 'Ayam Geprek',
      sellingPrice: 17000,
      recipe: [
        { name: 'Ayam Potong (Paha Atas)', qty: 1 },
        { name: 'Cabai Rawit', qty: 15 },
        { name: 'Bawang Putih', qty: 6 },
        { name: 'Tepung Terigu', qty: 30 },
        { name: 'Minyak Goreng', qty: 30 },
      ],
    },
    {
      name: 'Ayam Geprek Dada',
      category: 'Ayam Geprek',
      sellingPrice: 18000,
      recipe: [
        { name: 'Ayam Potong (Dada)', qty: 1 },
        { name: 'Cabai Rawit', qty: 15 },
        { name: 'Bawang Putih', qty: 6 },
        { name: 'Tepung Terigu', qty: 30 },
        { name: 'Minyak Goreng', qty: 30 },
      ],
    },
    {
      name: 'Ayam Geprek Level Setan',
      category: 'Ayam Geprek',
      sellingPrice: 20000,
      recipe: [
        { name: 'Ayam Potong (Paha Atas)', qty: 1 },
        { name: 'Cabai Rawit', qty: 25 },
        { name: 'Bawang Putih', qty: 8 },
        { name: 'Tepung Terigu', qty: 40 },
        { name: 'Minyak Goreng', qty: 40 },
      ],
    },
    {
      name: 'Ayam Geprek Fillet Crispy',
      category: 'Ayam Geprek',
      sellingPrice: 17000,
      recipe: [
        { name: 'Ayam Fillet (Dada Tanpa Tulang)', qty: 1 },
        { name: 'Cabai Rawit', qty: 20 },
        { name: 'Bawang Putih', qty: 8 },
        { name: 'Tepung Terigu', qty: 50 },
        { name: 'Minyak Goreng', qty: 50 },
      ],
    },
    {
      name: 'Paket Hemat Sayap',
      category: 'Paket',
      sellingPrice: 16000,
      recipe: [
        { name: 'Ayam Potong (Sayap)', qty: 1 },
        { name: 'Cabai Rawit', qty: 15 },
        { name: 'Bawang Putih', qty: 6 },
        { name: 'Tepung Terigu', qty: 30 },
        { name: 'Minyak Goreng', qty: 30 },
        { name: 'Beras Putih', qty: 150 },
        { name: 'Timun', qty: 20 },
        { name: 'Kemangi', qty: 5 },
        { name: 'Kol', qty: 20 },
      ],
    },
    {
      name: 'Paket Komplit Paha Atas',
      category: 'Paket',
      sellingPrice: 25000,
      recipe: [
        { name: 'Ayam Potong (Paha Atas)', qty: 1 },
        { name: 'Cabai Rawit', qty: 15 },
        { name: 'Bawang Putih', qty: 6 },
        { name: 'Tepung Terigu', qty: 30 },
        { name: 'Minyak Goreng', qty: 30 },
        { name: 'Beras Putih', qty: 150 },
        { name: 'Tahu', qty: 2 },
        { name: 'Tempe', qty: 2 },
        { name: 'Timun', qty: 20 },
        { name: 'Kemangi', qty: 5 },
        { name: 'Kol', qty: 20 },
      ],
    },
    {
      name: 'Paket Anak Kos',
      category: 'Paket',
      sellingPrice: 18500,
      recipe: [
        { name: 'Ayam Potong (Sayap)', qty: 1 },
        { name: 'Cabai Rawit', qty: 15 },
        { name: 'Bawang Putih', qty: 6 },
        { name: 'Tepung Terigu', qty: 30 },
        { name: 'Minyak Goreng', qty: 30 },
        { name: 'Beras Putih', qty: 150 },
        { name: 'Teh Celup', qty: 1 },
        { name: 'Gula Pasir', qty: 20 },
        { name: 'Air Mineral', qty: 200 },
        { name: 'Es Batu', qty: 3 },
      ],
    },
    {
      name: 'Tahu Tempe Goreng',
      category: 'Pelengkap',
      sellingPrice: 5000,
      recipe: [
        { name: 'Tahu', qty: 2 },
        { name: 'Tempe', qty: 2 },
        { name: 'Minyak Goreng', qty: 15 },
      ],
    },
    {
      name: 'Lalapan Komplit',
      category: 'Pelengkap',
      sellingPrice: 3000,
      recipe: [
        { name: 'Timun', qty: 30 },
        { name: 'Kemangi', qty: 8 },
        { name: 'Kol', qty: 25 },
      ],
    },
    {
      name: 'Nasi Putih',
      category: 'Pelengkap',
      sellingPrice: 4000,
      recipe: [
        { name: 'Beras Putih', qty: 200 },
      ],
    },
    {
      name: 'Es Teh Manis',
      category: 'Minuman',
      sellingPrice: 5000,
      recipe: [
        { name: 'Teh Celup', qty: 1 },
        { name: 'Gula Pasir', qty: 20 },
        { name: 'Air Mineral', qty: 200 },
        { name: 'Es Batu', qty: 3 },
      ],
    },
    {
      name: 'Es Jeruk',
      category: 'Minuman',
      sellingPrice: 6000,
      recipe: [
        { name: 'Jeruk Peras', qty: 2 },
        { name: 'Gula Pasir', qty: 15 },
        { name: 'Air Mineral', qty: 150 },
        { name: 'Es Batu', qty: 3 },
      ],
    },
    {
      name: 'Teh Anget',
      category: 'Minuman',
      sellingPrice: 4000,
      recipe: [
        { name: 'Teh Celup', qty: 1 },
        { name: 'Gula Pasir', qty: 15 },
        { name: 'Air Mineral', qty: 200 },
      ],
    },
    {
      name: 'Air Mineral Botol',
      category: 'Minuman',
      sellingPrice: 4000,
      recipe: [
        { name: 'Air Mineral Botol', qty: 1 },
      ],
    },
  ];

  for (const item of menusData) {
    let menu = await prisma.menu.findFirst({
      where: { name: item.name, businessId },
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
          businessId,
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
            businessId,
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
