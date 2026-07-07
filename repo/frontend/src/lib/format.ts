// Satuan hitungan diskrit (tidak bisa pecahan secara fisik) — beda dengan satuan
// berat/volume (gram, ml, kg, liter) yang wajar tampil desimal. Tidak ada kategorisasi
// ini di skema database (kolom `unit` cuma VarChar bebas), jadi daftar ini jadi
// satu-satunya sumber kebenaran dan harus disinkronkan manual kalau ada satuan baru.
const DISCRETE_UNITS = new Set(['potong', 'pcs', 'butir', 'buah', 'lembar', 'ekor', 'biji']);

export function isDiscreteUnit(unit: string): boolean {
  return DISCRETE_UNITS.has(unit.trim().toLowerCase());
}

// Bulatkan kuantitas stok untuk satuan diskrit (mis. "147.64 potong" -> "148 potong").
// Satuan berat/volume dibiarkan apa adanya (desimal memang valid di sana).
export function formatStockQty(qty: number, unit: string): number {
  return isDiscreteUnit(unit) ? Math.round(qty) : qty;
}
