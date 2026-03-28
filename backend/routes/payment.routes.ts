import { Router } from 'express';
import { addPayment, getPatientPayments, deletePayment } from '../controllers/payment.controller.js';
import { verifyToken, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Apply auth middleware
router.use(verifyToken);

// POST /api/payments -> Record a new payment
router.post('/', requireRoles(['Admin', 'Secretary']), addPayment);

// GET /api/payments/patient/:patientId -> Get history for one patient
router.get('/patient/:patientId', requireRoles(['Admin', 'Secretary']), getPatientPayments);

// DELETE /api/payments/:id -> Soft delete a payment and revert balance
router.delete('/:id', requireRoles(['Admin', 'Secretary']), deletePayment);

export default router;