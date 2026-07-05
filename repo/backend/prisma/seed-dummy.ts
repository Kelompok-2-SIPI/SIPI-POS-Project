import { PrismaClient, Role, TypeMovement, TransactionStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// 1. Simple LCG PRNG for reproducibility
class PRNG {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next() {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
  nextRange(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  nextChoice<T>(arr: T[]): T {
    return arr[this.nextRange(0, arr.length - 1)];
  }
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Cannot run dummy seeder in production!');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const reset = args.includes('--reset');

  if (reset) {
    console.log('Resetting dummy data...');
    await prisma.transactionItem.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.menuHppHistory.deleteMany({});
    
    // We only keep the very first StockMovement and IngredientPriceHistory created by the original seed.
    await prisma.stockMovement.deleteMany({
      where: { note: { not: 'Initial seed stock' } }
    });
    
    const ingredientsToReset = await prisma.ingredient.findMany();
    for (const ing of ingredientsToReset) {
      const firstHistory = await prisma.ingredientPriceHistory.findFirst({
        where: { ingredientId: ing.id },
        orderBy: { recordedAt: 'asc' }
      });
      if (firstHistory) {
        await prisma.ingredientPriceHistory.deleteMany({
          where: {
            ingredientId: ing.id,
            id: { not: firstHistory.id }
          }
        });
      }
    }
    console.log('Dummy data reset complete.');
  }

  // PRNG
  const prng = new PRNG(12345);

  // Users
  const ownerUser = await prisma.user.findFirst({ where: { role: Role.owner } });
  if (!ownerUser) {
    console.error('Owner user not found, run db:seed first.');
    process.exit(1);
  }

  const cashierNames = ['kasir1', 'kasir2'];
  const cashiers = [];
  for (const name of cashierNames) {
    let cashier = await prisma.user.findFirst({ where: { name } });
    if (!cashier) {
      const passwordHash = await bcrypt.hash('sipi123', 10);
      cashier = await prisma.user.create({
        data: { name, role: Role.kasir, passwordHash }
      });
    }
    cashiers.push(cashier);
  }
  const allCashiers = [ownerUser, ...cashiers];

  // Base Data
  const ingredients = await prisma.ingredient.findMany();
  const menus = await prisma.menu.findMany({ include: { recipes: true } });
  
  if (menus.length === 0 || ingredients.length === 0) {
    console.error('No menus or ingredients found, run db:seed first.');
    process.exit(1);
  }

  // Memory state for simulation
  const stockState: Record<string, number> = {};
  const priceState: Record<string, number> = {};
  ingredients.forEach(i => {
    stockState[i.id] = Number(i.stockQty);
    priceState[i.id] = Number(i.latestPrice);
  });

  const menuHppState: Record<string, number> = {};
  menus.forEach(m => {
    menuHppState[m.id] = Number(m.hpp);
  });

  // Timeline
  const startDate = new Date('2026-01-05T00:00:00Z');
  const endDate = new Date('2026-07-05T00:00:00Z');

  console.log(`Generating dummy data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

  const currentDate = new Date(startDate);
  
  // Stats
  let totalTransactions = 0;
  let totalStockMovements = 0;
  let totalPriceHistories = 0;

  // We will process month by month to use transactions
  const months: Record<string, any> = {};
  
  // Daily Loop
  while (currentDate <= endDate) {
    const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
    if (!months[monthKey]) months[monthKey] = {
      transactions: [],
      transactionItems: [],
      stockMovements: [],
      priceHistories: [],
      hppHistories: []
    };

    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    const isEndOfMonth = currentDate.getDate() >= 25;
    const isSpike = prng.next() < 0.02; // 2% chance
    const isQuiet = prng.next() < 0.01; // 1% chance

    // Weekly price updates (every Monday)
    if (currentDate.getDay() === 1) {
      for (const ing of ingredients) {
        const basePrice = Number(ingredients.find(i => i.id === ing.id)!.latestPrice);
        let fluctuation = prng.nextRange(-10, 10) / 100;
        // Big spike
        if (prng.next() < 0.05) { // 5% chance of > 15% spike
           fluctuation = prng.nextChoice([0.15, 0.20, -0.15, -0.20]);
        }
        
        let newPrice = priceState[ing.id] * (1 + fluctuation);
        if (newPrice > basePrice * 1.5) newPrice = basePrice * 1.5;
        if (newPrice < basePrice * 0.8) newPrice = basePrice * 0.8;
        newPrice = Math.max(1, Math.round(newPrice)); // prevent 0 or negative
        
        if (newPrice !== priceState[ing.id]) {
          priceState[ing.id] = newPrice;
          months[monthKey].priceHistories.push({
            id: crypto.randomUUID(),
            ingredientId: ing.id,
            price: newPrice,
            recordedAt: new Date(currentDate),
            recordedBy: ownerUser.id
          });
          totalPriceHistories++;
        }
      }

      // Recalculate Menu HPP
      for (const menu of menus) {
        let newHpp = 0;
        for (const recipe of menu.recipes) {
          newHpp += Number(recipe.qtyUsed) * priceState[recipe.ingredientId];
        }
        if (Math.abs(newHpp - menuHppState[menu.id]) > 0.01) {
           menuHppState[menu.id] = newHpp;
           months[monthKey].hppHistories.push({
             id: crypto.randomUUID(),
             menuId: menu.id,
             hpp: newHpp,
             sellingPrice: menu.sellingPrice,
             recordedAt: new Date(currentDate)
           });
        }
      }
    }

    // Daily Restock Check
    for (const ing of ingredients) {
      // Skip restock in the last month for specific ingredients to trigger critical stock without emptying the entire inventory
      if (currentDate > new Date('2026-06-15T00:00:00Z') && ing.name === 'Ayam Potong (Sayap)') {
         continue; 
      }

      const currentStock = stockState[ing.id];
      const minStock = Number(ing.minStockQty);
      
      if (currentStock < minStock * 10) {
         const targetStock = minStock * 50 + 500; // Buffer for massive daily sales
         let restockQty = targetStock - currentStock;
         restockQty += prng.nextRange(0, 100);
         stockState[ing.id] += restockQty;
         
         months[monthKey].stockMovements.push({
           id: crypto.randomUUID(),
           ingredientId: ing.id,
           type: TypeMovement.restock,
           qtyChange: restockQty,
           note: 'Restock dummy otomatis',
           createdAt: new Date(currentDate),
           createdBy: ownerUser.id
         });
         totalStockMovements++;
      }
    }

    // Transactions
    let txCount = 0;
    if (isSpike) txCount = prng.nextRange(80, 120);
    else if (isQuiet) txCount = prng.nextRange(5, 10);
    else if (isWeekend) txCount = prng.nextRange(60, 100);
    else if (isEndOfMonth) txCount = prng.nextRange(10, 30);
    else txCount = prng.nextRange(30, 60);

    for (let i = 0; i < txCount; i++) {
       const isLunch = prng.next() > 0.5;
       const hour = isLunch ? prng.nextRange(11, 14) : prng.nextRange(17, 21);
       const minute = prng.nextRange(0, 59);
       const txDate = new Date(currentDate);
       txDate.setHours(hour, minute, 0, 0);
       
       const cashier = prng.nextChoice(allCashiers);
       const isCancelled = prng.next() < 0.04; // ~4% cancelled
       
       const txId = crypto.randomUUID();
       let totalPrice = 0;
       let totalHpp = 0;
       
       const numItems = prng.nextRange(1, 4);
       const txItems = [];
       const usageMap: Record<string, number> = {};
       
       for (let j = 0; j < numItems; j++) {
         const menu = prng.nextChoice(menus);
         const qty = prng.nextRange(1, 3);
         
         // Verify stock before adding to transaction
         let canFulfill = true;
         if (!isCancelled) {
           for (const recipe of menu.recipes) {
             const ingId = recipe.ingredientId;
             const requiredQty = Number(recipe.qtyUsed) * qty;
             const currentAvailable = stockState[ingId] - (usageMap[ingId] || 0);
             if (currentAvailable < requiredQty) {
               canFulfill = false;
               break;
             }
           }
         }
         
         if (!canFulfill) continue; // Skip item if out of stock
         
         const unitPrice = Number(menu.sellingPrice);
         const unitHpp = menuHppState[menu.id];
         
         totalPrice += unitPrice * qty;
         totalHpp += unitHpp * qty;
         
         txItems.push({
           id: crypto.randomUUID(),
           transactionId: txId,
           menuId: menu.id,
           menuName: menu.name,
           qty,
           unitPrice,
           unitHpp
         });
         
         if (!isCancelled) {
           for (const recipe of menu.recipes) {
             const ingId = recipe.ingredientId;
             const used = Number(recipe.qtyUsed) * qty;
             usageMap[ingId] = (usageMap[ingId] || 0) + used;
           }
         }
       }
       
       if (txItems.length === 0) continue; // Skip empty transactions

       
       months[monthKey].transactions.push({
         id: txId,
         status: isCancelled ? TransactionStatus.cancelled : TransactionStatus.completed,
         paymentMethod: prng.next() > 0.3 ? PaymentMethod.non_cash : PaymentMethod.cash,
         totalPrice,
         totalHpp,
         cashierId: cashier.id,
         createdAt: txDate,
         completedAt: isCancelled ? null : new Date(txDate.getTime() + prng.nextRange(2, 10) * 60000)
       });
       
       months[monthKey].transactionItems.push(...txItems);
       totalTransactions++;
       
       // Deduct stock and add usage movement
       if (!isCancelled) {
         for (const [ingId, usedQty] of Object.entries(usageMap)) {
            stockState[ingId] -= usedQty;
            months[monthKey].stockMovements.push({
              id: crypto.randomUUID(),
              ingredientId: ingId,
              type: TypeMovement.usage,
              qtyChange: -usedQty,
              note: `Usage for dummy tx ${txId.substring(0,8)}`,
              createdAt: txDate,
              createdBy: cashier.id
            });
            totalStockMovements++;
         }
       }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Insert to DB by month
  for (const [monthKey, data] of Object.entries(months)) {
    console.log(`Inserting data for month: ${monthKey} (${data.transactions.length} tx)`);
    await prisma.$transaction([
      prisma.transaction.createMany({ data: data.transactions, skipDuplicates: true }),
      prisma.transactionItem.createMany({ data: data.transactionItems, skipDuplicates: true }),
      prisma.stockMovement.createMany({ data: data.stockMovements, skipDuplicates: true }),
      prisma.ingredientPriceHistory.createMany({ data: data.priceHistories, skipDuplicates: true }),
      prisma.menuHppHistory.createMany({ data: data.hppHistories, skipDuplicates: true })
    ]);
  }

  // Finalize Ingredient updates
  console.log('Updating final stock and price for ingredients...');
  for (const ing of ingredients) {
    await prisma.ingredient.update({
      where: { id: ing.id },
      data: {
        stockQty: stockState[ing.id],
        latestPrice: priceState[ing.id]
      }
    });
  }
  
  for (const menu of menus) {
    await prisma.menu.update({
      where: { id: menu.id },
      data: { hpp: menuHppState[menu.id] }
    });
  }

  console.log('--- Seeding Complete ---');
  console.log(`Total Transactions: ${totalTransactions}`);
  console.log(`Total Stock Movements: ${totalStockMovements}`);
  console.log(`Total Price Histories: ${totalPriceHistories}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
