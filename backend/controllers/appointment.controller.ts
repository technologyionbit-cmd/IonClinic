import type { Request, Response } from "express";
import db from "../database.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

/* ------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------ */

const to12HourFormat = (time24: string) => {
  if (!time24) return "";

  const [hourStr, minute] = time24.split(":");
  let hour = parseInt(hourStr, 10);

  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;

  return `${String(hour).padStart(2, "0")}:${minute} ${ampm}`;
};

const extractTime = (date: Date) => {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

/* ------------------------------------------------ */
/* Settings Cache */
/* ------------------------------------------------ */

let cachedSettings: any = null;

const loadSettings = () => {
  if (cachedSettings) return cachedSettings;

  const rows = db
    .prepare(`SELECT setting_key, setting_value FROM settings`)
    .all() as any[];

  cachedSettings = Object.fromEntries(
    rows.map((r) => [r.setting_key, r.setting_value])
  );

  return cachedSettings;
};

/* ------------------------------------------------ */
/* Prepared Statements */
/* ------------------------------------------------ */

const insertAppointmentStmt = db.prepare(`
INSERT INTO appointments 
(patient_id, appointment_datetime, session_number, price, status)
VALUES (?, ?, ?, ?, 'Scheduled')
`);

const updatePatientBalanceStmt = db.prepare(`
UPDATE patients
SET total_amount = total_amount + ?, remaining_amount = remaining_amount + ?
WHERE id = ?
`);

// OPTIMAL FIX: Use LIKE instead of >= and <= to bypass the 'T' vs Space issue
const countDailyAppointmentsStmt = db.prepare(`
SELECT COUNT(*) as count
FROM appointments
WHERE appointment_datetime LIKE ?
AND status != 'Cancelled'
`);

const checkDoubleBookingStmt = db.prepare(`
SELECT COUNT(*) as count
FROM appointments
WHERE appointment_datetime = ?
AND status != 'Cancelled'
`);

const getAppointmentStmt = db.prepare(`
SELECT price, patient_id
FROM appointments
WHERE id = ?
`);

const updateAppointmentStmt = db.prepare(`
UPDATE appointments
SET appointment_datetime = ?, session_number = ?, price = ?, status = ?
WHERE id = ?
`);

const deleteAppointmentStmt = db.prepare(`
DELETE FROM appointments
WHERE id = ?
`);

const getAppointmentsStmt = db.prepare(`
SELECT a.*, p.full_name, p.phone_number
FROM appointments a
JOIN patients p ON a.patient_id = p.id
ORDER BY a.appointment_datetime ASC
LIMIT 50
`);

/* ------------------------------------------------ */
/* Create Appointment */
/* ------------------------------------------------ */

export const createAppointment = (req: Request, res: Response) => {
  try {
    const { patient_id, appointment_datetime, session_number, price } = req.body;
    const sessionPrice = price || 0;

    const settings = loadSettings();

    const maxLimit = parseInt(settings.max_daily_appointments || "20");
    const workStart = settings.work_start_time || "09:00";
    const workEnd = settings.work_end_time || "21:00";

    const aptDate = new Date(appointment_datetime);

    if (isNaN(aptDate.getTime())) {
      return res.status(400).json({ message: "Invalid datetime format." });
    }

    const timePart = extractTime(aptDate);

    if (timePart < workStart || timePart > workEnd) {
      return res.status(400).json({
        message: `Appointment time (${to12HourFormat(
          timePart
        )}) must be between ${to12HourFormat(workStart)} and ${to12HourFormat(
          workEnd
        )}`,
      });
    }

    // OPTIMAL FIX: Grab strictly the "YYYY-MM-DD" part whether it has a T or a space.
    const day = appointment_datetime.split("T")[0].split(" ")[0]; 
    
    // Pass strictly the prefix string with the % wildcard
    const dailyCount = (countDailyAppointmentsStmt.get(`${day}%`) as any).count;

    if (dailyCount >= maxLimit) {
      return res
        .status(400)
        .json({ message: `Daily limit of ${maxLimit} appointments reached.` });
    }

    const isDoubleBooked =
      (checkDoubleBookingStmt.get(appointment_datetime) as any).count > 0;

    const createTx = db.transaction(() => {
      const info = insertAppointmentStmt.run(
        patient_id,
        appointment_datetime,
        session_number,
        sessionPrice
      );

      updatePatientBalanceStmt.run(sessionPrice, sessionPrice, patient_id);

      return info.lastInsertRowid;
    });

    const newId = createTx();

    res.status(201).json({
      message: "Appointment booked successfully",
      id: newId,
      warning: isDoubleBooked
        ? "Warning: Another patient is already booked at this time."
        : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error booking appointment" });
  }
};

/* ------------------------------------------------ */
/* Get Appointments */
/* ------------------------------------------------ */

export const getAppointments = (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    if (!date) {
      const rows = getAppointmentsStmt.all();
      return res.json(rows);
    }

    // OPTIMAL FIX: Database filter using LIKE instead of BETWEEN to handle the string safely
    const rows = db
      .prepare(`
      SELECT a.*, p.full_name, p.phone_number
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.appointment_datetime LIKE ?
      ORDER BY a.appointment_datetime ASC
    `)
      .all(`${date}%`);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching appointments" });
  }
};

/* ------------------------------------------------ */
/* Update Appointment */
/* ------------------------------------------------ */

export const updateAppointment = (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { appointment_datetime, session_number, status, price } = req.body;
    const newPrice = price || 0;

    const settings = loadSettings();

    const workStart = settings.work_start_time || "09:00";
    const workEnd = settings.work_end_time || "21:00";

    const aptDate = new Date(appointment_datetime);

    if (isNaN(aptDate.getTime())) {
      return res.status(400).json({ message: "Invalid datetime format." });
    }

    const timePart = extractTime(aptDate);

    if (timePart < workStart || timePart > workEnd) {
      return res.status(400).json({
        message: `Appointment time (${to12HourFormat(
          timePart
        )}) must be within working hours.`,
      });
    }

    const updateTx = db.transaction(() => {
      const oldAppt = getAppointmentStmt.get(id) as any;

      if (!oldAppt) return false;

      const diff = newPrice - oldAppt.price;

      updateAppointmentStmt.run(
        appointment_datetime,
        session_number,
        newPrice,
        status,
        id
      );

      if (diff !== 0) {
        updatePatientBalanceStmt.run(diff, diff, oldAppt.patient_id);
      }

      return true;
    });

    const success = updateTx();

    if (!success) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating appointment" });
  }
};

/* ------------------------------------------------ */
/* Delete Appointment */
/* ------------------------------------------------ */

export const deleteAppointment = (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deleteTx = db.transaction(() => {
      const oldAppt = getAppointmentStmt.get(id) as any;

      if (!oldAppt) return false;

      deleteAppointmentStmt.run(id);

      updatePatientBalanceStmt.run(
        -oldAppt.price,
        -oldAppt.price,
        oldAppt.patient_id
      );

      return true;
    });

    const success = deleteTx();

    if (!success) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting appointment" });
  }
};

/* ------------------------------------------------ */
/* Daily Stats */
/* ------------------------------------------------ */

export const getDailyStats = (req: Request, res: Response) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      message: "Date parameter is required (YYYY-MM-DD)",
    });
  }

  try {
    const settings = loadSettings();

    const maxLimit = parseInt(settings.max_daily_appointments || "20");
    const workStart = settings.work_start_time || "09:00";
    const workEnd = settings.work_end_time || "21:00";

    // OPTIMAL FIX: Grab strictly the "YYYY-MM-DD" part whether it has a T or a space.
    const day = (date as string).split("T")[0].split(" ")[0];

    const dailyCount = (countDailyAppointmentsStmt.get(
      `${day}%`
    ) as any).count;

    res.json({
      date,
      working_hours: {
        start: to12HourFormat(workStart),
        end: to12HourFormat(workEnd),
      },
      appointments: {
        max_allowed: maxLimit,
        current_booked: dailyCount,
        is_full: dailyCount >= maxLimit,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching daily stats" });
  }
};

/* ------------------------------------------------ */
/* Medical Record */
/* ------------------------------------------------ */
export const addMedicalRecord = (req: AuthRequest, res: Response) => {
  const { id }                        = req.params;
  const { doctor_notes, medications } = req.body;
  const doctor_id                     = req.user?.id;

  try {
    db.transaction(() => {
      const appointment = db.prepare(`SELECT patient_id FROM appointments WHERE id = ?`).get(id) as any;
      if (!appointment) throw new Error("Appointment not found");
      const patient_id = appointment.patient_id;

      if (doctor_notes) {
        db.prepare(`UPDATE appointments SET doctor_notes = ?, status = 'Completed' WHERE id = ?`).run(doctor_notes, id);
      }

      let totalMaterialsCost = 0;

      if (Array.isArray(medications)) {
        for (const med of medications) {
          const { inventory_id, quantity } = med;
          if (!inventory_id || quantity <= 0) throw new Error("Invalid medication entry");

          const item = db.prepare(`SELECT current_quantity, cost_price FROM inventory_items WHERE id = ?`).get(inventory_id) as any;
          if (!item)                            throw new Error("Inventory item not found");
          if (item.current_quantity < quantity) throw new Error("Insufficient stock");

          totalMaterialsCost += item.cost_price * quantity;

          db.prepare(`UPDATE inventory_items SET current_quantity = current_quantity - ? WHERE id = ?`).run(quantity, inventory_id);
          db.prepare(`
            INSERT INTO material_usage (inventory_id, patient_id, appointment_id, doctor_id, quantity_used, profit_generated)
            VALUES (?, ?, ?, ?, ?, 0)
          `).run(inventory_id, patient_id, id, doctor_id, quantity);
        }
      }

      if (totalMaterialsCost > 0) {
        db.prepare(`
          UPDATE patients SET total_amount = total_amount + ?, remaining_amount = remaining_amount + ? WHERE id = ?
        `).run(totalMaterialsCost, totalMaterialsCost, patient_id);
      }
    })();

    res.json({ message: "Medical record and medications saved successfully" });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message || "Error processing medical record" });
  }
};
