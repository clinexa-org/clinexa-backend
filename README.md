# Clinexa Backend – Sprint 2 (Doctors & Clinics Module)

## 🚀 Overview

Sprint 2 adds core medical features to the Clinexa platform by enabling doctors
to create their profiles and set up their clinics.  
These modules represent the primary building blocks before appointments, patients,
and prescriptions can be implemented in future sprints.

This sprint extends the system beyond authentication and introduces real domain logic.

---

## 🎯 Sprint Objectives

### 1) Doctors Module
- Create & update doctor profile  
- Link doctor to authenticated user  
- Fetch doctor profile (public & private views)  
- Expose doctor listing API for the mobile app  
- Prevent duplicate doctor profiles (Upsert logic)

### 2) Clinics Module
- Create/update a clinic (Upsert)  
- Link clinic → doctor  
- Fetch clinic owned by the doctor  
- Public endpoint to get clinic for any doctor  
- Enforce one-clinic-per-doctor rule (V1 limitation)

---

## 📦 Added Models

### **Doctor Model**
- `user_id` (ref: User)  
- `specialty`  
- `bio`  
- `years_of_experience`  
- `clinic_id` (ref: Clinic)  
- timestamps  

### **Clinic Model**
- `doctor_id` (ref: Doctor)  
- `name`  
- `address`  
- `city`  
- `phone`  
- `location_link`  
- timestamps  

---

## 🧱 API Endpoints

### 🔵 **Doctors**
| Method | Endpoint | Description | Auth |
|-------|----------|-------------|------|
| POST | `/api/doctors` | Create/Update doctor profile *(Upsert)* | Doctor Only |
| GET | `/api/doctors/me` | Get logged-in doctor profile | Doctor Only |
| PUT | `/api/doctors` | Update doctor profile | Doctor Only |
| GET | `/api/doctors` | Get all doctors (public) | Public |
| GET | `/api/doctors/:id` | Get doctor by ID | Public |

---

### 🟢 **Clinics**
| Method | Endpoint | Description | Auth |
|-------|----------|-------------|------|
| POST | `/api/clinics` | Create or update clinic *(Upsert)* | Doctor Only |
| GET | `/api/clinics/me` | Get clinic for logged-in doctor | Doctor Only |
| GET | `/api/clinics/:doctorId` | Get clinic by doctor | Public |

---

## ⚙️ Business Rules

### Doctor Module
- Each user with role `doctor` can only have **one doctor profile**.  
- If doctor profile exists → update it.  
- If not → create one.

### Clinic Module
- Each doctor can only have **one clinic** in V1.  
- Clinic auto-links to doctor through `doctor_id`.  
- Doctor auto-updates `clinic_id` after clinic creation.

---

## 📁 File Structure (Added in Sprint 2)


src/
├── controllers/
│ ├── doctor.controller.js
│ └── clinic.controller.js
├── models/
│ ├── Doctor.js
│ └── Clinic.js
├── routes/
│ ├── doctor.routes.js
│ └── clinic.routes.js