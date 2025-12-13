# Clinexa Backend (Node.js + Express + MongoDB)

Clinexa is a **single-doctor clinic SaaS** backend (V1) built with Node.js, Express, MongoDB (Mongoose), and JWT authentication.

## ✅ Features (V1)
- Auth (register/login/me) + roles (admin/doctor/patient)
- Doctor Profile + Clinic Settings
- Patient Profile
- Appointments (booking + status lifecycle)
- Prescriptions (items, notes, patient view)
- Admin Module (clinic owner admin)
- Notifications (Email via SMTP / Gmail App Password)

---

## 🧱 Tech Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT Auth
- Nodemailer for email notifications
- MVC structure

---

## 📁 Project Structure
src/
config/ # db connection
controllers/ # controllers (MVC)
middleware/ # auth + role
models/ # mongoose models
routes/ # routes per module
services/ # email service + templates
utils/ # response helper
app.js # express app
server.js # server bootstrap

yaml
Copy code

---

## ⚙️ Setup

### 1) Install dependencies
```bash
npm install
2) Create .env
Create a .env file in the project root:

env
Copy code
PORT=5000
MONGO_URI="your_mongo_connection_string"
JWT_SECRET=your_secret_key

# SMTP (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
For Gmail: use App Password, not your normal password.

3) Run in dev mode
bash
Copy code
npm run dev
🔐 Response Format
All endpoints follow a standard response:

json
Copy code
{
  "success": true,
  "message": "Success",
  "data": {}
}
🧩 Modules Overview (V1)
Sprint 1 — Auth
POST /api/auth/register

POST /api/auth/login

GET /api/auth/me

Sprint 2 — Doctor + Clinic
POST /api/doctors (doctor upsert)

GET /api/doctors/me

POST /api/clinics (clinic upsert)

GET /api/clinics/me

Sprint 3 — Patients
POST /api/patients (upsert)

GET /api/patients/me

Sprint 4 — Appointments
Single-doctor logic: patient does NOT send doctor_id. Backend auto-assigns the single doctor.

POST /api/appointments (patient books)

GET /api/appointments/my (patient)

GET /api/appointments/doctor (doctor)

PATCH /api/appointments/confirm/:id (doctor/admin)

PATCH /api/appointments/cancel/:id (patient/doctor/admin)

PATCH /api/appointments/complete/:id (doctor/admin)

Sprint 5 — Prescriptions
POST /api/prescriptions (doctor)

PUT /api/prescriptions/:id (doctor)

GET /api/prescriptions/my (patient)

GET /api/prescriptions/patient/:patientId (doctor/admin)

GET /api/prescriptions/appointment/:appointmentId (doctor/admin)

Sprint 6 — Admin (Clinic Owner)
GET /api/admin/stats

GET /api/admin/patients

PATCH /api/admin/patients/:id/toggle-active

GET /api/admin/appointments?status=&date=YYYY-MM-DD

PATCH /api/admin/appointments/:id/status

GET /api/admin/prescriptions

GET /api/admin/clinic

PUT /api/admin/clinic

Sprint 7 — Notifications (Email)
Emails are triggered on:

Appointment created (email → doctor)

Appointment confirmed (email → patient)

Appointment cancelled (email → patient)