import type { Request, Response } from 'express';
import db from '../database.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const addInventoryItem = (req: Request, res: Response) => {
  const { name, initial_quantity, cost_price, usage_price, alert_threshold_percent } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO inventory_items (name, initial_quantity, current_quantity, cost_price, usage_price, alert_threshold_percent)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(name, initial_quantity, initial_quantity, cost_price, usage_price, alert_threshold_percent || 20);
    res.status(201).json({ message: 'Item added', id: info.lastInsertRowid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding inventory item' });
  }
};

export const consumeMaterial = (req: AuthRequest, res: Response) => {
  const { inventory_id, patient_id, appointment_id, quantity_used } = req.body;
  const doctor_id = req.user?.id;

  // STRICT RULE ENFORCEMENT: Must have a patient and an appointment
  if (!patient_id || !appointment_id) {
    return res.status(400).json({ message: 'Cannot take from inventory without an active appointment and patient context.' });
  }

  if (quantity_used <= 0) {
    return res.status(400).json({ message: 'Quantity must be greater than zero.' });
  }

  try {
    const processConsumption = db.transaction(() => {
      const checkStmt = db.prepare('SELECT current_quantity, cost_price, usage_price FROM inventory_items WHERE id = ?');
      const item = checkStmt.get(inventory_id) as any;

      if (!item) throw new Error('Item not found');
      if (item.current_quantity < quantity_used) throw new Error('Insufficient stock');

      const profitGenerated = (item.usage_price - item.cost_price) * quantity_used;

      const updateStmt = db.prepare('UPDATE inventory_items SET current_quantity = current_quantity - ? WHERE id = ?');
      updateStmt.run(quantity_used, inventory_id);

      // Log now requires appointment_id
      const logStmt = db.prepare(`
        INSERT INTO material_usage (inventory_id, patient_id, appointment_id, doctor_id, quantity_used, profit_generated)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      logStmt.run(inventory_id, patient_id, appointment_id, doctor_id, quantity_used, profitGenerated);

      return { profitGenerated, newStock: item.current_quantity - quantity_used };
    });

    const result = processConsumption();
    res.json({ message: 'Material consumed successfully', data: result });

  } catch (error: any) {
    console.error('Consumption Error:', error.message);
    if (error.message === 'Insufficient stock' || error.message === 'Item not found') {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error processing material consumption' });
  }
};

export const getInventoryStatus = (req: Request, res: Response) => {
  try {
    const stmt = db.prepare(`
      SELECT *, 
        CASE 
          WHEN (CAST(current_quantity AS FLOAT) / initial_quantity) * 100 <= alert_threshold_percent THEN 1 
          ELSE 0 
        END as is_low_stock
      FROM inventory_items
    `);
    const items = stmt.all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory' });
  }
};

export const updateInventoryItem = (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, cost_price, usage_price, alert_threshold_percent, added_quantity } = req.body;

  try {
    const updateTransaction = db.transaction(() => {
      const itemStmt = db.prepare('SELECT * FROM inventory_items WHERE id = ?');
      const item = itemStmt.get(id) as any;

      if (!item) return null;

      const stockToAdd = added_quantity ? parseInt(added_quantity) : 0;
      const newCurrent = item.current_quantity + stockToAdd;
      const newInitial = item.initial_quantity + stockToAdd;

      const stmt = db.prepare(`
        UPDATE inventory_items 
        SET name = ?, cost_price = ?, usage_price = ?, alert_threshold_percent = ?,
            current_quantity = ?, initial_quantity = ?
        WHERE id = ?
      `);

      stmt.run(
        name || item.name, 
        cost_price !== undefined ? cost_price : item.cost_price, 
        usage_price !== undefined ? usage_price : item.usage_price, 
        alert_threshold_percent !== undefined ? alert_threshold_percent : item.alert_threshold_percent,
        newCurrent,
        newInitial,
        id
      );
      
      return true;
    });

    const success = updateTransaction();
    if (!success) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Inventory item updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating inventory item' });
  }
};

export const deleteInventoryItem = (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // 1. Check if this item has ever been used in an appointment
    const usageCheck = db.prepare('SELECT COUNT(*) as count FROM material_usage WHERE inventory_id = ?');
    const result = usageCheck.get(id) as { count: number };

    // 2. If it has history, block the deletion to protect financial records
    if (result.count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete this item because it has already been used in patient appointments. To remove it from active use, please update its quantity to 0 instead.' 
      });
    }

    // 3. If it has no history (e.g. added by mistake), delete it safely
    const stmt = db.prepare('DELETE FROM inventory_items WHERE id = ?');
    const info = stmt.run(id);

    if (info.changes === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error("Delete Inventory Error:", error);
    res.status(500).json({ message: 'Error deleting inventory item' });
  }
};