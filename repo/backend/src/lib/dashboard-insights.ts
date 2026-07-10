import { prisma } from './db';
import { TransactionStatus } from '@prisma/client';

/**
 * Tren penjualan bulanan (N bulan terakhir, default 6).
 * Dipakai oleh grafik "Tren Penjualan Bulanan" di dashboard DAN konteks AI chatbot.
 */
export async function getMonthlySales(businessId: string, months = 6) {
  const clamped = Math.min(Math.max(months, 1), 24);
  const now = new Date();
  const gmt7 = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60 * 1000);

  const results = [];
  for (let i = clamped - 1; i >= 0; i--) {
    const firstDay = new Date(Date.UTC(gmt7.getUTCFullYear(), gmt7.getUTCMonth() - i, 1));
    const lastDay = new Date(Date.UTC(gmt7.getUTCFullYear(), gmt7.getUTCMonth() - i + 1, 0));
    const startStr = `${firstDay.getUTCFullYear()}-${String(firstDay.getUTCMonth() + 1).padStart(2, '0')}-01`;
    const endStr = `${lastDay.getUTCFullYear()}-${String(lastDay.getUTCMonth() + 1).padStart(2, '0')}-${String(lastDay.getUTCDate()).padStart(2, '0')}`;
    const start = new Date(`${startStr}T00:00:00+07:00`);
    const end = new Date(`${endStr}T23:59:59.999+07:00`);

    const agg = await prisma.transaction.aggregate({
      where: { businessId, status: TransactionStatus.completed, completedAt: { gte: start, lte: end } },
      _sum: { totalPrice: true },
      _count: true,
    });

    results.push({
      month: `${firstDay.getUTCFullYear()}-${String(firstDay.getUTCMonth() + 1).padStart(2, '0')}`,
      label: firstDay.toLocaleDateString('id-ID', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
      totalRevenue: Number(agg._sum.totalPrice || 0),
      transactionsCount: agg._count,
    });
  }

  return results;
}

/**
 * Tren estimasi laba kotor bulanan (N bulan terakhir, default 6) — window bulan-per-bulan
 * SAMA seperti getMonthlySales, formula SAMA seperti "Estimasi Laba Kotor" di
 * GET /dashboard/summary (laba = pendapatan - total HPP transaksi selesai). Dipakai
 * konteks AI chatbot supaya bisa menjawab soal laba/profit historis, bukan cuma
 * pendapatan — sebelumnya system prompt cuma punya data revenue bulanan.
 */
export async function getMonthlyProfitTrend(businessId: string, months = 6) {
  const clamped = Math.min(Math.max(months, 1), 24);
  const now = new Date();
  const gmt7 = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60 * 1000);

  const results = [];
  for (let i = clamped - 1; i >= 0; i--) {
    const firstDay = new Date(Date.UTC(gmt7.getUTCFullYear(), gmt7.getUTCMonth() - i, 1));
    const lastDay = new Date(Date.UTC(gmt7.getUTCFullYear(), gmt7.getUTCMonth() - i + 1, 0));
    const startStr = `${firstDay.getUTCFullYear()}-${String(firstDay.getUTCMonth() + 1).padStart(2, '0')}-01`;
    const endStr = `${lastDay.getUTCFullYear()}-${String(lastDay.getUTCMonth() + 1).padStart(2, '0')}-${String(lastDay.getUTCDate()).padStart(2, '0')}`;
    const start = new Date(`${startStr}T00:00:00+07:00`);
    const end = new Date(`${endStr}T23:59:59.999+07:00`);

    const agg = await prisma.transaction.aggregate({
      where: { businessId, status: TransactionStatus.completed, completedAt: { gte: start, lte: end } },
      _sum: { totalPrice: true, totalHpp: true },
      _count: true,
    });

    const totalRevenue = Number(agg._sum.totalPrice || 0);
    const totalHpp = Number(agg._sum.totalHpp || 0);

    results.push({
      month: `${firstDay.getUTCFullYear()}-${String(firstDay.getUTCMonth() + 1).padStart(2, '0')}`,
      label: firstDay.toLocaleDateString('id-ID', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
      totalRevenue,
      totalHpp,
      grossProfit: totalRevenue - totalHpp,
      transactionsCount: agg._count,
    });
  }

  return results;
}

// Geser instant UTC transaksi ke "jam dinding" Asia/Jakarta (UTC+7), dibaca lewat getUTC*
export function toJakartaWallClock(date: Date): Date {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000);
}

export const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

/**
 * Pola kunjungan per hari (Senin-Minggu), rata-rata dari N minggu terakhir (default 4)
 * — proxy pakai jumlah transaksi selesai. Dipakai oleh card "Pola Pengunjung Mingguan"
 * di dashboard DAN konteks AI chatbot.
 */
export async function getVisitPatternByDay(businessId: string, weeks = 4) {
  const now = new Date();
  const nowJakarta = toJakartaWallClock(now);
  // Akhir periode: akhir hari ini (waktu Jakarta), awal: N*7 hari sebelumnya jam 00:00 Jakarta
  const endJakartaMidnight = Date.UTC(nowJakarta.getUTCFullYear(), nowJakarta.getUTCMonth(), nowJakarta.getUTCDate() + 1); // esok 00:00 Jakarta (exclusive)
  const startJakartaMidnight = endJakartaMidnight - weeks * 7 * 24 * 60 * 60 * 1000;
  const start = new Date(startJakartaMidnight - 7 * 60 * 60 * 1000); // balik ke UTC instant
  const end = new Date(endJakartaMidnight - 7 * 60 * 60 * 1000);

  const txs = await prisma.transaction.findMany({
    where: { businessId, status: TransactionStatus.completed, completedAt: { gte: start, lt: end } },
    select: { completedAt: true },
  });

  const countByDay = [0, 0, 0, 0, 0, 0, 0]; // index 0 = Senin ... 6 = Minggu
  for (const tx of txs) {
    if (!tx.completedAt) continue;
    const jakarta = toJakartaWallClock(tx.completedAt);
    const jsDay = jakarta.getUTCDay(); // 0 = Minggu
    const idx = (jsDay + 6) % 7; // 0 = Senin ... 6 = Minggu
    countByDay[idx]++;
  }

  const data = DAY_NAMES.map((day, idx) => ({
    day,
    totalTransactions: countByDay[idx],
    avgTransactions: Math.round((countByDay[idx] / weeks) * 100) / 100,
  }));

  let busiestDay = data[0];
  for (const r of data) if (r.avgTransactions > busiestDay.avgTransactions) busiestDay = r;

  return { weeksAnalyzed: weeks, startDate: start.toISOString(), endDate: end.toISOString(), data, busiestDay: { day: busiestDay.day, avgTransactions: busiestDay.avgTransactions } };
}

/**
 * Pola kunjungan per jam (0-23), total dari N minggu terakhir (default 4)
 * — proxy pakai jumlah transaksi selesai. Dipakai oleh card "Jam Tersibuk"
 * di dashboard DAN konteks AI chatbot.
 */
export async function getVisitPatternByHour(businessId: string, weeks = 4) {
  const now = new Date();
  const nowJakarta = toJakartaWallClock(now);
  const endJakartaMidnight = Date.UTC(nowJakarta.getUTCFullYear(), nowJakarta.getUTCMonth(), nowJakarta.getUTCDate() + 1);
  const startJakartaMidnight = endJakartaMidnight - weeks * 7 * 24 * 60 * 60 * 1000;
  const start = new Date(startJakartaMidnight - 7 * 60 * 60 * 1000);
  const end = new Date(endJakartaMidnight - 7 * 60 * 60 * 1000);

  const txs = await prisma.transaction.findMany({
    where: { businessId, status: TransactionStatus.completed, completedAt: { gte: start, lt: end } },
    select: { completedAt: true },
  });

  const countByHour = new Array(24).fill(0);
  for (const tx of txs) {
    if (!tx.completedAt) continue;
    const jakarta = toJakartaWallClock(tx.completedAt);
    countByHour[jakarta.getUTCHours()]++;
  }

  const data = countByHour.map((count, hour) => ({ hour, totalTransactions: count }));

  let busiestHour = data[0];
  for (const r of data) if (r.totalTransactions > busiestHour.totalTransactions) busiestHour = r;

  return { weeksAnalyzed: weeks, startDate: start.toISOString(), endDate: end.toISOString(), data, busiestHour: { hour: busiestHour.hour, totalTransactions: busiestHour.totalTransactions } };
}

/**
 * Prediksi menu terlaris besok — BUKAN AI/machine learning, murni rata-rata historis
 * per hari-dalam-minggu yang sama (kalau besok Senin, lihat rata-rata qty terjual tiap
 * menu di Senin-Senin sebelumnya dari N minggu terakhir). Breakdown per-menu dari
 * pendekatan yang sama dengan getVisitPatternByDay (yang cuma total transaksi).
 */
export async function predictTopMenuTomorrow(businessId: string, weeks = 4) {
  const now = new Date();
  const nowJakarta = toJakartaWallClock(now);
  // "Besok 00:00 Jakarta" dipakai ganda: batas akhir (exclusive) window lookback,
  // sekaligus titik acuan buat tahu besok jatuh di hari-dalam-minggu apa.
  const tomorrowJakartaMidnight = Date.UTC(nowJakarta.getUTCFullYear(), nowJakarta.getUTCMonth(), nowJakarta.getUTCDate() + 1);
  const startJakartaMidnight = tomorrowJakartaMidnight - weeks * 7 * 24 * 60 * 60 * 1000;
  const start = new Date(startJakartaMidnight - 7 * 60 * 60 * 1000);
  const end = new Date(tomorrowJakartaMidnight - 7 * 60 * 60 * 1000);

  const tomorrowDate = new Date(tomorrowJakartaMidnight);
  const targetDayIdx = (tomorrowDate.getUTCDay() + 6) % 7; // 0 = Senin ... 6 = Minggu
  const targetDayName = DAY_NAMES[targetDayIdx];
  const targetDate = `${tomorrowDate.getUTCFullYear()}-${String(tomorrowDate.getUTCMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getUTCDate()).padStart(2, '0')}`;

  const txs = await prisma.transaction.findMany({
    where: { businessId, status: TransactionStatus.completed, completedAt: { gte: start, lt: end } },
    select: { completedAt: true, items: { select: { menuId: true, menuName: true, qty: true } } },
  });

  const matchingDates = new Set<string>(); // tanggal unik (Jakarta) yang jatuh di hari-dalam-minggu sama dgn besok
  const qtyByMenu: Record<string, { menuName: string; qty: number }> = {};

  for (const tx of txs) {
    if (!tx.completedAt) continue;
    const jakarta = toJakartaWallClock(tx.completedAt);
    const idx = (jakarta.getUTCDay() + 6) % 7;
    if (idx !== targetDayIdx) continue;

    matchingDates.add(`${jakarta.getUTCFullYear()}-${jakarta.getUTCMonth()}-${jakarta.getUTCDate()}`);
    for (const item of tx.items) {
      if (!qtyByMenu[item.menuId]) qtyByMenu[item.menuId] = { menuName: item.menuName, qty: 0 };
      qtyByMenu[item.menuId].qty += item.qty;
    }
  }

  const occurrencesFound = matchingDates.size;
  let topMenu: { id: string; name: string; avgQtySold: number } | null = null;
  for (const [menuId, d] of Object.entries(qtyByMenu)) {
    const avgQtySold = occurrencesFound > 0 ? Math.round((d.qty / occurrencesFound) * 100) / 100 : 0;
    if (!topMenu || avgQtySold > topMenu.avgQtySold) {
      topMenu = { id: menuId, name: d.menuName, avgQtySold };
    }
  }

  return { weeksAnalyzed: weeks, targetDate, targetDayName, occurrencesFound, topMenu };
}

/**
 * Rekomendasi bundling menu berdasarkan analisis co-occurrence — pasangan menu
 * (di luar kategori "Paket", karena tujuannya justru menyarankan Paket BARU) yang
 * paling sering muncul BERSAMA dalam transaksi yang sama. Dipilih dibanding pendekatan
 * "top-N menu terlaris lalu dibundling begitu saja" karena co-occurrence merefleksikan
 * pola beli aktual pelanggan ("yang beli X juga sering beli Y"), bukan cuma menu populer
 * yang belum tentu sering dibeli bersamaan — insight yang lebih actionable dengan
 * kompleksitas implementasi yang setara (agregasi in-memory, pola yang sama dengan
 * fungsi lain di file ini).
 *
 * Window 8 minggu (lebih panjang dari insight harian/mingguan lain yang pakai 4 minggu)
 * karena keputusan bikin menu Paket baru itu strategis/jangka menengah, bukan taktis
 * harian — butuh sinyal pasangan co-occurrence yang lebih stabil secara statistik.
 */
export async function getMenuBundleRecommendation(businessId: string, weeks = 8) {
  const now = new Date();
  const nowJakarta = toJakartaWallClock(now);
  const endJakartaMidnight = Date.UTC(nowJakarta.getUTCFullYear(), nowJakarta.getUTCMonth(), nowJakarta.getUTCDate() + 1);
  const startJakartaMidnight = endJakartaMidnight - weeks * 7 * 24 * 60 * 60 * 1000;
  const start = new Date(startJakartaMidnight - 7 * 60 * 60 * 1000);
  const end = new Date(endJakartaMidnight - 7 * 60 * 60 * 1000);

  const txs = await prisma.transaction.findMany({
    where: { businessId, status: TransactionStatus.completed, completedAt: { gte: start, lt: end } },
    select: {
      items: {
        select: {
          menuId: true,
          menu: { select: { name: true, category: true, sellingPrice: true, hpp: true } },
        },
      },
    },
  });

  const pairCounts = new Map<string, number>();
  const menuInfo = new Map<string, { name: string; sellingPrice: number; hpp: number }>();
  let transactionsAnalyzed = 0;

  for (const tx of txs) {
    // Kandidat bundling cuma menu NON-Paket — bundling dua Paket yang sudah ada,
    // atau Paket dengan item lain, bukan "ekspansi menu baru" yang dimaksud di sini.
    const distinctMenuIds = new Map<string, { name: string; sellingPrice: number; hpp: number }>();
    for (const item of tx.items) {
      if (!item.menu || item.menu.category === 'Paket') continue;
      if (!distinctMenuIds.has(item.menuId)) {
        distinctMenuIds.set(item.menuId, {
          name: item.menu.name,
          sellingPrice: Number(item.menu.sellingPrice),
          hpp: Number(item.menu.hpp),
        });
      }
    }
    for (const [id, info] of distinctMenuIds) menuInfo.set(id, info);

    const ids = Array.from(distinctMenuIds.keys());
    if (ids.length < 2) continue;
    transactionsAnalyzed++;

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = [ids[i], ids[j]].sort().join('|');
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      }
    }
  }

  if (pairCounts.size === 0) {
    return { weeksAnalyzed: weeks, transactionsAnalyzed, recommendation: null, allOpportunitiesBundled: false };
  }

  // Cek pasangan mana yang SUDAH pernah dibundling jadi menu Paket, supaya tidak terus
  // menyarankan pasangan yang sama berulang-ulang setelah Owner benar-benar membuatnya
  // (via tombol "Atur Resep"). Deteksi berbasis RESEP, bukan nama menu — nama menu bisa
  // diubah Owner saat review sebelum simpan (form-nya memang sengaja tetap bisa diedit),
  // sedangkan tombol "Atur Resep" selalu menyusun resep Paket baru sebagai UNION resep
  // kedua menu asal. Jadi pasangan dianggap "sudah dibundling" kalau ada menu Paket yang
  // resepnya superset dari union resep kedua menu kandidat.
  const candidateMenuIds = new Set<string>();
  for (const key of pairCounts.keys()) {
    const [a, b] = key.split('|');
    candidateMenuIds.add(a);
    candidateMenuIds.add(b);
  }

  const [paketMenus, candidateRecipes] = await Promise.all([
    prisma.menu.findMany({
      where: { businessId, category: 'Paket' },
      select: { recipes: { select: { ingredientId: true } } },
    }),
    prisma.recipeItem.findMany({
      where: { businessId, menuId: { in: Array.from(candidateMenuIds) } },
      select: { menuId: true, ingredientId: true },
    }),
  ]);

  const paketIngredientSets = paketMenus.map((m) => new Set(m.recipes.map((r) => r.ingredientId)));

  const recipeSetByMenu = new Map<string, Set<string>>();
  for (const r of candidateRecipes) {
    if (!recipeSetByMenu.has(r.menuId)) recipeSetByMenu.set(r.menuId, new Set());
    recipeSetByMenu.get(r.menuId)!.add(r.ingredientId);
  }

  function isAlreadyBundled(menuIdA: string, menuIdB: string): boolean {
    const union = new Set([...(recipeSetByMenu.get(menuIdA) || []), ...(recipeSetByMenu.get(menuIdB) || [])]);
    if (union.size === 0) return false; // menu tanpa resep tidak bisa dicek — anggap belum dibundling
    return paketIngredientSets.some((paketSet) => {
      for (const ingredientId of union) if (!paketSet.has(ingredientId)) return false;
      return true;
    });
  }

  // Urutkan SEMUA pasangan berdasarkan co-occurrence menurun, lalu ambil yang pertama
  // yang belum pernah dibundling — bukan cuma pasangan #1 seperti sebelumnya.
  const sortedPairs = Array.from(pairCounts.entries()).sort((a, b) => b[1] - a[1]);
  let bestPairKey: string | null = null;
  let bestCount = 0;
  for (const [key, count] of sortedPairs) {
    const [a, b] = key.split('|');
    if (!isAlreadyBundled(a, b)) {
      bestPairKey = key;
      bestCount = count;
      break;
    }
  }

  if (!bestPairKey || bestCount === 0) {
    // Semua pasangan dengan co-occurrence signifikan sudah pernah dibundling — bukan
    // "kurang data", tapi justru sinyal positif (semua peluang utama sudah dimanfaatkan).
    return { weeksAnalyzed: weeks, transactionsAnalyzed, recommendation: null, allOpportunitiesBundled: true };
  }

  const [idA, idB] = bestPairKey.split('|');
  const menuA = menuInfo.get(idA)!;
  const menuB = menuInfo.get(idB)!;

  const individualPriceSum = menuA.sellingPrice + menuB.sellingPrice;
  const combinedHpp = menuA.hpp + menuB.hpp;
  const discountPercent = 10;
  // Dibulatkan ke bawah ke kelipatan 500 terdekat supaya harga jual "enak dilihat"
  // (pola pembulatan harga yang sama seperti rekomendasi harga margin kritis, tapi
  // ke bawah karena ini diskon, bukan kenaikan harga).
  const rawBundlePrice = individualPriceSum * (1 - discountPercent / 100);
  const suggestedBundlePrice = Math.max(Math.floor(rawBundlePrice / 500) * 500, combinedHpp);
  const estimatedMargin = suggestedBundlePrice - combinedHpp;
  const estimatedMarginPercent = suggestedBundlePrice > 0 ? Math.round((estimatedMargin / suggestedBundlePrice) * 1000) / 10 : 0;

  return {
    weeksAnalyzed: weeks,
    transactionsAnalyzed,
    allOpportunitiesBundled: false,
    recommendation: {
      menus: [
        { id: idA, name: menuA.name, sellingPrice: menuA.sellingPrice, hpp: menuA.hpp },
        { id: idB, name: menuB.name, sellingPrice: menuB.sellingPrice, hpp: menuB.hpp },
      ],
      coOccurrenceCount: bestCount,
      coOccurrencePercent: transactionsAnalyzed > 0 ? Math.round((bestCount / transactionsAnalyzed) * 1000) / 10 : 0,
      individualPriceSum,
      discountPercent,
      suggestedBundlePrice,
      combinedHpp,
      estimatedMargin,
      estimatedMarginPercent,
    },
  };
}
