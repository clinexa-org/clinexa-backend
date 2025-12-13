# Clinexa Backend – Sprint 6 (Admin Module — Clinic Owner Admin)

## 🚀 Overview
Sprint 6 introduces the **Admin Module** for Clinexa V1 (Single-Doctor Clinic).  
In this version, the admin is a **clinic-owner admin** (or a dedicated admin account) responsible for:
- Monitoring core metrics
- Managing patients
- Managing appointments
- Viewing prescriptions
- Updating clinic settings

> Note: This is NOT a multi-doctor platform admin. V1 assumes **one doctor per system**.

---

## 🎯 Sprint Objectives

### ✅ Admin Dashboard
- Provide basic stats (patients, appointments, prescriptions)
- Track appointments today and by status

### ✅ Patient Management
- List all patients with their user data
- Activate/Deactivate a patient account (toggle `User.is_active`)

### ✅ Appointment Management
- List all appointments with filters
- Update appointment status (pending/confirmed/cancelled/completed)

### ✅ Prescriptions Overview
- Read-only view of all prescriptions

### ✅ Clinic Settings
- View clinic settings
- Update clinic settings

---

## 🧱 API Endpoints

### 🟦 Dashboard
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/admin/stats` | Get dashboard statistics | admin |

---

### 🟩 Patients Management
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/admin/patients` | List all patients | admin |
| PATCH | `/api/admin/patients/:id/toggle-active` | Toggle patient active status | admin |

> `:id` here is **Patient._id** (not User._id)

---

### 🟨 Appointments Management
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/admin/appointments?status=&date=` | List appointments (filters) | admin |
| PATCH | `/api/admin/appointments/:id/status` | Update appointment status | admin |

Allowed status values:
- `pending`
- `confirmed`
- `cancelled`
- `completed`

---

### 🟪 Prescriptions Overview
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/admin/prescriptions` | List all prescriptions | admin |

---

### 🟫 Clinic Settings
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/admin/clinic` | Get clinic settings | admin |
| PUT | `/api/admin/clinic` | Update clinic settings | admin |

> Single-doctor system → clinic is resolved automatically from the only doctor in DB.

---

## 📁 File Structure Added in Sprint 6

src/
├── controllers/
│ └── admin.controller.js
├── routes/
│ └── admin.routes.js

yaml
Copy code

---

## ⚙️ Business Rules (V1)

- Admin endpoints are protected by `role("admin")`.
- Patient activation toggles `User.is_active` via linked `Patient.user_id`.
- Appointment listing supports optional filters:
  - `status=pending`
  - `date=YYYY-MM-DD`
- Clinic settings endpoints resolve the clinic based on the single doctor in the system.

---

## 🧪 Postman Testing Checklist

1) Login as admin → set token  
2) GET `/api/admin/stats`  
3) GET `/api/admin/patients`  
4) PATCH `/api/admin/patients/:id/toggle-active`  
5) GET `/api/admin/appointments?status=pending`  
6) PATCH `/api/admin/appointments/:id/status` with `{ "status": "confirmed" }`  
7) GET `/api/admin/prescriptions`  
8) GET `/api/admin/clinic`  
9) PUT `/api/admin/clinic` (update data)

---

## 🏁 Sprint 6 Completion Criteria

✔ Admin routes implemented  
✔ Stats endpoint working  
✔ Patients management works (toggle active)  
✔ Appointments list + status update working  
✔ Prescriptions overview working  
✔ Clinic settings read/update working  
✔ Tested via Postman  
✔ Documentation updated  

---

## 📌 Next Sprint: Sprint 7 — Notifications (Basic V1)

- Email notifications on:
  - appointment created
  - appointment confirmed
  - appointment cancelled
- Simple service integration inside controllers