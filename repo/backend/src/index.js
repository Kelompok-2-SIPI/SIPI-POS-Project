require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────────────────────
const menuRouter = require('./routes/menus');
const ingredientRouter = require('./routes/ingredients');
const transactionRouter = require('./routes/transactions');
const dashboardRouter = require('./routes/dashboard');
const authRouter = require('./routes/auth');

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/menus', menuRouter);
app.use('/api/v1/ingredients', ingredientRouter);
app.use('/api/v1/transactions', transactionRouter);
app.use('/api/v1/dashboard', dashboardRouter);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[SIPI Backend] Berjalan di http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = { app, prisma };
