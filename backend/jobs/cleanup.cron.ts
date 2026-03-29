import cron from 'node-cron';
import db from '../database.js';

export const initCleanupCron = () => {
  // This cron expression '0 3 * * *' means it runs every day at 3:00 AM.
  // Running it daily ensures it constantly prunes logs that just turned 1 month old.
  cron.schedule('0 10 * * *', () => {
    try {
      console.log('🧹 [Cron] Running automatic audit log cleanup...');
      
      // SQL command to delete records older than 1 month
      const cleanupStmt = db.prepare(`
        DELETE FROM audit_logs 
        WHERE timestamp < datetime('now', '-1 month')
      `);
      
      const info = cleanupStmt.run();
      
      console.log(`✅ [Cron] Cleanup complete. Deleted ${info.changes} old audit logs.`);
    } catch (error) {
      console.error('❌ [Cron] Error during audit log cleanup:', error);
    }
  });
};