# Clinexa Backend (V1) — Node.js + Express + MongoDB

Clinexa is a **single-doctor clinic SaaS backend (V1)** built to support:
- **Patient Mobile App** (Flutter)
- **Doctor Web Dashboard** (Flutter Web)
- **Admin Panel** (Clinic Owner Admin)
- Unified backend (Node.js + MongoDB)

> ✅ Current Release: **v1.0.0**

---

## ✅ Features (V1)

### Sprint 1 — Auth
- Register / Login
- Roles: `admin`, `doctor`, `patient`
- JWT Authentication
- `/auth/me`
- Standard API response format

### Sprint 2 — Doctor + Clinic
- Doctor profile upsert
- Clinic upsert linked to doctor
- Public endpoints for listing doctors/clinic by doctor

### Sprint 3 — Patients
- Patient profile upsert
- Patient profile view (me)
- Admin get all patients
- Doctor get patient by id

### Sprint 4 — Appointments (Core)
- Patient books appointment
- Single-doctor V1: backend auto-assigns doctor
- Doctor confirms / completes
- Patient/Doctor/Admin cancels
- Doctor view list (optional filter by date)
- Admin view appointments with filters

### Sprint 5 — Prescriptions
- Doctor creates/updates prescriptions
- Prescription items support
- Patient views own prescriptions
- Doctor/Admin views prescriptions by patient or appointment
- Admin overview

### Sprint 6 — Admin
- Basic stats
- Manage patients (toggle active)
- Manage appointments status
- Manage clinic settings
- Prescriptions overview

### Sprint 7 — Notifications (Email)
Email triggers:
- Appointment created → Email to Doctor
- Appointment confirmed → Email to Patient
- Appointment cancelled → Email to Patient

---

## 🧱 Tech Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT Auth
- Nodemailer (Email notifications)
- MVC structure

---

## 📁 Project Structure


src/
config/ # DB connection
controllers/ # controllers
middleware/ # auth + role
models/ # mongoose models
routes/ # routes per module
services/ # email service + templates
utils/ # response helpers
app.js # express app
server.js # server bootstrap
docs/ # flows & diagrams (Mermaid)


---

## ⚙️ Setup (Local)

### 1) Install
```bash
npm install

2) Environment Variables (.env)

Create .env in the project root:

PORT=5000
MONGO_URI="your_mongo_connection_string"
JWT_SECRET=your_jwt_secret

# Email (Gmail SMTP Example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=your_email@gmail.com


✅ Gmail requires App Password (not your normal Gmail password).

3) Run
npm run dev


API base:

http://localhost:5000/api

✅ Standard Response Format

All endpoints respond as:

{
  "success": true,
  "message": "Success",
  "data": {}
}

🧪 Postman Testing

Import:

clinexa-postman.json

Recommended order:

Auth (register/login/me)

Doctor + Clinic

Patient profile

Appointments (create → confirm → cancel)

Prescriptions

Admin endpoints

Sprint 7 is validated by triggering appointment events (emails will be sent if SMTP is configured).

🚀 Release Workflow (Company Style)

Branches:

development → integration branch (work in progress)

main → stable release branch (deploy from here)

sprint-* → sprint branches

Release steps:

Merge development → main

Create tag (example):

git tag -a v1.0.0 -m "Clinexa Backend V1"
git push origin main --tags

📌 Notes (V1 Constraints)

Single-doctor system (V1): patient does not choose doctor

Multi-doctor / multi-branch will be in V3
