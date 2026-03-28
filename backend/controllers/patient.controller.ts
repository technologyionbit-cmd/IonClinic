import type { Request, Response } from 'express';
import db from '../database.js';

// ==========================================
// 🚀 OPTIMIZATION: Cache Prepared Statements
// Compiling these once at startup makes them instantly ready for any request
// ==========================================
const stmts = {
  createPatient: db.prepare(`
    INSERT INTO patients (full_name, phone_number, birth_date, notes, treatment_plan, total_amount, remaining_amount)
    VALUES (?, ?, ?, ?, ?, 0, 0)
  `),
  getPercentageSetting: db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'max_patients_percentage'"),
  getAllPatients: db.prepare('SELECT * FROM patients ORDER BY start_date DESC'),
  getPatientById: db.prepare('SELECT * FROM patients WHERE id = ?'),
  updatePatient: db.prepare(`
    UPDATE patients 
    SET full_name = ?, phone_number = ?, birth_date = ?, notes = ?, treatment_plan = ?
    WHERE id = ?
  `),
  deletePatient: db.prepare('DELETE FROM patients WHERE id = ?'),
  getPatientSummary: db.prepare('SELECT id, full_name, treatment_plan FROM patients WHERE id = ?'),
  getPatientHistory: db.prepare(`
    SELECT
      a.id as appointment_id,
      a.appointment_datetime,
      a.session_number,
      a.status,
      a.doctor_notes,
      i.name as material_name,
      m.quantity_used
    FROM appointments a
    LEFT JOIN material_usage m ON m.appointment_id = a.id
    LEFT JOIN inventory_items i ON i.id = m.inventory_id
    WHERE a.patient_id = ?
    ORDER BY a.appointment_datetime DESC
  `)
};

export const createPatient = (req: Request, res: Response) => {
  try {
    const { full_name, phone_number, birth_date, notes, treatment_plan } = req.body;
    const info = stmts.createPatient.run(full_name, phone_number, birth_date, notes, treatment_plan);
    res.status(201).json({ message: 'Patient created successfully', id: info.lastInsertRowid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating patient' });
  }
};

export const getAllPatients = (req: Request, res: Response) => {
  try {
    const settingRaw = stmts.getPercentageSetting.get() as { setting_value: string } | undefined;
    const percentage = settingRaw ? parseInt(settingRaw.setting_value) : 100;

    const patients = stmts.getAllPatients.all();

    res.json({
      max_patients_percentage: percentage,
      patients: patients
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Error fetching patients' });
  }
};

export const getPatientById = (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const patient = stmts.getPatientById.get(id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching patient details' });
  }
};

export const updatePatient = (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { full_name, phone_number, birth_date, notes, treatment_plan } = req.body;
    const info = stmts.updatePatient.run(full_name, phone_number, birth_date, notes, treatment_plan, id);
    
    if (info.changes === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json({ message: 'Patient updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating patient' });
  }
};

export const deletePatient = (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const info = stmts.deletePatient.run(id);
    if (info.changes === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting patient' });
  }
};

export const getPatientHistory = (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const patient = stmts.getPatientSummary.get(id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const rows = stmts.getPatientHistory.all(id);
    const appointmentsMap = new Map();

    for (const row of rows as any[]) {
      if (!appointmentsMap.has(row.appointment_id)) {
        appointmentsMap.set(row.appointment_id, {
          appointment_id: row.appointment_id,
          appointment_datetime: row.appointment_datetime,
          session_number: row.session_number,
          status: row.status,
          doctor_notes: row.doctor_notes,
          medications: [],
        });
      }

      if (row.material_name) {
        appointmentsMap.get(row.appointment_id).medications.push({
          material_name: row.material_name,
          quantity_used: row.quantity_used,
        });
      }
    }

    res.json({
      patient,
      timeline: Array.from(appointmentsMap.values()),
    });
  } catch (error) {
    console.error("Medical History Error:", error);
    res.status(500).json({ message: "Error fetching medical history" });
  }
};