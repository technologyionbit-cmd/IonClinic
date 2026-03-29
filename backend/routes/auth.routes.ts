import { Router } from 'express';
import { verifyToken, requireRoles } from '../middleware/auth.middleware.js';
// Import your existing auth functions, plus the new one
import { login, adminChangeUserPassword } from '../controllers/auth.controller.js'; 

const router = Router();

// Existing login route
router.post('/login', login);

// --- NEW: Locked Admin Route to change passwords ---
router.put(
  '/change-password', 
  verifyToken, 
  requireRoles(['Admin']), // THIS is what protects the route!
  adminChangeUserPassword
);

export default router;