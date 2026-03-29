import type { Request, Response } from 'express';
import db from '../database.js';
import fs from 'fs';
import path from 'path';

export const createBackup = (req: Request, res: Response) => {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    
    // Create 'backups' folder if it doesn't exist
    if (!fs.existsSync(backupDir)){
        fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `clinic_backup_${timestamp}.db`);

    // SQLite has a built-in safe backup mechanism, better-sqlite3 supports it
    db.backup(backupFile)
      .then(() => {
        res.json({ message: 'Backup created successfully', file: `clinic_backup_${timestamp}.db` });
      })
      .catch((err) => {
        console.error('Backup Failed:', err);
        res.status(500).json({ message: 'Error creating backup' });
      });

  } catch (error) {
    console.error('Backup Error:', error);
    res.status(500).json({ message: 'Internal server error during backup' });
  }
};