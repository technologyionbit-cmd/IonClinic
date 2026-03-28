import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import csv from 'csv-parser';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('clinic.db');

// File paths based on your newly uploaded files
const TRANS_CSV = path.join(__dirname, 'Derma-class.xlsx - Patient Trans.csv');
const PAY_CSV = path.join(__dirname, 'Derma-class.xlsx - Patient Pay.csv');

// Prepare the SQL statements
const insertAppointment = db.prepare(`
  INSERT INTO appointments (patient_id, appointment_datetime, price, doctor_notes, status)
  VALUES (@patient_id, @appointment_datetime, @price, @doctor_notes, 'Completed')
`);

const insertPayment = db.prepare(`
  INSERT INTO payments (patient_id, amount, payment_date, payment_method)
  VALUES (@patient_id, @amount, @payment_date, @payment_method)
`);

async function migrateData() {
  console.log('🚀 Starting Phase 2 Migration...');

  // 1. Migrate Treatments -> Appointments
  await new Promise<void>((resolve, reject) => {
    console.log(`⏳ Reading Treatments from: ${TRANS_CSV}`);
    let transCount = 0;
    
    db.exec('BEGIN TRANSACTION');

    fs.createReadStream(TRANS_CSV)
      .on('error', (err) => {
        console.error(`❌ File not found: ${TRANS_CSV}`);
        reject(err);
      })
      .pipe(csv())
      .on('data', (row) => {
        const patientId = parseInt(row.FileNumber, 10);
        if (isNaN(patientId)) return;

        try {
          // We map TreatmentName to doctor_notes so you keep the history of what was done
          insertAppointment.run({
            patient_id: patientId,
            appointment_datetime: row.EntryDate || new Date().toISOString().split('T')[0],
            price: parseFloat(row.TreatmentValue) || 0,
            doctor_notes: row.TreatmentName || 'N/A'
          });
          transCount++;
        } catch (error: any) {
          // Ignore foreign key errors if a patient ID from the CSV doesn't exist in the DB
          if (!error.message.includes('FOREIGN KEY')) {
             console.error(`❌ Error inserting treatment for patient ID ${patientId}:`, error.message);
          }
        }
      })
      .on('end', () => {
        db.exec('COMMIT');
        console.log(`✅ Successfully migrated ${transCount} treatment records into appointments!`);
        resolve();
      });
  });

  // 2. Migrate Payments -> Payments
  await new Promise<void>((resolve, reject) => {
    console.log(`\n⏳ Reading Payments from: ${PAY_CSV}`);
    let payCount = 0;
    
    db.exec('BEGIN TRANSACTION');

    fs.createReadStream(PAY_CSV)
      .on('error', (err) => {
        console.error(`❌ File not found: ${PAY_CSV}`);
        reject(err);
      })
      .pipe(csv())
      .on('data', (row) => {
        const patientId = parseInt(row.FileNumber, 10);
        if (isNaN(patientId)) return;

        try {
          insertPayment.run({
            patient_id: patientId,
            amount: parseFloat(row.PayValue) || 0,
            payment_date: row.PayDate || new Date().toISOString().split('T')[0],
            payment_method: row.PaymentType || 'كاش'
          });
          payCount++;
        } catch (error: any) {
          if (!error.message.includes('FOREIGN KEY')) {
             console.error(`❌ Error inserting payment for patient ID ${patientId}:`, error.message);
          }
        }
      })
      .on('end', () => {
        db.exec('COMMIT');
        console.log(`✅ Successfully migrated ${payCount} payment records!`);
        resolve();
      });
  });

  console.log('\n🎉 All historical data has been successfully imported into clinic.db!');
}

// Run the migration
migrateData().catch(console.error);