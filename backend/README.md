# Clinic Management System API

This is the backend API for the Clinic Management System. It is built using Node.js, Express, TypeScript, and SQLite.

## 🚀 Getting Started

### 1. Install Dependencies
Make sure you have Node.js installed, then run:
```bash
npm install
```

### 2. Setup the Database
To initialize the SQLite database and create the default admin account, run the seed script:
```bash
npx tsx seed.ts
```
*(Default credentials: Username: `admin` | Password: `admin123`)*

### 3. Start the Server
Start the development server:
```bash
npm run dev
```
The server will start on `http://localhost:5003`.

---

## 🔐 Authentication

All API endpoints (except login) require a JWT token. You must include this token in the headers of your requests.

**Header Format:**
```json
{
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

---

## 📡 API Endpoints

### 1. Auth (تسجيل الدخول)
* **POST** `/api/auth/login`
    * **Body:** `{"username": "admin", "password": "admin123"}`
    * **Returns:** JWT Token and user info.

### 2. Patients (إدارة المرضى)
* **GET** `/api/patients` - Get a list of all patients.
* **GET** `/api/patients/:id` - Get a specific patient's complete file.
* **POST** `/api/patients` - Add a new patient.
    * **Body Example:**
        ```json
        {
          "full_name": "محمد أحمد",
          "phone_number": "+201001234567",
          "birth_date": "1985-06-15",
          "notes": "حساسية بنسلين",
          "treatment_plan": "حشو عصب",
          "total_sessions": 4,
          "session_price": 600
        }
        ```
* **PUT** `/api/patients/:id` - Update a patient's details.
* **DELETE** `/api/patients/:id` - Delete a patient (Also deletes their appointments and payments).

### 3. Appointments (إدارة المواعيد)
* **GET** `/api/appointments` - Get all upcoming appointments.
* **GET** `/api/appointments?date=2026-02-21` - Get appointments for a specific day (Daily Calendar View).
* **POST** `/api/appointments` - Book a new appointment.
    * **Body Example:**
        ```json
        {
          "patient_id": 1,
          "appointment_datetime": "2026-02-21 14:30:00",
          "session_number": 1
        }
        ```
* **PUT** `/api/appointments/:id` - Update appointment status.
    * **Body Example:** `{"appointment_datetime": "2026-02-21 14:30:00", "session_number": 1, "status": "Completed"}`
* **DELETE** `/api/appointments/:id` - Cancel/Delete an appointment.

### 4. Payments (إدارة الدفعات)
* **POST** `/api/payments` - Add a payment (Automatically deducts from patient's `remaining_amount`).
    * **Body Example:**
        ```json
        {
          "patient_id": 1,
          "amount": 200,
          "payment_method": "Cash"
        }
        ```
* **GET** `/api/payments/patient/:patientId` - Get the payment history for a specific patient.

### 5. Dashboard (لوحة التحكم)
* **GET** `/api/dashboard` - Get daily statistics for the home screen.
    * **Returns:**
        ```json
        {
          "appointments_today": 5,
          "total_patients": 120,
          "income_today": 1200,
          "total_debts": 4500
        }
        ```