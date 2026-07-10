import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/db';
import { JWT_SECRET } from '../lib/env';
import { authenticate, AuthRequest } from '../middleware/auth';

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
      { id: user.id, role: user.role, businessId: user.businessId },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({ success: true, token, user: { id: user.id, name: user.name, role: user.role, businessId: user.businessId } });
  } catch (err: any) {
    return res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, password, businessName } = req.body;
    if (!name || !password || !businessName) {
      return res.status(400).json({ error: 'Nama, password, dan nama usaha harus diisi.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter.' });
    }

    // `name` dipakai sebagai identitas login (lihat POST /login: dicari via findFirst
    // tanpa scoping business), jadi harus unik secara global lintas semua tenant —
    // bukan cuma unik dalam satu business — supaya login tidak ambigu.
    const existingUser = await prisma.user.findFirst({ where: { name } });
    if (existingUser) return res.status(409).json({ error: 'Nama pengguna sudah digunakan.' });

    const passwordHash = await bcrypt.hash(password, 10);

    // Bisnis baru mulai kosong total (tanpa menu/bahan baku dummy) — ini disengaja,
    // beda dengan akun demo "Ayam Geprek Bu Yuli" yang datanya historis.
    const { business, user } = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({ data: { name: businessName } });
      const user = await tx.user.create({
        data: { businessId: business.id, name, passwordHash, role: 'owner' },
      });
      return { business, user };
    });

    const token = jwt.sign(
      { id: user.id, role: user.role, businessId: business.id },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, role: user.role, businessId: business.id },
      business: { id: business.id, name: business.name },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true });
});

// Info user + nama bisnis tenant yang sedang login — dipakai halaman Akun untuk
// menampilkan nama usaha (GET /login lama cuma mengembalikan businessId, bukan nama).
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user!.id, businessId: req.businessId! },
      include: { business: { select: { id: true, name: true } } },
    });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });

    return res.json({
      user: { id: user.id, name: user.name, role: user.role },
      business: { id: user.business.id, name: user.business.name },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengambil info akun.' });
  }
});

export default router;
