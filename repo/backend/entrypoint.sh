#!/bin/sh
set -e

echo "[SIPI] Menjalankan migrasi database..."
npx prisma migrate deploy

echo "[SIPI] Seeding data awal (jika belum ada)..."
npx prisma db seed

echo "[SIPI] Memulai server backend..."
exec "$@"
