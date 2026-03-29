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
    // cellDates: true → xlsx parses date serials into JS Date objects automatically
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });

    // Insert order respects FK constraints: parents before children
    const tables = ['patients', 'appointments', 'payments', 'inventory_items', 'material_usage'];

    // Columns that must be stored as "YYYY-MM-DD" strings
    const DATE_COLUMNS = new Set([
      'birth_date', 'start_date', 'appointment_datetime',
      'payment_date', 'usage_date',
    ]);

    /**
     * Normalise a single cell value before inserting into SQLite.
     *  - JS Date  → "YYYY-MM-DD"
     *  - number that looks like an Excel serial → "YYYY-MM-DD"  (only for date columns)
     *  - everything else → unchanged
     */
    const normaliseValue = (col: string, val: any): any => {
      if (val === null || val === undefined) return null;

      if (DATE_COLUMNS.has(col)) {
        if (val instanceof Date) {
          return val.toISOString().split('T')[0];
        }
        if (typeof val === 'number' && val > 40000) {
          // Excel date serial → JS timestamp
          return new Date(Math.round((val - 25569) * 86400 * 1000))
            .toISOString()
            .split('T')[0];
        }
      }

      return val;
    };

    const importTransaction = db.transaction(() => {
      const stats: Record<string, number> = {};

      for (const tableName of tables) {
        const sheet = workbook.Sheets[tableName];
        if (!sheet) { stats[tableName] = 0; continue; }

        const data: any[] = xlsx.utils.sheet_to_json(sheet);
        if (data.length === 0) { stats[tableName] = 0; continue; }

        const columns = Object.keys(data[0]);
        const placeholders = columns.map(() => '?').join(', ');
        const setClauses   = columns.map(c => `${c} = excluded.${c}`).join(', ');

        /**
         * Use INSERT … ON CONFLICT(id) DO UPDATE instead of INSERT OR REPLACE.
         *
         * INSERT OR REPLACE deletes the old row first, which:
         *   1. Loses the AUTOINCREMENT sequence position.
         *   2. Cascades deletes to child rows (appointments, payments, etc.)
         *      even inside the same transaction, breaking FK integrity.
         *
         * ON CONFLICT DO UPDATE (a.k.a. "upsert") updates the existing row
         * in-place, so child rows are never touched.
         */
        const upsertStmt = db.prepare(`
          INSERT INTO ${tableName} (${columns.join(', ')})
          VALUES (${placeholders})
          ON CONFLICT(id) DO UPDATE SET ${setClauses}
        `);

        let count = 0;
        for (const row of data) {
          const values = columns.map(col => normaliseValue(col, row[col]));
          upsertStmt.run(...values);
          count++;
        }

        stats[tableName] = count;
      }

      // ── Recompute patients.total_amount & patients.remaining_amount ──────
      //
      // The Excel file stores 0 for these because they are derived fields.
      // After inserting appointments and payments we recalculate them so the
      // frontend shows correct balances immediately without a full reload.
      //
      //   total_amount     = SUM of all appointment prices for the patient
      //   remaining_amount = total_amount - SUM of all payments for the patient
      //
      db.prepare(`
        UPDATE patients
        SET
          total_amount = COALESCE((
            SELECT SUM(price) FROM appointments WHERE patient_id = patients.id
          ), 0),
          remaining_amount = COALESCE((
            SELECT SUM(price) FROM appointments WHERE patient_id = patients.id
          ), 0) - COALESCE((
            SELECT SUM(amount) FROM payments WHERE patient_id = patients.id
          ), 0)
      `).run();

      return stats;
    });

    const stats = importTransaction();

    res.json({
      message: 'Database imported successfully.',
      inserted: stats,
    });

  } catch (error: any) {
    console.error('Import Error:', error);

    // Surface a friendlier message for the most common failure modes
    const msg: string = error?.message || '';
    if (msg.includes('FOREIGN KEY')) {
      return res.status(400).json({
        message: 'Import failed: a row references a patient_id that does not exist. Make sure all patient IDs in appointments/payments match an id in the patients sheet.',
      });
    }
    if (msg.includes('NOT NULL')) {
      return res.status(400).json({
        message: `Import failed: a required column is empty. Detail: ${msg}`,
      });
    }

    res.status(500).json({
      message: 'Error importing database. Check file format and foreign key integrity.',
      detail: msg,
    });
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