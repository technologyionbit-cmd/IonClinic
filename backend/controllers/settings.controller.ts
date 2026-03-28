import type { Request, Response } from 'express';
import * as xlsx from 'xlsx';
import db from '../database.js';

// 1. Get all settings
export const getSettings = (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('SELECT setting_key, setting_value FROM settings');
    const settings = stmt.all();
    
    // Convert array of objects [{key: 'x', value: 'y'}] to a single object { x: 'y' }
    const settingsObj = settings.reduce((acc: any, curr: any) => {
      acc[curr.setting_key] = curr.setting_value;
      return acc;
    }, {});

    res.json(settingsObj);
  } catch (error) {
    console.error('Settings Error:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

// 2. Update a setting (Admin Only)
export const updateSetting = (req: Request, res: Response) => {
  const { key, value } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({ message: 'Key and value are required' });
  }

  // --- TIME SYSTEM PROTECTION ---
  if (key === 'work_start_time' || key === 'work_end_time') {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; 
    
    if (!timeRegex.test(value.toString())) {
      return res.status(400).json({ 
        message: `Invalid time format for ${key}. Please use HH:MM (24-hour format, e.g., "09:00" or "14:30").` 
      });
    }
  }

  if (key === 'max_daily_appointments') {
    const limit = parseInt(value.toString());
    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({ message: 'Max daily appointments must be a valid number greater than 0.' });
    }
  }

  // --- NEW: PERCENTAGE PROTECTION ---
  if (key === 'max_patients_percentage') {
    const percentage = parseInt(value.toString());
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return res.status(400).json({ message: 'Max patients percentage must be a number between 0 and 100.' });
    }
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO settings (setting_key, setting_value) 
      VALUES (?, ?) 
      ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value
    `);
    
    stmt.run(key, value.toString());
    res.json({ message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Settings Update Error:', error);
    res.status(500).json({ message: 'Error updating setting' });
  }
};

// 3. Import Database from Excel (Admin Only)
export const importDatabase = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No Excel file uploaded.' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    
    // Define the tables and the exact order to insert them (Parents before Children to respect Foreign Keys)
    const tables = ['patients', 'appointments', 'payments', 'inventory_items', 'material_usage'];

    const importTransaction = db.transaction(() => {
      for (const tableName of tables) {
        const sheet = workbook.Sheets[tableName];
        if (!sheet) continue;

        const data: any[] = xlsx.utils.sheet_to_json(sheet);
        if (data.length === 0) continue;

        // Extract column headers dynamically from the first row of data
        const columns = Object.keys(data[0]);
        const placeholders = columns.map(() => '?').join(', ');
        const columnNames = columns.join(', ');

        const insertStmt = db.prepare(`
          INSERT OR REPLACE INTO ${tableName} (${columnNames}) 
          VALUES (${placeholders})
        `);

        for (const row of data) {
          const values = columns.map(col => row[col]);
          insertStmt.run(...values);
        }
      }
    });

    importTransaction();
    res.json({ message: 'Database imported successfully.' });

  } catch (error) {
    console.error('Import Error:', error);
    res.status(500).json({ message: 'Error importing database. Check file format and foreign key integrity.' });
  }
};

// 4. Clear Database (Admin Only)
export const clearDatabase = (req: Request, res: Response) => {
  try {
    const clearTransaction = db.transaction(() => {
      // Delete in reverse order of dependencies to respect Foreign Keys
      db.prepare('DELETE FROM material_usage').run();
      db.prepare('DELETE FROM inventory_items').run();
      db.prepare('DELETE FROM payments').run();
      db.prepare('DELETE FROM appointments').run();
      db.prepare('DELETE FROM patients').run();
      db.prepare('DELETE FROM audit_logs').run();

      // Reset auto-increment counters for the cleared tables
      db.prepare(`
        DELETE FROM sqlite_sequence 
        WHERE name IN ('material_usage', 'inventory_items', 'payments', 'appointments', 'patients', 'audit_logs')
      `).run();
    });

    clearTransaction();
    res.json({ message: 'Database cleared successfully. Users and Settings were preserved.' });

  } catch (error) {
    console.error('Clear Database Error:', error);
    res.status(500).json({ message: 'Error clearing database.' });
  }
};