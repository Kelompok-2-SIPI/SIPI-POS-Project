// Validasi environment variable kritis saat startup — fail-fast, bukan diam-diam
// pakai fallback yang bisa jadi celah keamanan (misal JWT_SECRET default yang bisa
// ditebak siapa saja) kalau env var lupa di-set saat deploy.

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    // eslint-disable-next-line no-console
    console.error(`[FATAL] Environment variable ${name} wajib di-set dan tidak boleh kosong. Cek file .env (lihat .env.example).`);
    process.exit(1);
  }
  return value;
}

export const JWT_SECRET = requireEnv('JWT_SECRET');
