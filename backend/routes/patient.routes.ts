import { Router } from 'express';
import { 
  createPatient, 
  getAllPatients, 
  getPatientById, 
  updatePatient, 
  deletePatient,
  getPatientHistory
} from '../controllers/patient.controller.js';
import { verifyToken, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken);

// NEW: Endpoint to get the medical timeline (Notes + Medications)
router.get('/:id/history', requireRoles(['Admin', 'Doctor']), getPatientHistory);

router.post('/', requireRoles(['Admin', 'Secretary']), createPatient);
router.get('/', requireRoles(['Admin', 'Secretary', 'Doctor']), getAllPatients);
router.get('/:id', requireRoles(['Admin', 'Secretary', 'Doctor']), getPatientById); 
router.put('/:id', requireRoles(['Admin', 'Secretary']), updatePatient);    
router.delete('/:id', requireRoles(['Admin', 'Secretary']), deletePatient); 

export default router;