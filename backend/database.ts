import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('clinic.db', { verbose: console.log });

const initDB = () => {
  db.pragma('foreign_keys = ON');

  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'Secretary' 
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      birth_date TEXT,
      notes TEXT, 
      treatment_plan TEXT,
      total_amount REAL DEFAULT 0,
      remaining_amount REAL DEFAULT 0,
      start_date TEXT DEFAULT CURRENT_DATE
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      appointment_datetime TEXT NOT NULL, 
      session_number INTEGER,
      price REAL DEFAULT 0, 
      status TEXT DEFAULT 'Scheduled', 
      reminder_sent INTEGER DEFAULT 0,
      octor_notes TEXT,
is_quick INTEGER DEFAULT 0,
FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT DEFAULT CURRENT_TIMESTAMP,
      payment_method TEXT,
      FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      initial_quantity INTEGER NOT NULL,
      current_quantity INTEGER NOT NULL,
      cost_price REAL NOT NULL,
      usage_price REAL NOT NULL,
      alert_threshold_percent INTEGER DEFAULT 20
    );

    CREATE TABLE IF NOT EXISTS material_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id INTEGER NOT NULL,
      patient_id INTEGER NOT NULL, -- STRICT RULE: Must have patient
      appointment_id INTEGER NOT NULL, -- STRICT RULE: Must have appointment
      doctor_id INTEGER NOT NULL,
      quantity_used INTEGER NOT NULL,
      usage_date TEXT DEFAULT CURRENT_TIMESTAMP,
      profit_generated REAL DEFAULT 0,
      FOREIGN KEY (inventory_id) REFERENCES inventory_items (id),
      FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
      FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL, 
      table_name TEXT,
      record_id INTEGER,
      old_value TEXT, 
      new_value TEXT, 
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL
    );
  `;
  db.exec(schema);

  db.exec('CREATE INDEX IF NOT EXISTS idx_patients_start_date ON patients(start_date);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);');

  const seedSettings = db.prepare(`
    INSERT OR IGNORE INTO settings (setting_key, setting_value) 
    VALUES 
    ('max_daily_appointments', '20'),
    ('work_start_time', '09:00'),
    ('work_end_time', '17:00')
  `);
  seedSettings.run();
};

initDB();

export default db;