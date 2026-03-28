import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patient.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import backupRoutes from './routes/backup.routes.js';

// Services & Jobs
import { initWhatsApp } from './services/whatsapp.service.js';
import { initCronJobs } from './jobs/reminder.job.js';
import { initCleanupCron } from './jobs/cleanup.cron.js';
import { auditLogger } from './middleware/audit.middleware.js';

import './database.js';

dotenv.config();

const app: Application = express();
// Aligning the port to 5003 so Electron knows exactly where to look
const PORT = Number(process.env.PORT) || 5003;

// 1. Middlewares
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());
app.use(auditLogger);

// 2. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backup', backupRoutes);

// 3. Initialize Background Services
initWhatsApp();
initCronJobs();
initCleanupCron();

// 4. Serve the React Frontend (Must be placed AFTER API routes)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Assuming you put your built React files inside the 'public' folder
const frontendPath = path.join(__dirname, '../public');
app.use(express.static(frontendPath));

// Catch-all route to hand frontend routing over to React
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 5. Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on all network interfaces (0.0.0.0:${PORT})`);
});