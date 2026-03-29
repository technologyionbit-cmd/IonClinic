import type { Response } from 'express';
import db from '../database.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const getDashboardStats = (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role; 

    const appointmentsToday = (db.prepare(`
      SELECT COUNT(*) as count FROM appointments 
      WHERE date(appointment_datetime) = date('now', 'localtime') 
      AND status != 'Cancelled'
    `).get() as any).count;

    const totalPatients = (db.prepare(`SELECT COUNT(*) as count FROM patients`).get() as any).count;

    const lowStockItems = db.prepare(`
      SELECT name, current_quantity, alert_threshold_percent 
      FROM inventory_items 
      WHERE (CAST(current_quantity AS FLOAT) / initial_quantity) * 100 <= alert_threshold_percent
    `).all();

    let responseData: any = {
      appointments_today: appointmentsToday,
      total_patients: totalPatients,
      low_stock_alerts: lowStockItems
    };

    if (userRole === 'Admin' || userRole === 'Secretary') {
      const incomeToday = (db.prepare(`
        SELECT SUM(amount) as total FROM payments 
        WHERE date(payment_date) = date('now', 'localtime')
      `).get() as any).total || 0;

      const totalDebts = (db.prepare(`SELECT SUM(remaining_amount) as total FROM patients`).get() as any).total || 0;
      
      responseData.income_today = incomeToday;
      responseData.total_debts = totalDebts;
    }

    if (userRole === 'Admin') {
      const profitToday = (db.prepare(`
        SELECT SUM(profit_generated) as total FROM material_usage 
        WHERE date(usage_date) = date('now', 'localtime')
      `).get() as any).total || 0;

      responseData.profit_today = profitToday;
    }

    res.json(responseData);
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
};