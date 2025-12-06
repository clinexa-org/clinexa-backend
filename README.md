# Clinexa Backend – Sprint 3 (Patients Module)

## 🚀 Overview

Sprint 3 introduces the Patient Module — one of the core building blocks of Clinexa.  
Patients represent the primary end users who will create appointments, view prescriptions, and interact with doctors.

This sprint implements:
- Patient model
- Patient profile management (Upsert)
- Admin access to all patients
- Doctor access to specific patient details
- Standardized response structure

---

## 🎯 Sprint Objectives

### 1. Patient Module
- Create or update patient profile (Upsert logic)
- Retrieve logged-in patient's profile
- Retrieve all patients (Admin only)
- Retrieve patient by ID (Doctor only)
- Link patient ↔ user_id

---

## 📦 Added Model

### **Patient Model**
Fields:
- `user_id` (ref: User)
- `age`
- `gender` (male/female)
- `phone`
- `address`
- timestamps

---

## 🧱 API Endpoints

### 🔵 **Patient Profile**
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/patients` | Create/Update patient profile *(Upsert)* | patient |
| GET | `/api/patients/me` | Get logged-in patient's data | patient |

---

### 🟢 **Admin Access**
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/patients` | Get all patients | admin |

---

### 🟣 **Doctor Access**
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/patients/:id` | Get patient by ID | doctor |

---

## 📁 File Structure (Added in Sprint 3)

src/
├── controllers/
│ └── patient.controller.js
├── models/
│ └── Patient.js
├── routes/
│ └── patient.routes.js
