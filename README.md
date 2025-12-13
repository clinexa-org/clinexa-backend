# Clinexa Backend – Sprint 5 (Prescriptions Module)

## 🚀 Overview
Sprint 5 introduces the **Prescriptions Module**, enabling doctors to create medical prescriptions for patients and allowing patients to view their prescriptions inside the Clinexa patient app.

In V1, prescriptions are stored as structured JSON (no PDF generation yet).  
PDF export and richer medical records will be part of V2.

---

## 🎯 Sprint Objectives

### ✅ Doctor
- Create a prescription for a patient
- Add prescription items (medications)
- Update an existing prescription
- View prescriptions by patient
- View prescriptions by appointment

### ✅ Patient
- View all own prescriptions
- View a specific prescription (only if it belongs to the patient)

### ✅ Admin
- View all prescriptions (overview)

---

## 🧱 Data Model

### **Prescription**
| Field | Type | Description |
|------|------|-------------|
| doctor_id | ObjectId | Linked doctor |
| patient_id | ObjectId | Linked patient |
| appointment_id | ObjectId (optional) | Linked appointment (recommended) |
| notes | String | General notes from doctor |
| items | Array | List of prescription items |
| timestamps | Date | createdAt / updatedAt |

### **Prescription Item (embedded)**
| Field | Type | Description |
|------|------|-------------|
| name | String | Medication name (required) |
| dosage | String | Example: `1x daily` |
| duration | String | Example: `5 days` |
| instructions | String | Example: `After food` |

---

## 🔗 API Endpoints

### 🟦 Doctor Routes
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/prescriptions` | Create prescription | doctor |
| PUT | `/api/prescriptions/:id` | Update prescription | doctor |
| GET | `/api/prescriptions/:id` | Get prescription by ID | doctor/admin/patient* |
| GET | `/api/prescriptions/patient/:patientId` | Get prescriptions by patient | doctor/admin |
| GET | `/api/prescriptions/appointment/:appointmentId` | Get prescriptions by appointment | doctor/admin |

> *Patient can only access a prescription if it belongs to their own account.*

---

### 🟩 Patient Routes
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/prescriptions/my` | Get my prescriptions | patient |

---

### 🟪 Admin Routes
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/prescriptions` | Get all prescriptions | admin |

---

## ⚙️ Business Rules (V1)

- A prescription must belong to exactly one patient and one doctor.
- The prescription may optionally link to an appointment.
- Only doctors can create or update prescriptions.
- Patients can only view prescriptions that belong to them.
- Admin has read access to all prescriptions for reporting and monitoring.
- In V1, prescriptions are stored as JSON (PDF will be implemented in V2).

---

## 📁 File Structure Added in Sprint 5

src/
├── models/
│ └── Prescription.js
├── controllers/
│ └── prescription.controller.js
├── routes/
│ └── prescription.routes.js

yaml
Copy code

---

## 🧪 Postman Testing Checklist

### ✅ Doctor
1. Login as doctor → set token  
2. Create prescription: `POST /api/prescriptions`
3. Update prescription: `PUT /api/prescriptions/:id`
4. Get by patient: `GET /api/prescriptions/patient/:patientId`
5. Get by appointment: `GET /api/prescriptions/appointment/:appointmentId`

### ✅ Patient
1. Login as patient → set token  
2. Get my prescriptions: `GET /api/prescriptions/my`

### ✅ Admin
1. Login as admin → set token  
2. Get all prescriptions: `GET /api/prescriptions`

---

## 🏁 Sprint 5 Completion Criteria

✔ Prescription model implemented  
✔ Items embedded schema implemented  
✔ Role-based access working (doctor/patient/admin)  
✔ Patient restricted access verified  
✔ Linked correctly with patients and optional appointments  
✔ Tested through Postman  
✔ Documentation updated  

---

## 📌 Next Sprint: Sprint 6 — Admin Module (Clinic Owner Admin)

Sprint 6 will focus on:
- Managing patients (activate/deactivate)
- Appointments management dashboard
- Basic stats
- Prescriptions overview
- Clinic settings endpoints
لو تحب، أجهز لك كمان Checklist سريع تقفل بيه س
