const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: 'name dan password wajib diisi' });
    }

    const user = await prisma.user.findFirst({ where: { name } });
    if (!user) return res.status(401).json({ error: 'Kredensial tidak valid' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Kredensial tidak valid' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout berhasil' });
});

module.exports = router;
