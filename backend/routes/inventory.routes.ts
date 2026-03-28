import { Router } from 'express';
import { 
  addInventoryItem, 
  consumeMaterial, 
  getInventoryStatus,
  updateInventoryItem, 
  deleteInventoryItem  
} from '../controllers/inventory.controller.js';
import { verifyToken, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken);

// Admin only operations (Add, Update pricing/restock, Delete)
router.post('/', requireRoles(['Admin']), addInventoryItem);
router.put('/:id', requireRoles(['Admin']), updateInventoryItem);
router.delete('/:id', requireRoles(['Admin']), deleteInventoryItem);

// Doctor & Admin operations (Confirm material deduction)
router.post('/consume', requireRoles(['Admin', 'Doctor']), consumeMaterial);

// Read-only access for everyone (Secretary needs to see stock to warn the doctor)
router.get('/', requireRoles(['Admin', 'Doctor', 'Secretary']), getInventoryStatus);

export default router;