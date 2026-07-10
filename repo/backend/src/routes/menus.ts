import { Router, Response } from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { getMenusWithAvailability, recalculateMenuHpp } from '../lib/inventory-helpers';
import { authenticate, AuthRequest } from '../middleware/auth';
import cloudinary from '../lib/cloudinary';

const router = Router();
router.use(authenticate);

// ── Upload gambar menu (Cloudinary — disk lokal di platform deploy seperti Railway
// bersifat ephemeral, file hilang setiap redeploy) ──
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'sipi-pos/menus',
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new Error('Format gambar tidak didukung. Gunakan JPEG, PNG, atau WebP.'));
      return;
    }
    cb(null, true);
  },
});

// Menerima `recipe` sebagai JSON string (multipart/form-data) maupun array (JSON body biasa)
function parseRecipeField(raw: any): any[] | null {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    return res.json(await getMenusWithAvailability(req.businessId!, includeInactive));
  } catch (e: any) { return res.status(500).json({ error: 'Gagal mengambil data menu.' }); }
});

router.post('/', upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { name, category, sellingPrice } = req.body;
    if (!name || !category || sellingPrice === undefined)
      return res.status(400).json({ error: 'Nama, kategori, dan harga jual wajib diisi.' });

    // req.file.path berisi secure_url penuh dari Cloudinary (bukan path lokal lagi).
    const imageUrl = req.file ? req.file.path : undefined;

    const menu = await prisma.menu.create({
      data: {
        businessId,
        name,
        category,
        sellingPrice: Number(sellingPrice),
        hpp: 0,
        ...(imageUrl ? { imageUrl } : {}),
      },
    });

    const recipe = parseRecipeField(req.body.recipe);
    if (recipe) {
      for (const r of recipe) {
        if (!r.ingredientId || !r.qtyUsed) continue;
        // ingredientId datang dari client — verifikasi dulu bahan baku itu benar milik
        // business ini sebelum dipakai, supaya tidak bisa mereferensikan bahan baku tenant lain.
        const ownedIngredient = await prisma.ingredient.findFirst({ where: { id: r.ingredientId, businessId } });
        if (!ownedIngredient) continue;
        await prisma.recipeItem.create({ data: { businessId, menuId: menu.id, ingredientId: r.ingredientId, qtyUsed: Number(r.qtyUsed) } });
      }
    }
    const hpp = await recalculateMenuHpp(menu.id, businessId);
    return res.status(201).json({ success: true, menu: { ...menu, hpp } });
  } catch (e: any) { return res.status(500).json({ error: 'Gagal membuat menu baru.' }); }
});

router.put('/:id', upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { name, category, sellingPrice } = req.body;
    if (!name || !category || sellingPrice === undefined)
      return res.status(400).json({ error: 'Nama, kategori, dan harga jual wajib diisi.' });

    const existing = await prisma.menu.findFirst({ where: { id: req.params.id, businessId } });
    if (!existing) return res.status(404).json({ error: 'Menu tidak ditemukan.' });

    const data: { name: string; category: string; sellingPrice: number; imageUrl?: string } = {
      name,
      category,
      sellingPrice: Number(sellingPrice),
    };
    // Kalau tidak ada file baru diupload, imageUrl lama TIDAK disentuh/dihapus.
    if (req.file) {
      data.imageUrl = req.file.path;
    }

    const updated = await prisma.menu.update({ where: { id: req.params.id }, data });
    const hpp = await recalculateMenuHpp(req.params.id, businessId);
    return res.json({ success: true, menu: { ...updated, hpp } });
  } catch (e: any) { return res.status(500).json({ error: 'Gagal memperbarui menu.' }); }
});

router.put('/:id/active', async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean')
      return res.status(400).json({ error: 'Field isActive harus bernilai boolean.' });

    const existing = await prisma.menu.findFirst({ where: { id: req.params.id, businessId } });
    if (!existing) return res.status(404).json({ error: 'Menu tidak ditemukan.' });

    const updated = await prisma.menu.update({ where: { id: req.params.id }, data: { isActive } });
    return res.json({ success: true, menu: { ...updated, hpp: Number(updated.hpp), sellingPrice: Number(updated.sellingPrice) } });
  } catch (e: any) {
    console.error('PUT /menus/:id/active error:', e);
    return res.status(500).json({ error: 'Gagal mengubah status aktif menu.' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const existing = await prisma.menu.findFirst({ where: { id: req.params.id, businessId } });
    if (!existing) return res.status(404).json({ error: 'Menu tidak ditemukan.' });
    await prisma.menu.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (e: any) {
    // Menu sudah pernah dipakai di transaksi historis (transaction_items tidak cascade
    // saat menu dihapus, supaya riwayat transaksi & HPP historis tidak rusak).
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
      return res.status(409).json({
        error: 'Menu ini tidak bisa dihapus karena sudah memiliki riwayat transaksi. Nonaktifkan menu ini alih-alih menghapusnya.',
      });
    }
    console.error('DELETE /menus/:id error:', e);
    return res.status(500).json({ error: 'Gagal menghapus menu.' });
  }
});

router.get('/:id/recipe', async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const menu = await prisma.menu.findFirst({ where: { id: req.params.id, businessId } });
    if (!menu) return res.status(404).json({ error: 'Menu tidak ditemukan.' });
    const recipes = await prisma.recipeItem.findMany({ where: { menuId: req.params.id, businessId }, include: { ingredient: true } });
    return res.json(recipes.map(r => ({ id: r.id, ingredientId: r.ingredientId, ingredientName: r.ingredient.name, unit: r.ingredient.unit, qtyUsed: Number(r.qtyUsed) })));
  } catch (e: any) { return res.status(500).json({ error: 'Gagal mengambil resep menu.' }); }
});

router.put('/:id/recipe', async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { recipe } = req.body;
    if (!recipe || !Array.isArray(recipe)) return res.status(400).json({ error: 'Format resep salah.' });

    const menu = await prisma.menu.findFirst({ where: { id: req.params.id, businessId } });
    if (!menu) return res.status(404).json({ error: 'Menu tidak ditemukan.' });

    await prisma.$transaction(async (tx) => {
      await tx.recipeItem.deleteMany({ where: { menuId: req.params.id, businessId } });
      for (const item of recipe) {
        if (!item.ingredientId || item.qtyUsed === undefined || Number(item.qtyUsed) <= 0) continue;
        // ingredientId datang dari client — verifikasi dulu bahan baku itu benar milik
        // business ini sebelum dipakai, supaya tidak bisa mereferensikan bahan baku tenant lain.
        const ownedIngredient = await tx.ingredient.findFirst({ where: { id: item.ingredientId, businessId } });
        if (!ownedIngredient) continue;
        await tx.recipeItem.create({ data: { businessId, menuId: req.params.id, ingredientId: item.ingredientId, qtyUsed: Number(item.qtyUsed) } });
      }
    });
    const hpp = await recalculateMenuHpp(req.params.id, businessId);
    return res.json({ success: true, hpp });
  } catch (e: any) { return res.status(500).json({ error: 'Gagal memperbarui resep menu.' }); }
});

export default router;
