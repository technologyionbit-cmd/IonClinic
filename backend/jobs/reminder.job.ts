import cron from 'node-cron';
import db from '../database.js';
import { sendWhatsAppMessage } from '../services/whatsapp.service.js';

// Helper to format local JS dates into SQLite format (YYYY-MM-DD HH:MM:SS)
const getLocalSQLiteDate = (date: Date) => {
  const tzoffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  return new Date(date.getTime() - tzoffset).toISOString().slice(0, 19).replace('T', ' ');
};

export const initCronJobs = () => {
  // Run every 30 minutes: '*/30 * * * *'
  cron.schedule('*/30 * * * *', async () => {
    console.log('⏳ Running WhatsApp reminder check...');

    const now = new Date();
    // Calculate exactly 24 hours from right now
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const nowStr = getLocalSQLiteDate(now);
    const next24Str = getLocalSQLiteDate(next24Hours);

    try {
      // Find appointments between NOW and 24 HOURS FROM NOW where reminder is NOT sent
      const stmt = db.prepare(`
        SELECT a.id, a.appointment_datetime, p.full_name, p.phone_number 
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.appointment_datetime > ? AND a.appointment_datetime <= ?
        AND a.reminder_sent = 0
        AND a.status = 'Scheduled'
      `);
      
      const appointments = stmt.all(nowStr, next24Str) as any[];

      if (appointments.length === 0) {
        console.log('No new reminders to send in the next 24-hour window.');
        return;
      }

      for (const appt of appointments) {
        const timeObj = new Date(appt.appointment_datetime);
        const timeString = timeObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

        const message = `مرحباً ${appt.full_name}\nنذكركم بموعدكم غداً الساعة ${timeString}\nنتمنى لكم الصحة 🦷`;
        
        const sent = await sendWhatsAppMessage(appt.phone_number, message);
        
        if (sent) {
          const updateStmt = db.prepare('UPDATE appointments SET reminder_sent = 1 WHERE id = ?');
          updateStmt.run(appt.id);
          console.log(`✅ Reminder sent to ${appt.full_name}`);
        }
      }
    } catch (error) {
      console.error('❌ Error in reminder cron job:', error);
    }
  });
};