import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { verifyToken, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Protect the route with your JWT middleware
router.use(verifyToken);

// GET /api/dashboard 
// Allow all roles to hit the endpoint; the controller will filter the payload
router.get('/', requireRoles(['Admin', 'Secretary', 'Doctor']), getDashboardStats);

export default router;