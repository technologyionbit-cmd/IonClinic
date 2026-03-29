import { Router } from 'express';
import { createBackup } from '../controllers/backup.controller.js';
import { verifyToken, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Only Admin can trigger a manual backup
router.post('/', verifyToken, requireRoles(['Admin']), createBackup);

export default router;