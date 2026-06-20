/**
 * Seed SIPI POS — data awal Sprint 1
 * 3 menu (Es Teh Manis, Kopi Hitam, Pisang Goreng) + bahan baku + resep
 * Harga bahan baku berbasis satuan: gram / ml / buah
 *
 * Jalankan: npx prisma db seed
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SIPI POS database...');

  // ── 1. User demo (akun tunggal MVP) ──────────────────────────────────────
  const passwordHash = await bcrypt.hash('sipi1234', 10);
  const owner = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Admin SIPI',
      role: 'owner',
      password_hash: passwordHash,
    },
  });
  console.log(`✅ User: ${owner.name} (role: ${owner.role})`);

  // ── 2. Bahan Baku (Ingredients) ──────────────────────────────────────────
  // Harga per satuan (gram / ml / buah):
  //   Gula pasir   : Rp 15,000/kg  → Rp 15/gram
  //   Teh celup    : Rp 600/sachet  → unit=sachet, Rp 600/sachet
  //   Air minum    : Rp 5,000/19L galon → ~Rp 0.26/ml (dibulatkan Rp 0.30)
  //   Kopi robusta : Rp 90,000/kg  → Rp 90/gram
  //   Pisang kepok : Rp 20,000/kg  → Rp 20/gram
  //   Tepung terigu: Rp 12,000/kg  → Rp 12/gram
  //   Minyak goreng: Rp 16,000/L   → Rp 16/ml

  const ingredientsData = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      name: 'Gula Pasir',
      unit: 'gram',
      stock_qty: 5000,     // 5kg awal
      min_stock_qty: 500,  // alert jika < 500g
      latest_price: 15,    // Rp 15/gram
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      name: 'Teh Celup',
      unit: 'sachet',
      stock_qty: 100,
      min_stock_qty: 10,
      latest_price: 600,   // Rp 600/sachet
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      name: 'Air Minum',
      unit: 'ml',
      stock_qty: 20000,    // 20 liter
      min_stock_qty: 5000,
      latest_price: 0.30,  // Rp 0.30/ml
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      name: 'Kopi Robusta',
      unit: 'gram',
      stock_qty: 1000,
      min_stock_qty: 100,
      latest_price: 90,    // Rp 90/gram
    },
    {
      id: '10000000-0000-0000-0000-000000000005',
      name: 'Pisang Kepok',
      unit: 'gram',
      stock_qty: 3000,     // 3kg
      min_stock_qty: 300,
      latest_price: 20,    // Rp 20/gram
    },
    {
      id: '10000000-0000-0000-0000-000000000006',
      name: 'Tepung Terigu',
      unit: 'gram',
      stock_qty: 2000,
      min_stock_qty: 200,
      latest_price: 12,    // Rp 12/gram
    },
    {
      id: '10000000-0000-0000-0000-000000000007',
      name: 'Minyak Goreng',
      unit: 'ml',
      stock_qty: 2000,
      min_stock_qty: 200,
      latest_price: 16,    // Rp 16/ml
    },
  ];

  for (const data of ingredientsData) {
    await prisma.ingredient.upsert({
      where: { id: data.id },
      update: {},
      create: data,
    });
  }
  console.log(`✅ ${ingredientsData.length} bahan baku di-seed`);

  // Catat harga awal ke price history
  const priceHistoryEntries = ingredientsData.map((ing) => ({
    ingredient_id: ing.id,
    price: ing.latest_price,
    recorded_at: new Date('2026-06-20'),
    recorded_by: owner.id,
  }));
  await prisma.ingredientPriceHistory.createMany({
    data: priceHistoryEntries,
    skipDuplicates: true,
  });
  console.log('✅ Riwayat harga awal dicatat');

  // ── 3. Catat stok masuk awal via stock_movements ─────────────────────────
  const restockData = ingredientsData.map((ing) => ({
    ingredient_id: ing.id,
    type: 'restock',
    qty_change: ing.stock_qty,
    note: 'Stok awal — setup sistem SIPI',
    created_by: owner.id,
  }));
  await prisma.stockMovement.createMany({ data: restockData, skipDuplicates: true });
  console.log('✅ Stock movements awal dicatat');

  // ── 4. Menu ──────────────────────────────────────────────────────────────
  // HPP dihitung dari resep:
  //   Es Teh Manis : 200ml × 0.30 + 1 sachet × 600 + 15g × 15 = 60 + 600 + 225 = 885
  //   Kopi Hitam   : 200ml × 0.30 + 10g × 90  + 10g × 15 = 60 + 900 + 150 = 1,110
  //   Pisang Goreng: 150g × 20   + 50g × 12   + 30ml × 16 = 3,000 + 600 + 480 = 4,080

  const menusData = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      name: 'Es Teh Manis',
      category: 'Minuman',
      selling_price: 5000,
      hpp: 885,
      is_available: true,
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      name: 'Kopi Hitam',
      category: 'Minuman',
      selling_price: 7000,
      hpp: 1110,
      is_available: true,
    },
    {
      id: '20000000-0000-0000-0000-000000000003',
      name: 'Pisang Goreng',
      category: 'Snack',
      selling_price: 10000,
      hpp: 4080,
      is_available: true,
    },
  ];

  for (const data of menusData) {
    await prisma.menu.upsert({
      where: { id: data.id },
      update: {},
      create: data,
    });
  }
  console.log(`✅ ${menusData.length} menu di-seed`);

  // ── 5. Resep (Recipe Items) ───────────────────────────────────────────────
  const recipeData = [
    // Es Teh Manis
    { menu_id: '20000000-0000-0000-0000-000000000001', ingredient_id: '10000000-0000-0000-0000-000000000003', qty_used: 200 },  // 200ml Air
    { menu_id: '20000000-0000-0000-0000-000000000001', ingredient_id: '10000000-0000-0000-0000-000000000002', qty_used: 1 },    // 1 sachet Teh
    { menu_id: '20000000-0000-0000-0000-000000000001', ingredient_id: '10000000-0000-0000-0000-000000000001', qty_used: 15 },   // 15g Gula

    // Kopi Hitam
    { menu_id: '20000000-0000-0000-0000-000000000002', ingredient_id: '10000000-0000-0000-0000-000000000003', qty_used: 200 },  // 200ml Air
    { menu_id: '20000000-0000-0000-0000-000000000002', ingredient_id: '10000000-0000-0000-0000-000000000004', qty_used: 10 },   // 10g Kopi
    { menu_id: '20000000-0000-0000-0000-000000000002', ingredient_id: '10000000-0000-0000-0000-000000000001', qty_used: 10 },   // 10g Gula

    // Pisang Goreng
    { menu_id: '20000000-0000-0000-0000-000000000003', ingredient_id: '10000000-0000-0000-0000-000000000005', qty_used: 150 },  // 150g Pisang
    { menu_id: '20000000-0000-0000-0000-000000000003', ingredient_id: '10000000-0000-0000-0000-000000000006', qty_used: 50 },   // 50g Tepung
    { menu_id: '20000000-0000-0000-0000-000000000003', ingredient_id: '10000000-0000-0000-0000-000000000007', qty_used: 30 },   // 30ml Minyak
  ];

  await prisma.recipeItem.createMany({ data: recipeData, skipDuplicates: true });
  console.log(`✅ ${recipeData.length} recipe items di-seed`);

  console.log('\n🎉 Seed selesai! Login: name="Admin SIPI", password="sipi1234"');
  console.log('\nRingkasan HPP menu:');
  console.log('  Es Teh Manis  : HPP Rp885   | Jual Rp5.000  | Margin 82%');
  console.log('  Kopi Hitam    : HPP Rp1.110  | Jual Rp7.000  | Margin 84%');
  console.log('  Pisang Goreng : HPP Rp4.080  | Jual Rp10.000 | Margin 59%');
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
