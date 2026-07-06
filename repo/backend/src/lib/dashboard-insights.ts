import { prisma } from './db';
import { TransactionStatus } from '@prisma/client';

/**
 * Tren penjualan bulanan (N bulan terakhir, default 6).
 * Dipakai oleh grafik "Tren Penjualan Bulanan" di dashboard DAN konteks AI chatbot.
 */
export async function getMonthlySales(months = 6) {
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
      where: { status: TransactionStatus.completed, completedAt: { gte: start, lte: end } },
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

// Geser instant UTC transaksi ke "jam dinding" Asia/Jakarta (UTC+7), dibaca lewat getUTC*
function toJakartaWallClock(date: Date): Date {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000);
}

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

/**
 * Pola kunjungan per hari (Senin-Minggu), rata-rata dari N minggu terakhir (default 4)
 * — proxy pakai jumlah transaksi selesai. Dipakai oleh card "Pola Pengunjung Mingguan"
 * di dashboard DAN konteks AI chatbot.
 */
export async function getVisitPatternByDay(weeks = 4) {
  const now = new Date();
  const nowJakarta = toJakartaWallClock(now);
  // Akhir periode: akhir hari ini (waktu Jakarta), awal: N*7 hari sebelumnya jam 00:00 Jakarta
  const endJakartaMidnight = Date.UTC(nowJakarta.getUTCFullYear(), nowJakarta.getUTCMonth(), nowJakarta.getUTCDate() + 1); // esok 00:00 Jakarta (exclusive)
  const startJakartaMidnight = endJakartaMidnight - weeks * 7 * 24 * 60 * 60 * 1000;
  const start = new Date(startJakartaMidnight - 7 * 60 * 60 * 1000); // balik ke UTC instant
  const end = new Date(endJakartaMidnight - 7 * 60 * 60 * 1000);

  const txs = await prisma.transaction.findMany({
    where: { status: TransactionStatus.completed, completedAt: { gte: start, lt: end } },
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
export async function getVisitPatternByHour(weeks = 4) {
  const now = new Date();
  const nowJakarta = toJakartaWallClock(now);
  const endJakartaMidnight = Date.UTC(nowJakarta.getUTCFullYear(), nowJakarta.getUTCMonth(), nowJakarta.getUTCDate() + 1);
  const startJakartaMidnight = endJakartaMidnight - weeks * 7 * 24 * 60 * 60 * 1000;
  const start = new Date(startJakartaMidnight - 7 * 60 * 60 * 1000);
  const end = new Date(endJakartaMidnight - 7 * 60 * 60 * 1000);

  const txs = await prisma.transaction.findMany({
    where: { status: TransactionStatus.completed, completedAt: { gte: start, lt: end } },
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
