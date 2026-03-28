import { Router } from 'express';
import { 
  createAppointment, 
  getAppointments, 
  updateAppointment, 
  deleteAppointment,
  getDailyStats,
  addMedicalRecord
} from '../controllers/appointment.controller.js';
import { verifyToken, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/stats', requireRoles(['Admin', 'Secretary', 'Doctor']), getDailyStats); 

router.post('/', requireRoles(['Admin', 'Doctor', 'Secretary']), createAppointment);
router.get('/', requireRoles(['Admin', 'Secretary', 'Doctor']), getAppointments); 
router.put('/:id', requireRoles(['Admin', 'Secretary']), updateAppointment);
router.delete('/:id', requireRoles(['Admin', 'Secretary']), deleteAppointment);

// NEW: Endpoint for Doctor to log notes and materials during an appointment session
router.put('/:id/record', requireRoles(['Admin', 'Doctor']), addMedicalRecord);

export default router;