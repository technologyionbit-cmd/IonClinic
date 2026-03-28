import type { Request, Response } from 'express';
import db from '../database.js';

export const addPayment = (req: Request, res: Response) => {
  const { patient_id, amount, payment_method } = req.body;

  try {
    const processPayment = db.transaction(() => {
      const insertStmt = db.prepare(`
        INSERT INTO payments (patient_id, amount, payment_method)
        VALUES (?, ?, ?)
      `);
      const info = insertStmt.run(patient_id, amount, payment_method || 'Cash');

      const updateStmt = db.prepare(`
        UPDATE patients 
        SET remaining_amount = remaining_amount - ? 
        WHERE id = ?
      `);
      updateStmt.run(amount, patient_id);

      return info.lastInsertRowid;
    });

    const paymentId = processPayment();
    res.status(201).json({ message: 'Payment recorded successfully', id: paymentId });
  } catch (error) {
    console.error('Payment Error:', error);
    res.status(500).json({ message: 'Error recording payment' });
  }
};

export const getPatientPayments = (req: Request, res: Response) => {
  const { patientId } = req.params;

  try {
    const stmt = db.prepare('SELECT * FROM payments WHERE patient_id = ? ORDER BY payment_date DESC');
    const payments = stmt.all(patientId);
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching payment history' });
  }
};

export const deletePayment = (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deleteTransaction = db.transaction(() => {
      const getPaymentStmt = db.prepare('SELECT amount, patient_id FROM payments WHERE id = ?');
      const payment = getPaymentStmt.get(id) as any;

      if (!payment) return null;

      const deleteStmt = db.prepare('DELETE FROM payments WHERE id = ?');
      deleteStmt.run(id);

      const updatePatientStmt = db.prepare(`
        UPDATE patients 
        SET remaining_amount = remaining_amount + ? 
        WHERE id = ?
      `);
      updatePatientStmt.run(payment.amount, payment.patient_id);

      return true;
    });

    const success = deleteTransaction();

    if (!success) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({ message: 'Payment deleted and patient balance reverted' });
  } catch (error) {
    console.error('Delete Payment Error:', error);
    res.status(500).json({ message: 'Error deleting payment' });
  }
};