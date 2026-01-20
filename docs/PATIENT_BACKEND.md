# Patient Backend Documentation (Clinexa)

## 1. Overview

This document outlines the **implemented** API contracts for the **Patient Domain** in the Clinexa V1 backend.

**Base URL**: `/api`
**Headers**:

```http
Content-Type: application/json
Authorization: Bearer <your_jwt_token>
```

---

## 2. Auth (Shared)

### Register (Patient)

- **POST** `/auth/register`
- **Body**: `{ "name": "...", "email": "...", "password": "..." }`
- **Note**: Always creates role `patient`.

### Login

- **POST** `/auth/login`
- **Body**: `{ "email": "...", "password": "..." }`

### Get Me

- **GET** `/auth/me`
- **Auth**: Yes

### Forgot Password

- **POST** `/auth/forgot-password`
- **Body**: `{ "email": "..." }`
- **Response**: `{ "success": true, "message": "Password reset OTP sent..." }`

### Reset Password

- **POST** `/auth/reset-password`
- **Body**: `{ "email": "...", "otp": "...", "newPassword": "..." }`

---

## 3. Patient Profile

### Create/Update Profile

- **POST** `/patients`
- **Auth**: Yes
- **Type**: `multipart/form-data` (if uploading avatar) or JSON
- **Fields**: `age`, `gender`, `phone`, `address`, `avatar` (file), `name` (updates user)

### Get My Profile

- **GET** `/patients/me`
- **Auth**: Yes
- **Returns**: Patient object with populated `user_id`.

---

## 4. Scheduling & Appointments

### Get Available Slots

- **GET** `/appointments/available?date=YYYY-MM-DD`
- **Auth**: Yes
- **Response**:

```json
{
  "success": true,
  "data": {
    "date": "2024-03-20",
    "timezone": "Africa/Cairo",
    "slotDurationMinutes": 30,
    "slots": ["2024-03-20T09:00:00.000Z", ...]
  }
}
```

- **Note**: Returns ALL available slots for the date. **Client must filter out past slots.**

### Create Appointment

- **POST** `/appointments`
- **Auth**: Yes
- **Body**:

```json
{
  "start_time": "2024-03-20T09:00:00.000Z",
  "reason": "Checkup",
  "notes": "Optional notes"
}
```

- **Constraint**: Doctor is auto-assigned (V1).
- **Errors**:
  - `409`: "This time slot is already booked"
  - `409`: "Clinic is not configured" (Mismatch: Current code allows null clinic, pending fix)

### List My Appointments

- **GET** `/appointments/my`
- **Auth**: Yes
- **Returns**: List of appointments sorted by time.

### Cancel Appointment

- **PATCH** `/appointments/cancel/:id`
- **Auth**: Yes (Owner only)
- **Body**: `{ "reason": "Optional" }`
- **Rules**: Only `pending` or `confirmed`. Clears slot for rebooking.

### Reschedule Appointment

- **PATCH** `/appointments/reschedule/:id`
- **Auth**: Yes (Owner only)
- **Body**: `{ "start_time": "..." }`

---

## 5. Prescriptions

### List My Prescriptions

- **GET** `/prescriptions/my`
- **Auth**: Yes

### Get Prescription Details

- **GET** `/prescriptions/:id`
- **Auth**: Yes (Owner only)

---

## 6. Doctors (Public)

### Get All Doctors

- **GET** `/doctors`

### Get Doctor Details

- **GET** `/doctors/:id`
