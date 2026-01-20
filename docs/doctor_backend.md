# Doctor Backend Documentation (Clinexa)

## 1. Overview

This document outlines the **implemented** API contracts for the **Doctor Domain** in the Clinexa V1 backend.

**Base URL**: `/api`
**Headers**:

```http
Content-Type: application/json
Authorization: Bearer <your_jwt_token>
```

---

## 2. Shared Auth

Doctors use the same auth endpoints but must have `role: "doctor"`.

### Login

- **POST** `/auth/login`
- **Body**: `{ "email": "...", "password": "..." }`

### Forgot Password

- **POST** `/auth/forgot-password`

### Reset Password

- **POST** `/auth/reset-password`

---

## 3. Doctor Profile

### Create Profile

- **POST** `/doctors`
- **Auth**: Yes (Doctor)
- **Body**: `{ "specialty": "...", "bio": "...", "years_of_experience": 10 }`

### Get My Profile

- **GET** `/doctors/me`
- **Auth**: Yes (Doctor)
- **Returns**: Doctor profile + Clinic ID.

### Update Profile

- **PUT** `/doctors`
- **Body**: `{ "specialty": "...", "bio": "...", "years_of_experience": ... }`

---

## 4. Clinic & Schedule

### Create/Update Clinic

- **POST** `/clinics`
- **Auth**: Yes (Doctor)
- **Body**: `{ "name": "...", "address": "...", "city": "...", "phone": "..." }`

### Get My Clinic

- **GET** `/clinics/me`
- **Auth**: Yes (Doctor)
- **Returns**: Full clinic details.

### Get Working Hours

- **GET** `/clinics/working-hours/me`
- **Auth**: Yes (Doctor)
- **Returns**: `{ timezone, slotDurationMinutes, weekly, exceptions }`

### Update Working Hours

- **PUT** `/clinics/working-hours/me`
- **Auth**: Yes (Doctor)
- **Body**:

```json
{
  "timezone": "Africa/Cairo",
  "slotDurationMinutes": 30,
  "weekly": [
    { "day": "sat", "enabled": true, "from": "09:00", "to": "17:00" },
    ...
  ],
  "exceptions": []
}
```

---

## 5. Appointments

### List My Appointments

- **GET** `/appointments/doctor?date=YYYY-MM-DD`
- **Auth**: Yes (Doctor)
- **Returns**: List of appointments with populated patient details.

### Confirm Appointment

- **PATCH** `/appointments/confirm/:id`
- **Auth**: Yes (Doctor)
- **Rules**: `pending` → `confirmed`

### Complete Appointment

- **PATCH** `/appointments/complete/:id`
- **Auth**: Yes (Doctor)
- **Rules**: `confirmed` → `completed`
- **Errors**: `409` if not confirmed.

### Cancel Appointment

- **PATCH** `/appointments/cancel/:id`
- **Auth**: Yes (Doctor)
- **Body**: `{ "reason": "..." }`
- **Rules**: `pending` or `confirmed` → `cancelled`.

---

## 6. Prescriptions

### Create Prescription

- **POST** `/prescriptions`
- **Auth**: Yes (Doctor)
- **Body**: `{ "patient_id": "...", "appointment_id": "...", "items": [...], "notes": "..." }`
- **Constraints**:
  - `appointment_id` must be `completed`.
  - Only 1 prescription per appointment.

### Update Prescription

- **PUT** `/prescriptions/:id`
- **Auth**: Yes (Doctor)

### Get Prescription

- **GET** `/prescriptions/:id`
- **Auth**: Yes (Doctor)

### List by Patient

- **GET** `/prescriptions/patient/:patientId`
- **Auth**: Yes (Doctor)
- **Check**: Must have at least one appointment with this patient.

### List by Appointment

- **GET** `/prescriptions/appointment/:appointmentId`
- **Auth**: Yes (Doctor)
- **Returns**: List (0 or 1 items).
