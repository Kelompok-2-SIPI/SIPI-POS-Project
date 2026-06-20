import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import menusRouter from './routes/menus';
import ingredientsRouter from './routes/ingredients';
import transactionsRouter from './routes/transactions';
import dashboardRouter from './routes/dashboard';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/menus', menusRouter);
app.use('/api/v1/ingredients', ingredientsRouter);
app.use('/api/v1/transactions', transactionsRouter);
app.use('/api/v1/dashboard', dashboardRouter);

app.use((_req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan' }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`[SIPI Backend] http://localhost:${PORT}`));
