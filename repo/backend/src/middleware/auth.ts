import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/env';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    businessId: string;
  };
  businessId?: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak disediakan atau format salah.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string; businessId: string };
    (req as AuthRequest).user = decoded;
    // businessId HARUS selalu berasal dari token JWT terverifikasi, bukan dari
    // req.body/req.params/req.query manapun yang bisa dipalsukan client.
    (req as AuthRequest).businessId = decoded.businessId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa.' });
  }
}
