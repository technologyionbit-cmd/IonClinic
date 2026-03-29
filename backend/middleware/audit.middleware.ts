import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware.js';
import db from '../database.js';

export const auditLogger = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Only intercept mutation requests (Create, Update, Delete)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    
    // We listen for the 'finish' event to ensure the DB operation actually succeeded
    res.on('finish', () => {
      // Only log if the request was successful (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        
        // Example: Extracts 'PATIENTS' from '/api/patients/12'
        const moduleName = req.baseUrl.split('/').pop()?.toUpperCase() || 'UNKNOWN';
        let action = '';

        if (req.method === 'POST') action = `CREATE_${moduleName}`;
        if (req.method === 'PUT' || req.method === 'PATCH') action = `UPDATE_${moduleName}`;
        if (req.method === 'DELETE') action = `DELETE_${moduleName}`;

        const userId = req.user?.id || null;
        
        // Log the body data (masking passwords if logging auth routes)
        let bodyData = { ...req.body };
        if (bodyData.password) bodyData.password = '***';

        try {
          const stmt = db.prepare(`
            INSERT INTO audit_logs (user_id, action, table_name, new_value) 
            VALUES (?, ?, ?, ?)
          `);
          stmt.run(userId, action, moduleName, JSON.stringify(bodyData));
        } catch (error) {
          // We don't want an audit log failure to crash the server, so we just log it to console
          console.error('🚨 Audit Log Failed:', error);
        }
      }
    });
  }
  next();
};