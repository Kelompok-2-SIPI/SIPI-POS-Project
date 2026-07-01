import { Router } from 'express';
import { handleChat, confirmAction } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.post('/chat', authenticate, handleChat);
router.post('/confirm-action', authenticate, confirmAction);

export default router;
