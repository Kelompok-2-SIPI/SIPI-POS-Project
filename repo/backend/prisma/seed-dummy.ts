import { PrismaClient, Role, TypeMovement, TransactionStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Simulasi histori Ayam Geprek Bu Yuli (UMKM F&B Jogja) — buka awal Jan 2026,
// berkembang organik sampai stabil ramai per Juli 2026. Timeline FIXED
// 2026-01-01 s/d 2026-07-08 (tanggal presentasi), bukan dinamis dari waktu run script.

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

// ---- Kalender & fase bisnis ----
const RAMADAN_START = '2026-02-19';
const RAMADAN_END = '2026-03-20'; // 30 hari (istikmal), 1 Syawal = 21 Maret 2026 (Kemenag)
const PRE_LEBARAN_SURGE = new Set(['2026-03-17', '2026-03-18', '2026-03-19', '2026-03-20']);
const LEBARAN_CLOSED = new Set(['2026-03-21', '2026-03-22', '2026-03-23']);
const POST_LEBARAN_RECOVERY_START = '2026-03-24';
const POST_LEBARAN_RECOVERY_END = '2026-03-31';
const QUIET_DAYS = new Set(['2026-03-05', '2026-05-19']); // sepi ekstrem tanpa sebab jelas
const OWNER_CLOSED_DAY = '2026-05-04'; // tutup alasan pribadi owner

// ---- Helper tanggal (semua UTC-explicit, tidak bergantung timezone host) ----
function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function localToUtc(y: number, m: number, d: number, hour: number, minute: number, second = 0): Date {
  // Bangun instant UTC yang, kalau dibaca dgn +7 (Asia/Jakarta), jatuh persis di jam lokal yg dimaksud.
  return new Date(Date.UTC(y, m, d, hour - 7, minute, second));
}
const EPOCH = new Date('2026-01-01T00:00:00Z').getTime();
function dayIndex(dstr: string): number {
  return Math.round((new Date(`${dstr}T00:00:00Z`).getTime() - EPOCH) / 86400000);
}
function interp(points: [string, number][], dstr: string): number {
  const t = dayIndex(dstr);
  const t0First = dayIndex(points[0][0]);
  const tLast = dayIndex(points[points.length - 1][0]);
  if (t <= t0First) return points[0][1];
  if (t >= tLast) return points[points.length - 1][1];
  for (let i = 0; i < points.length - 1; i++) {
    const ta = dayIndex(points[i][0]), tb = dayIndex(points[i + 1][0]);
    if (t >= ta && t <= tb) {
      const frac = tb === ta ? 0 : (t - ta) / (tb - ta);
      return points[i][1] + (points[i + 1][1] - points[i][1]) * frac;
    }
  }
  return points[points.length - 1][1];
}

// ---- Kurva pertumbuhan transaksi/hari (base, sebelum noise & efek Ramadan) ----
const GROWTH_WEEKDAY: [string, number][] = [
  ['2026-01-01', 9], ['2026-02-01', 16], ['2026-02-18', 23],
  ['2026-04-01', 28], ['2026-05-01', 35], ['2026-06-01', 42], ['2026-07-08', 50],
];
const GROWTH_WEEKEND: [string, number][] = [
  ['2026-01-01', 15], ['2026-02-01', 26], ['2026-02-18', 35],
  ['2026-04-01', 46], ['2026-05-01', 58], ['2026-06-01', 72], ['2026-07-08', 88],
];

// ---- Jadwal harga bahan baku volatile (Rp per satuan) ----
const CABAI_SCHEDULE: [string, number][] = [
  ['2026-01-01', 70], ['2026-02-01', 74], ['2026-02-16', 95], ['2026-03-01', 150],
  ['2026-03-18', 210], ['2026-03-24', 150], ['2026-04-10', 95], ['2026-05-15', 88],
  ['2026-06-05', 95], ['2026-06-18', 150], ['2026-07-01', 105], ['2026-07-08', 98],
];
const MINYAK_SCHEDULE: [string, number][] = [
  ['2026-01-01', 17], ['2026-03-05', 17], ['2026-03-18', 21], ['2026-04-05', 17.5], ['2026-07-08', 17.5],
];
const BAWANG_SCHEDULE: [string, number][] = [
  ['2026-01-01', 40], ['2026-05-10', 40], ['2026-05-20', 44], ['2026-06-10', 41], ['2026-07-08', 41],
];
// Multiplier ayam potong mentah (bukan fillet) — ikut lonjakan demand jelang Lebaran
const AYAM_SEASONAL_MULT: [string, number][] = [
  ['2026-01-01', 1.0], ['2026-03-05', 1.0], ['2026-03-18', 1.2], ['2026-04-15', 1.0], ['2026-07-08', 1.0],
];

const BASE_PRICES: Record<string, number> = {
  'Ayam Potong (Sayap)': 4500, 'Ayam Potong (Paha Bawah)': 6500, 'Ayam Potong (Paha Atas)': 7500, 'Ayam Potong (Dada)': 8000,
  'Ayam Fillet (Dada Tanpa Tulang)': 9500,
  'Tepung Terigu': 11, 'Beras Putih': 14, 'Tahu': 800, 'Tempe': 900, 'Timun': 10, 'Kemangi': 35, 'Kol': 8,
  'Teh Celup': 180, 'Gula Pasir': 16, 'Es Batu': 500, 'Air Mineral': 3, 'Jeruk Peras': 1200, 'Air Mineral Botol': 3000,
};
const AYAM_RAW_CUTS = new Set(['Ayam Potong (Sayap)', 'Ayam Potong (Paha Bawah)', 'Ayam Potong (Paha Atas)', 'Ayam Potong (Dada)']);
const SCHEDULED: Record<string, { schedule: [string, number][]; noisePct: number }> = {
  'Cabai Rawit': { schedule: CABAI_SCHEDULE, noisePct: 6 },
  'Minyak Goreng': { schedule: MINYAK_SCHEDULE, noisePct: 3 },
  'Bawang Putih': { schedule: BAWANG_SCHEDULE, noisePct: 5 },
};

// ---- Restock: perishable dicek/dibeli lebih sering, durable jarang tapi banyak ----
const PERISHABLE = new Set([
  'Ayam Potong (Sayap)', 'Ayam Potong (Paha Bawah)', 'Ayam Potong (Paha Atas)', 'Ayam Potong (Dada)',
  'Ayam Fillet (Dada Tanpa Tulang)', 'Cabai Rawit', 'Tahu', 'Tempe', 'Timun', 'Kemangi', 'Kol', 'Jeruk Peras',
]);
const DURABLE = new Set(['Tepung Terigu', 'Minyak Goreng', 'Beras Putih']);
function restockCycleDays(name: string) {
  return PERISHABLE.has(name) ? 2 : (DURABLE.has(name) ? 10 : 5);
}

// Satuan hitungan diskrit (tidak bisa pecahan secara fisik, mis. "0.64 potong ayam"
// tidak masuk akal) — beda dengan gram/ml yang wajar desimal. Sinkronkan manual dengan
// DISCRETE_UNITS di frontend/src/lib/format.ts kalau ada satuan baru ditambahkan.
const DISCRETE_UNITS = new Set(['potong', 'pcs', 'butir', 'buah', 'lembar', 'ekor', 'biji']);
function roundToUnit(qty: number, unit: string): number {
  return DISCRETE_UNITS.has(unit.trim().toLowerCase()) ? Math.round(qty) : Math.round(qty * 100) / 100;
}
// Skenario stok kritis yang sengaja "diskenariokan": cabai jelang Lebaran (historis) + cabai
// jelang tanggal presentasi (supaya live di /restock-recommendations), dan ayam pertengahan Juni
// (keterlambatan suplier biasa, tidak terkait momen kalender apa pun).
function restockMultiplier(name: string, dstr: string): number {
  if (name === 'Cabai Rawit' && (dstr === '2026-03-17' || dstr === '2026-03-18' || dstr === '2026-03-19')) return 0.3;
  if (name === 'Cabai Rawit' && dstr >= '2026-07-03' && dstr <= '2026-07-08') return 0.35;
  if (name === 'Ayam Potong (Paha Atas)' && dstr === '2026-06-10') return 0;
  return 1.0;
}

// ---- Margin kritis: Sayap & Fillet Crispy paling rentan, owner naikkan harga ~3 minggu setelah terdeteksi ----
const CRITICAL_CANDIDATES = new Set(['Ayam Geprek Sayap', 'Ayam Geprek Fillet Crispy']);
const PRICE_BUMP: Record<string, number> = { 'Ayam Geprek Sayap': 1500, 'Ayam Geprek Fillet Crispy': 1500 };
const CRITICAL_REACTION_DAYS = 21;

// ---- Pola jam (Asia/Jakarta lokal): puncak makan siang & makan malam ----
const NORMAL_HOUR_WEIGHTS: Record<number, number> = { 10: 1, 11: 8, 12: 14, 13: 11, 14: 4, 17: 6, 18: 12, 19: 14, 20: 11, 21: 5, 22: 1 };
const RAMADAN_HOUR_WEIGHTS: Record<number, number> = { 11: 1, 12: 2, 13: 1, 16: 3, 17: 8, 18: 16, 19: 10, 20: 3, 21: 1 };

function weightedHour(weights: Record<number, number>, prng: PRNG): number {
  const entries = Object.entries(weights).map(([h, w]) => [Number(h), w] as [number, number]);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = prng.next() * total;
  for (const [h, w] of entries) {
    if (r < w) return h;
    r -= w;
  }
  return entries[entries.length - 1][0];
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

    // Kita hanya pertahankan StockMovement/IngredientPriceHistory pertama dari seed dasar.
    await prisma.stockMovement.deleteMany({
      where: { note: { not: 'Initial seed stock' } },
    });

    const ingredientsToReset = await prisma.ingredient.findMany();
    for (const ing of ingredientsToReset) {
      const firstHistory = await prisma.ingredientPriceHistory.findFirst({
        where: { ingredientId: ing.id },
        orderBy: { recordedAt: 'asc' },
      });
      if (firstHistory) {
        await prisma.ingredientPriceHistory.deleteMany({
          where: { ingredientId: ing.id, id: { not: firstHistory.id } },
        });
      }
    }
    console.log('Dummy data reset complete.');
  }

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
      cashier = await prisma.user.create({ data: { name, role: Role.kasir, passwordHash } });
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

  // State simulasi
  const stockState: Record<string, number> = {};
  const priceState: Record<string, number> = {};
  const avgDailyUsage: Record<string, number> = {};
  const lastRestockDate: Record<string, Date> = {};
  ingredients.forEach((i) => {
    stockState[i.id] = Number(i.stockQty);
    priceState[i.id] = Number(i.latestPrice);
    avgDailyUsage[i.id] = 0;
  });

  const menuHppState: Record<string, number> = {};
  const sellingPriceState: Record<string, number> = {};
  const criticalSince: Record<string, Date | null> = {};
  const adjusted: Record<string, boolean> = {};
  menus.forEach((m) => {
    menuHppState[m.id] = Number(m.hpp);
    sellingPriceState[m.id] = Number(m.sellingPrice);
    criticalSince[m.id] = null;
    adjusted[m.id] = false;
  });

  // Timeline FIXED — bukan dinamis dari Date.now()
  const START = { y: 2026, m: 0, d: 1 };
  const END = { y: 2026, m: 6, d: 8 };
  console.log(`Generating dummy data from 2026-01-01 to 2026-07-08 (Ayam Geprek Bu Yuli)`);

  let cur = new Date(Date.UTC(START.y, START.m, START.d));
  const endTime = Date.UTC(END.y, END.m, END.d);

  let totalTransactions = 0;
  let totalStockMovements = 0;
  let totalPriceHistories = 0;
  let lastLoggedMonth = '';

  const months: Record<string, any> = {};

  while (cur.getTime() <= endTime) {
    const y = cur.getUTCFullYear(), m = cur.getUTCMonth(), d = cur.getUTCDate();
    const dstr = ymd(y, m, d);
    const monthKey = `${y}-${m}`;
    if (!months[monthKey]) {
      months[monthKey] = { transactions: [], transactionItems: [], stockMovements: [], priceHistories: [], hppHistories: [] };
    }
    if (monthKey !== lastLoggedMonth) {
      console.log(`\n=== Memproses bulan ${dstr.slice(0, 7)} ===`);
      lastLoggedMonth = monthKey;
    }

    const dow = new Date(Date.UTC(y, m, d)).getUTCDay(); // 0=Minggu..6=Sabtu
    const isWeekend = dow === 0 || dow === 6;
    const isMonday = dow === 1;
    const isRamadan = dstr >= RAMADAN_START && dstr <= RAMADAN_END;
    const isPreLebaranSurge = PRE_LEBARAN_SURGE.has(dstr);
    const isFullyClosed = LEBARAN_CLOSED.has(dstr) || dstr === OWNER_CLOSED_DAY;
    const isPostLebaranRecovery = dstr >= POST_LEBARAN_RECOVERY_START && dstr <= POST_LEBARAN_RECOVERY_END;
    const isQuietDay = QUIET_DAYS.has(dstr);

    if (isFullyClosed) {
      console.log(`  ${dstr}: TUTUP (libur Lebaran / alasan pribadi owner)`);
      cur = new Date(Date.UTC(y, m, d + 1));
      continue;
    }

    // 1. Update harga bahan baku mingguan (tiap Senin) + rekalkulasi HPP menu
    if (isMonday) {
      for (const ing of ingredients) {
        let newPrice: number;
        if (AYAM_RAW_CUTS.has(ing.name)) {
          const mult = interp(AYAM_SEASONAL_MULT, dstr);
          const noise = prng.nextRange(-3, 3) / 100;
          newPrice = BASE_PRICES[ing.name] * mult * (1 + noise);
        } else if (SCHEDULED[ing.name]) {
          const { schedule, noisePct } = SCHEDULED[ing.name];
          const target = interp(schedule, dstr);
          const noise = prng.nextRange(-noisePct, noisePct) / 100;
          newPrice = target * (1 + noise);
        } else {
          const base = BASE_PRICES[ing.name];
          const fluctuation = prng.nextRange(-4, 4) / 100;
          newPrice = priceState[ing.id] * (1 + fluctuation);
          if (newPrice > base * 1.15) newPrice = base * 1.15;
          if (newPrice < base * 0.85) newPrice = base * 0.85;
        }
        newPrice = Math.max(1, Math.round(newPrice * 100) / 100);

        if (Math.abs(newPrice - priceState[ing.id]) > 0.005) {
          priceState[ing.id] = newPrice;
          months[monthKey].priceHistories.push({
            id: crypto.randomUUID(), ingredientId: ing.id, price: newPrice,
            recordedAt: new Date(Date.UTC(y, m, d)), recordedBy: ownerUser.id,
          });
          totalPriceHistories++;
        }
      }

      for (const menu of menus) {
        let newHpp = 0;
        for (const recipe of menu.recipes) newHpp += Number(recipe.qtyUsed) * priceState[recipe.ingredientId];
        menuHppState[menu.id] = newHpp;

        months[monthKey].hppHistories.push({
          id: crypto.randomUUID(), menuId: menu.id, hpp: newHpp,
          sellingPrice: sellingPriceState[menu.id], recordedAt: new Date(Date.UTC(y, m, d)),
        });

        if (CRITICAL_CANDIDATES.has(menu.name)) {
          const ratio = newHpp / sellingPriceState[menu.id];
          if (ratio > 0.8 && !criticalSince[menu.id]) {
            criticalSince[menu.id] = new Date(Date.UTC(y, m, d));
            console.log(`  [Margin kritis terdeteksi] ${menu.name} rasio ${(ratio * 100).toFixed(1)}% pada ${dstr}`);
          }
          if (criticalSince[menu.id] && !adjusted[menu.id]) {
            const daysSince = (Date.UTC(y, m, d) - criticalSince[menu.id]!.getTime()) / 86400000;
            if (daysSince >= CRITICAL_REACTION_DAYS) {
              sellingPriceState[menu.id] += PRICE_BUMP[menu.name];
              adjusted[menu.id] = true;
              console.log(`  [Owner menyesuaikan harga] ${menu.name} -> Rp${sellingPriceState[menu.id]} pada ${dstr}`);
            }
          }
        }
      }
    }

    // 2. Restock harian berbasis pemakaian rata-rata (bukan auto-fill flat)
    for (const ing of ingredients) {
      const cycle = restockCycleDays(ing.name);
      const daysSince = lastRestockDate[ing.id]
        ? Math.round((Date.UTC(y, m, d) - lastRestockDate[ing.id].getTime()) / 86400000)
        : cycle;
      const avgUsage = avgDailyUsage[ing.id] || 0;
      const safetyDays = PERISHABLE.has(ing.name) ? 1.5 : (DURABLE.has(ing.name) ? 3 : 2.5);
      const reorderPoint = avgUsage * safetyDays;

      const shouldRestock = stockState[ing.id] < reorderPoint || daysSince >= cycle;
      if (shouldRestock) {
        let orderQty = avgUsage > 0
          ? avgUsage * cycle * (prng.nextRange(90, 130) / 100)
          : Number(ing.minStockQty) * (prng.nextRange(100, 150) / 100);
        orderQty *= restockMultiplier(ing.name, dstr);
        orderQty = roundToUnit(orderQty, ing.unit);

        if (orderQty > 0) {
          const limited = restockMultiplier(ing.name, dstr) < 1;
          stockState[ing.id] += orderQty;
          months[monthKey].stockMovements.push({
            id: crypto.randomUUID(), ingredientId: ing.id, type: TypeMovement.restock,
            qtyChange: orderQty, note: limited ? 'Restock terbatas - suplier keteteran' : 'Restock rutin',
            createdAt: new Date(Date.UTC(y, m, d, 2)), createdBy: ownerUser.id,
          });
          totalStockMovements++;
        }
        lastRestockDate[ing.id] = new Date(Date.UTC(y, m, d));
      }
    }

    // 3. Tentukan jumlah transaksi hari ini
    let base = isWeekend ? interp(GROWTH_WEEKEND, dstr) : interp(GROWTH_WEEKDAY, dstr);
    let txCount = Math.round(base * (prng.nextRange(80, 120) / 100));
    if (isRamadan) txCount = Math.round(txCount * (isPreLebaranSurge ? 1.5 : 0.95));
    if (isPostLebaranRecovery) {
      const dayIntoRecovery = dayIndex(dstr) - dayIndex(POST_LEBARAN_RECOVERY_START);
      const ramp = 0.5 + 0.5 * Math.min(1, dayIntoRecovery / 7);
      txCount = Math.round(txCount * ramp);
    }
    if (isQuietDay) txCount = Math.round(txCount * 0.28);
    if (txCount < 0) txCount = 0;

    const hourWeights = isRamadan ? RAMADAN_HOUR_WEIGHTS : NORMAL_HOUR_WEIGHTS;
    const dailyUsage: Record<string, number> = {};

    for (let i = 0; i < txCount; i++) {
      const hour = weightedHour(hourWeights, prng);
      const minute = prng.nextRange(0, 59);
      const txDate = localToUtc(y, m, d, hour, minute);

      const cashier = prng.nextChoice(allCashiers);
      const isCancelled = prng.next() < 0.04;

      const txId = crypto.randomUUID();
      let totalPrice = 0;
      let totalHpp = 0;

      const numItems = prng.nextRange(1, 4);
      const txItems = [];
      const usageMap: Record<string, number> = {};

      for (let j = 0; j < numItems; j++) {
        const menu = prng.nextChoice(menus);
        const qty = prng.nextRange(1, 3);

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
        if (!canFulfill) continue;

        const unitPrice = sellingPriceState[menu.id];
        const unitHpp = menuHppState[menu.id];

        totalPrice += unitPrice * qty;
        totalHpp += unitHpp * qty;

        txItems.push({
          id: crypto.randomUUID(), transactionId: txId, menuId: menu.id, menuName: menu.name,
          qty, unitPrice, unitHpp,
        });

        if (!isCancelled) {
          for (const recipe of menu.recipes) {
            const ingId = recipe.ingredientId;
            const used = Number(recipe.qtyUsed) * qty;
            usageMap[ingId] = (usageMap[ingId] || 0) + used;
          }
        }
      }

      if (txItems.length === 0) continue;

      months[monthKey].transactions.push({
        id: txId,
        status: isCancelled ? TransactionStatus.cancelled : TransactionStatus.completed,
        paymentMethod: prng.next() > 0.3 ? PaymentMethod.non_cash : PaymentMethod.cash,
        totalPrice, totalHpp, cashierId: cashier.id,
        createdAt: txDate,
        completedAt: isCancelled ? null : new Date(txDate.getTime() + prng.nextRange(2, 10) * 60000),
      });
      months[monthKey].transactionItems.push(...txItems);
      totalTransactions++;

      if (totalTransactions % 1000 === 0) {
        console.log(`  -> ${totalTransactions} transaksi diproses (sampai tanggal ${dstr})`);
      }

      if (!isCancelled) {
        for (const [ingId, usedQty] of Object.entries(usageMap)) {
          stockState[ingId] -= usedQty;
          dailyUsage[ingId] = (dailyUsage[ingId] || 0) + usedQty;
          months[monthKey].stockMovements.push({
            id: crypto.randomUUID(), ingredientId: ingId, type: TypeMovement.usage,
            qtyChange: -usedQty, note: `Pemakaian transaksi ${txId.substring(0, 8)}`,
            createdAt: txDate, createdBy: cashier.id,
          });
          totalStockMovements++;
        }
      }
    }

    // 4. Update rata-rata pemakaian harian (EMA) buat dasar restock besok
    for (const ing of ingredients) {
      const today = dailyUsage[ing.id] || 0;
      avgDailyUsage[ing.id] = (avgDailyUsage[ing.id] || 0) * 0.85 + today * 0.15;
    }

    cur = new Date(Date.UTC(y, m, d + 1));
  }

  // Insert to DB by month
  for (const [monthKey, data] of Object.entries(months)) {
    console.log(`Inserting data for month: ${monthKey} (${data.transactions.length} tx)`);
    await prisma.$transaction([
      prisma.transaction.createMany({ data: data.transactions, skipDuplicates: true }),
      prisma.transactionItem.createMany({ data: data.transactionItems, skipDuplicates: true }),
      prisma.stockMovement.createMany({ data: data.stockMovements, skipDuplicates: true }),
      prisma.ingredientPriceHistory.createMany({ data: data.priceHistories, skipDuplicates: true }),
      prisma.menuHppHistory.createMany({ data: data.hppHistories, skipDuplicates: true }),
    ]);
  }

  // Finalize Ingredient updates
  console.log('Updating final stock and price for ingredients...');
  for (const ing of ingredients) {
    await prisma.ingredient.update({
      where: { id: ing.id },
      data: { stockQty: stockState[ing.id], latestPrice: priceState[ing.id] },
    });
  }

  // Finalize Menu updates (HPP + harga jual, kalau owner sempat menyesuaikan karena margin kritis)
  for (const menu of menus) {
    await prisma.menu.update({
      where: { id: menu.id },
      data: { hpp: menuHppState[menu.id], sellingPrice: sellingPriceState[menu.id] },
    });
  }

  console.log('\n--- Seeding Complete ---');
  console.log(`Total Transactions: ${totalTransactions}`);
  console.log(`Total Stock Movements: ${totalStockMovements}`);
  console.log(`Total Price Histories: ${totalPriceHistories}`);
  for (const menu of menus) {
    if (adjusted[menu.id]) {
      console.log(`Owner menaikkan harga ${menu.name} jadi Rp${sellingPriceState[menu.id]} karena margin kritis.`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
