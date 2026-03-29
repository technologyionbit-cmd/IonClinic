import { Router } from 'express';
import { getWhatsAppStatus, sendMessage } from '../controllers/whatsapp.controller.js';
import { verifyToken, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Apply auth middleware
router.use(verifyToken);

// GET /api/whatsapp/status (For the QR code and connection state)
router.get('/status', requireRoles(['Admin', 'Secretary']), getWhatsAppStatus);

// POST /api/whatsapp/send (For the React frontend to trigger messages)
router.post('/send', requireRoles(['Admin', 'Secretary']), sendMessage);

export default router;