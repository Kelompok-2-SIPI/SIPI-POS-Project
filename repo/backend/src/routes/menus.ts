import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../lib/db';
import { getMenusWithAvailability, recalculateMenuHpp } from '../lib/inventory-helpers';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ── Upload gambar menu (disk storage, nama file unik, validasi tipe & ukuran) ──
const UPLOAD_DIR = path.join(__dirname, '../../uploads/menus');
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
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

router.get('/', async (_req: Request, res: Response) => {
  try {
    return res.json(await getMenusWithAvailability());
  } catch (e: any) { return res.status(500).json({ error: 'Gagal mengambil data menu.' }); }
});

router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { name, category, sellingPrice } = req.body;
    if (!name || !category || sellingPrice === undefined)
      return res.status(400).json({ error: 'Nama, kategori, dan harga jual wajib diisi.' });

    const imageUrl = req.file ? `/uploads/menus/${req.file.filename}` : undefined;

    const menu = await prisma.menu.create({
      data: {
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
        await prisma.recipeItem.create({ data: { menuId: menu.id, ingredientId: r.ingredientId, qtyUsed: Number(r.qtyUsed) } });
      }
    }
    const hpp = await recalculateMenuHpp(menu.id);
    return res.status(201).json({ success: true, menu: { ...menu, hpp } });
  } catch (e: any) { return res.status(500).json({ error: 'Gagal membuat menu baru.' }); }
});

router.put('/:id', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { name, category, sellingPrice } = req.body;
    if (!name || !category || sellingPrice === undefined)
      return res.status(400).json({ error: 'Nama, kategori, dan harga jual wajib diisi.' });

    const data: { name: string; category: string; sellingPrice: number; imageUrl?: string } = {
      name,
      category,
      sellingPrice: Number(sellingPrice),
    };
    // Kalau tidak ada file baru diupload, imageUrl lama TIDAK disentuh/dihapus.
    if (req.file) {
      data.imageUrl = `/uploads/menus/${req.file.filename}`;
    }

    const updated = await prisma.menu.update({ where: { id: req.params.id }, data });
    const hpp = await recalculateMenuHpp(req.params.id);
    return res.json({ success: true, menu: { ...updated, hpp } });
  } catch (e: any) { return res.status(500).json({ error: 'Gagal memperbarui menu.' }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.menu.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (e: any) { return res.status(500).json({ error: 'Gagal menghapus menu.' }); }
});

router.get('/:id/recipe', async (req: Request, res: Response) => {
  try {
    const recipes = await prisma.recipeItem.findMany({ where: { menuId: req.params.id }, include: { ingredient: true } });
    return res.json(recipes.map(r => ({ id: r.id, ingredientId: r.ingredientId, ingredientName: r.ingredient.name, unit: r.ingredient.unit, qtyUsed: Number(r.qtyUsed) })));
  } catch (e: any) { return res.status(500).json({ error: 'Gagal mengambil resep menu.' }); }
});

router.put('/:id/recipe', async (req: Request, res: Response) => {
  try {
    const { recipe } = req.body;
    if (!recipe || !Array.isArray(recipe)) return res.status(400).json({ error: 'Format resep salah.' });
    await prisma.$transaction(async (tx) => {
      await tx.recipeItem.deleteMany({ where: { menuId: req.params.id } });
      for (const item of recipe) {
        if (!item.ingredientId || item.qtyUsed === undefined || Number(item.qtyUsed) <= 0) continue;
        await tx.recipeItem.create({ data: { menuId: req.params.id, ingredientId: item.ingredientId, qtyUsed: Number(item.qtyUsed) } });
      }
    });
    const hpp = await recalculateMenuHpp(req.params.id);
    return res.json({ success: true, hpp });
  } catch (e: any) { return res.status(500).json({ error: 'Gagal memperbarui resep menu.' }); }
});

export default router;
