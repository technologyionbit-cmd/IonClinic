import { Router } from 'express';
import multer from 'multer';
import { 
  getSettings, 
  updateSetting, 
  importDatabase, 
  clearDatabase 
} from '../controllers/settings.controller.js';
import { verifyToken, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);

router.get('/', requireRoles(['Admin', 'Secretary', 'Doctor']), getSettings);
router.post('/', requireRoles(['Admin']), updateSetting); 

// New Endpoints
router.post('/import', requireRoles(['Admin']), upload.single('file'), importDatabase);
router.post('/clear', requireRoles(['Admin']), clearDatabase);

export default router;