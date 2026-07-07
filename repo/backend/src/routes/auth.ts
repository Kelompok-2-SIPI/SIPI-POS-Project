import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/db';
import { JWT_SECRET } from '../lib/env';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: 'Nama dan password harus diisi.' });
    }
    const user = await prisma.user.findFirst({ where: { name } });
    if (!user) return res.status(401).json({ error: 'User tidak ditemukan.' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: 'Password salah.' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({ success: true, token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err: any) {
    return res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true });
});

export default router;
