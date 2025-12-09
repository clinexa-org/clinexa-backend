📄 Clinexa Backend – Sprint 4 (Appointments Module)
🚀 Overview

Sprint 4 introduces the Appointments Module, which represents one of the most critical features in Clinexa.
Appointments form the connection point between patients and doctors and serve as the core of the entire clinic system.

This sprint is based on the V1 assumption:

Clinexa V1 = Single Doctor Platform

Meaning:

Only one doctor exists in the system

All appointments automatically belong to that doctor

Patients do NOT choose a doctor

System assigns doctor + clinic automatically

This simplifies the booking flow and makes the product ready for real clinics.

🎯 Sprint Objectives
1️⃣ Patient

Create appointments

View own appointments

Cancel own appointment

2️⃣ Doctor

View all appointments

Filter by date

Confirm appointments

Complete appointments

Cancel appointments

3️⃣ Admin

View all appointments

Filter by date or status

🧱 Data Model
Appointment Model
Field	Type	Description
doctor_id	ObjectId	The single clinic doctor
patient_id	ObjectId	Linked patient
clinic_id	ObjectId	Doctor's clinic
start_time	Date	Appointment date/time
status	enum	pending / confirmed / cancelled / completed
reason	String	Optional reason provided by patient
notes	String	Doctor notes
source	enum	patient_app / doctor_panel / admin_panel
🔧 Business Logic
✔ Single-doctor system

No doctor selection by patient

Backend automatically detects the only doctor profile

If clinic exists → auto-link to appointment

✔ Patients

Only book for themselves

Only cancel their own appointments

✔ Doctors

Can confirm / cancel / complete appointments

✔ Admin

Full visibility across the entire system

🔗 API Endpoints
🟩 Patient Endpoints
Method	Endpoint	Description
POST	/api/appointments	Create appointment (auto-assign doctor + clinic)
GET	/api/appointments/my	Get logged-in patient’s appointments
PATCH	/api/appointments/cancel/:id	Cancel own appointment
🟦 Doctor Endpoints
Method	Endpoint	Description
GET	/api/appointments/doctor	Get doctor appointments
PATCH	/api/appointments/confirm/:id	Confirm appointment
PATCH	/api/appointments/cancel/:id	Cancel appointment
PATCH	/api/appointments/complete/:id	Complete appointment
🟪 Admin Endpoints
Method	Endpoint	Description
GET	/api/appointments	Get all appointments (with filters)
📁 File Structure Added in Sprint 4
src/
 ├── models/
 │     └── Appointment.js
 ├── controllers/
 │     └── appointment.controller.js
 ├── routes/
 │     └── appointment.routes.js

🧪 Postman Testing Checklist
✔ Patient Tests

Register patient

Create Patient Profile

POST /api/appointments

GET /api/appointments/my

PATCH /api/appointments/cancel/:id

✔ Doctor Tests

Login doctor

GET /api/appointments/doctor

Confirm appointment

Cancel appointment

Complete appointment

✔ Admin Tests

Login admin

GET /api/appointments (with filters)

⭐ Sprint Success Criteria

✔ Appointment model implemented
✔ Patient booking flow completed
✔ Single-doctor logic enabled
✔ Full CRUD for appointment lifecycle
✔ Proper role-based access (patient/doctor/admin)
✔ Testing done in Postman
✔ Code merged into development
✔ Documentation updated

📌 Next Sprint: Sprint 5 — Prescriptions Module

Will include:

Prescription creation

Prescription items

Patient access

Doctor controls

Linking with appointment